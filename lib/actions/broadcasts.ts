"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { render } from "@react-email/components";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getResend, isEmailDispatchEnabled } from "@/lib/email/resend";
import { buildUnsubscribeUrl } from "@/lib/email/tokens";
import { BroadcastEmail } from "@/emails/Broadcast";
import { siteConfig } from "@/siteConfig";

const Schema = z.object({
  channels: z.array(z.enum(["email", "sms"])).min(1, "Pick at least one channel"),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Body required").max(8000),
  is_emergency: z.boolean(),
  also_archive_as_announcement: z.boolean(),
  scheduled_for: z.string().trim().optional().or(z.literal("")),
});

export type BroadcastState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  broadcastId?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) throw new Error("Not an admin");
  return { supabase, userId: user.id };
}

function fmtErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !out[k]) out[k] = i.message;
  }
  return out;
}

export async function createBroadcastAction(
  _prev: BroadcastState | undefined,
  formData: FormData
): Promise<BroadcastState> {
  // FormData arrays come as multiple entries with the same key
  const channels = formData.getAll("channels").filter(
    (v): v is string => typeof v === "string"
  );

  const parsed = Schema.safeParse({
    channels: channels.length ? channels : [],
    subject: formData.get("subject") ?? "",
    body: formData.get("body"),
    is_emergency: formData.get("is_emergency") === "on",
    also_archive_as_announcement:
      formData.get("also_archive_as_announcement") === "on",
    scheduled_for: formData.get("scheduled_for") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: fmtErrors(parsed.error) };
  }

  // If the platform has SMS disabled, drop SMS from the channels list
  let channelsToUse = parsed.data.channels;
  if (!siteConfig.features.smsEnabled) {
    channelsToUse = channelsToUse.filter((c) => c !== "sms");
  }
  if (channelsToUse.length === 0) {
    return {
      ok: false,
      error: "No channels selected (SMS is disabled in this deploy).",
    };
  }

  const { supabase, userId } = await requireAdmin();

  // Optionally archive as an announcement first so we can store the ID
  let announcementId: string | null = null;
  if (parsed.data.also_archive_as_announcement) {
    const title = parsed.data.subject || "Community update";
    const { data: ann } = await supabase
      .from("announcements")
      .insert({
        title,
        body: parsed.data.body,
        is_active: true,
        display_order: 100, // newer broadcasts sort lower by default
      })
      .select("id")
      .single();
    announcementId = ann?.id ?? null;
  }

  const scheduledFor = parsed.data.scheduled_for
    ? new Date(parsed.data.scheduled_for).toISOString()
    : null;

  const { data: created, error } = await supabase
    .from("broadcasts")
    .insert({
      sent_by: userId,
      channels: channelsToUse,
      audience: "all_members",
      subject: parsed.data.subject || null,
      body: parsed.data.body,
      is_emergency: parsed.data.is_emergency,
      also_archive_as_announcement: parsed.data.also_archive_as_announcement,
      announcement_id: announcementId,
      scheduled_for: scheduledFor,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Couldn't create broadcast." };
  }

  await supabase.from("audit_log").insert({
    actor_id: userId,
    action: "create",
    entity_type: "broadcast",
    entity_id: created.id,
    diff: {
      channels: channelsToUse,
      is_emergency: parsed.data.is_emergency,
      scheduled: Boolean(scheduledFor),
    },
  });

  // Send now if not scheduled
  if (!scheduledFor) {
    await dispatchBroadcastImpl(created.id);
  }

  revalidatePath("/admin/broadcasts");
  revalidatePath("/admin");
  redirect(`/admin/broadcasts/${created.id}?sent=${scheduledFor ? 0 : 1}`);
}

/**
 * Manually fire a scheduled broadcast (or re-fire a failed one). Admin-only.
 */
export async function dispatchBroadcastAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await requireAdmin();
  await dispatchBroadcastImpl(id);
  revalidatePath(`/admin/broadcasts/${id}`);
}

/**
 * Fan out a broadcast to all opted-in recipients across selected channels.
 * Synchronous. For a 200-household HOA this completes in seconds.
 */
async function dispatchBroadcastImpl(broadcastId: string): Promise<void> {
  // Use service-role here: we need to read auth.users for emails and
  // bypass RLS for inserting per-recipient delivery rows.
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: broadcast } = await admin
    .from("broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .maybeSingle();
  if (!broadcast) return;
  if (broadcast.sent_at) return; // already dispatched

  const isEmergency = !!broadcast.is_emergency;
  const channels = (broadcast.channels as string[]) ?? [];

  // Pull approved-member profiles with their opt-in flags + phone
  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, email_broadcast_opt_in, email_emergency_opt_in, sms_phone, sms_phone_verified, sms_broadcast_opt_in, sms_emergency_opt_in"
    )
    .eq("is_approved", true);

  if (!profiles || profiles.length === 0) {
    await admin
      .from("broadcasts")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", broadcastId);
    return;
  }

  // Look up emails from auth.users (profiles don't store email)
  const { data: authList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailMap = new Map<string, string>();
  for (const u of authList?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Build delivery rows + dispatch
  const deliveries: Array<{
    recipient_user_id: string;
    recipient_email: string | null;
    recipient_phone: string | null;
    channel: "email" | "sms";
  }> = [];

  for (const p of profiles) {
    if (channels.includes("email")) {
      const eligible = isEmergency
        ? p.email_emergency_opt_in
        : p.email_broadcast_opt_in;
      const email = emailMap.get(p.id);
      if (eligible && email) {
        deliveries.push({
          recipient_user_id: p.id,
          recipient_email: email,
          recipient_phone: null,
          channel: "email",
        });
      }
    }
    if (channels.includes("sms") && siteConfig.features.smsEnabled) {
      const eligible = isEmergency
        ? p.sms_emergency_opt_in
        : p.sms_broadcast_opt_in;
      if (eligible && p.sms_phone && p.sms_phone_verified) {
        deliveries.push({
          recipient_user_id: p.id,
          recipient_email: null,
          recipient_phone: p.sms_phone,
          channel: "sms",
        });
      }
    }
  }

  // Insert all delivery rows queued first
  let insertedIds: string[] = [];
  if (deliveries.length > 0) {
    const { data: inserted } = await admin
      .from("broadcast_deliveries")
      .insert(
        deliveries.map((d) => ({
          broadcast_id: broadcastId,
          ...d,
          status: "queued",
        }))
      )
      .select("id");
    insertedIds = (inserted ?? []).map((r) => r.id);
  }

  // Dispatch each delivery (sequential; could batch with Resend later)
  const fromAddress =
    process.env.EMAIL_FROM_ADDRESS ?? "no-reply@example.com";
  const fromName = process.env.EMAIL_FROM_NAME ?? siteConfig.email.fromName;

  const resend = isEmailDispatchEnabled() ? getResend()! : null;

  for (let i = 0; i < deliveries.length; i++) {
    const d = deliveries[i];
    const deliveryId = insertedIds[i];

    if (d.channel === "email" && d.recipient_email) {
      const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, d.recipient_user_id);
      const html = await render(
        BroadcastEmail({
          subject: broadcast.subject || "Community update",
          body: broadcast.body,
          isEmergency,
          unsubscribeUrl,
        })
      );
      const text = await render(
        BroadcastEmail({
          subject: broadcast.subject || "Community update",
          body: broadcast.body,
          isEmergency,
          unsubscribeUrl,
        }),
        { plainText: true }
      );

      if (!resend) {
        await admin
          .from("broadcast_deliveries")
          .update({
            status: "failed",
            error: "RESEND_API_KEY not configured",
          })
          .eq("id", deliveryId);
        continue;
      }

      const { data: sent, error: sendErr } = await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: d.recipient_email,
        subject: broadcast.subject || "Community update",
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (sendErr) {
        await admin
          .from("broadcast_deliveries")
          .update({ status: "failed", error: sendErr.message })
          .eq("id", deliveryId);
      } else {
        await admin
          .from("broadcast_deliveries")
          .update({
            status: "sent",
            provider_message_id: sent?.id ?? null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", deliveryId);
      }
    } else if (d.channel === "sms" && d.recipient_phone) {
      // SMS dispatch path — present but inert until Twilio is configured.
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioMsgSvc = process.env.TWILIO_MESSAGING_SERVICE_SID;
      if (!twilioSid || !twilioToken || !twilioMsgSvc) {
        await admin
          .from("broadcast_deliveries")
          .update({
            status: "failed",
            error: "Twilio not configured",
          })
          .eq("id", deliveryId);
        continue;
      }

      // Compose SMS body (no HTML; include STOP instructions for TCPA)
      const smsBody =
        (broadcast.subject ? `${broadcast.subject}\n\n` : "") +
        broadcast.body +
        `\n\nReply STOP to opt out.`;

      // Twilio REST call (lightweight, no SDK dep)
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            MessagingServiceSid: twilioMsgSvc,
            To: d.recipient_phone,
            Body: smsBody,
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        await admin
          .from("broadcast_deliveries")
          .update({
            status: "failed",
            error: `Twilio ${resp.status}: ${errText.slice(0, 500)}`,
          })
          .eq("id", deliveryId);
      } else {
        const body = (await resp.json()) as { sid?: string };
        await admin
          .from("broadcast_deliveries")
          .update({
            status: "sent",
            provider_message_id: body.sid ?? null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", deliveryId);
      }
    }
  }

  await admin
    .from("broadcasts")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", broadcastId);
}
