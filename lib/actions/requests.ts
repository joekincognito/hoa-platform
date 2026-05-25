"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { RequestSubmittedEmail } from "@/emails/RequestSubmitted";
import { RequestStatusChangeEmail } from "@/emails/RequestStatusChange";
import {
  ALLOWED_TRANSITIONS,
  REQUEST_STATUSES,
  REQUEST_TYPE_LABEL,
} from "@/lib/workflow/requests";

const NewRequestSchema = z.object({
  // Request types are now stored in the request_types table; we validate
  // the FK at insert time instead of enum-checking here.
  type: z.string().min(1, "Pick a request type").max(80),
  address: z.string().trim().min(1, "Address required").max(300),
  title: z.string().trim().min(3, "Title too short").max(200),
  description: z.string().trim().min(10, "Please describe the request").max(5000),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export type NewRequestState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFromZod(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !out[k]) out[k] = i.message;
  }
  return out;
}

export async function createRequestAction(
  _prev: NewRequestState | undefined,
  formData: FormData
): Promise<NewRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not logged in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_approved")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_approved)
    return {
      ok: false,
      error: "Your account is still pending board approval.",
    };

  const parsed = NewRequestSchema.safeParse({
    type: formData.get("type"),
    address: formData.get("address"),
    title: formData.get("title"),
    description: formData.get("description"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  // Try to link to an existing property (best-effort case-insensitive match)
  const { data: matchedProperty } = await supabase
    .from("properties")
    .select("id")
    .ilike("address", parsed.data.address)
    .maybeSingle();

  const insertRow = {
    type: parsed.data.type,
    status: "submitted" as const,
    property_id: matchedProperty?.id ?? null,
    submitted_by: user.id,
    submitter_name: profile?.full_name ?? null,
    submitter_email: user.email ?? null,
    title: parsed.data.title,
    description: parsed.data.description,
    reason: parsed.data.reason || null,
  };

  const { data: created, error } = await supabase
    .from("requests")
    .insert(insertRow)
    .select("id")
    .single();
  if (error || !created) {
    console.error("requests insert failed", error);
    return { ok: false, error: "Couldn't save your request." };
  }

  // Handle attachments. Skipped gracefully if nothing uploaded.
  const files = formData.getAll("files") as File[];
  for (const file of files) {
    if (!file || typeof file === "string" || file.size === 0) continue;
    if (file.size > 20 * 1024 * 1024) continue; // hard skip oversized
    const ext = file.name.split(".").pop() || "bin";
    const path = `requests/${created.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      console.error("attachment upload failed", upErr);
      continue;
    }
    await supabase.from("attachments").insert({
      entity_type: "request",
      entity_id: created.id,
      file_path: path,
      file_type: file.type || null,
      uploaded_by: user.id,
    });
  }

  // Audit log entry (best-effort)
  await supabase
    .from("audit_log")
    .insert({
      actor_id: user.id,
      action: "create",
      entity_type: "request",
      entity_id: created.id,
      diff: { type: parsed.data.type, status: "submitted" },
    });

  // Confirmation email to submitter
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (user.email && profile?.full_name) {
    await sendEmail({
      template: "request_submitted",
      to: user.email,
      subject: `We received your ${(REQUEST_TYPE_LABEL[parsed.data.type] ?? parsed.data.type).toLowerCase()} request`,
      body: RequestSubmittedEmail({
        submitterName: profile.full_name,
        requestTitle: parsed.data.title,
        requestType: (REQUEST_TYPE_LABEL[parsed.data.type] ?? parsed.data.type),
        viewUrl: `${siteUrl}/my-requests/${created.id}`,
      }),
      relatedEntityType: "request",
      relatedEntityId: created.id,
    }).catch((e) => console.error("submit email failed", e));
  }

  revalidatePath("/my-requests");
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  redirect(`/my-requests/${created.id}?new=1`);
}

// ----------------------- Withdraw (member action) --------------------------

export async function withdrawRequestAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: req } = await supabase
    .from("requests")
    .select("status, submitted_by")
    .eq("id", id)
    .maybeSingle();
  if (!req || req.submitted_by !== user.id) return;
  if (!ALLOWED_TRANSITIONS[req.status as keyof typeof ALLOWED_TRANSITIONS]?.includes("withdrawn")) return;

  await supabase
    .from("requests")
    .update({ status: "withdrawn" })
    .eq("id", id);
  await supabase.from("status_events").insert({
    entity_type: "request",
    entity_id: id,
    actor_id: user.id,
    from_status: req.status,
    to_status: "withdrawn",
    comment: "Withdrawn by submitter",
    is_public: true,
  });

  revalidatePath(`/my-requests/${id}`);
  revalidatePath("/my-requests");
  revalidatePath("/admin/requests");
}

// ----------------------- Admin status change -------------------------------

const StatusChangeSchema = z.object({
  to_status: z.enum(REQUEST_STATUSES),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  is_public: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional(),
});

export async function changeRequestStatusAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) return { ok: false, error: "Missing request id." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not logged in." };

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) return { ok: false, error: "Not an admin." };

  const parsed = StatusChangeSchema.safeParse({
    to_status: formData.get("to_status"),
    comment: formData.get("comment") ?? "",
    is_public: formData.get("is_public") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { data: req } = await supabase
    .from("requests")
    .select("id, status, type, title, submitter_name, submitter_email")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { ok: false, error: "Request not found." };

  const fromStatus = req.status as keyof typeof ALLOWED_TRANSITIONS;
  const toStatus = parsed.data.to_status;
  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus) && fromStatus !== toStatus) {
    return {
      ok: false,
      error: `Cannot change ${fromStatus} → ${toStatus}.`,
    };
  }

  const isPublic =
    parsed.data.is_public === "on" || parsed.data.is_public === "true";

  await supabase
    .from("requests")
    .update({ status: toStatus })
    .eq("id", requestId);

  await supabase.from("status_events").insert({
    entity_type: "request",
    entity_id: requestId,
    actor_id: user.id,
    from_status: fromStatus,
    to_status: toStatus,
    comment: parsed.data.comment || null,
    is_public: isPublic,
  });

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "status_change",
    entity_type: "request",
    entity_id: requestId,
    diff: { from: fromStatus, to: toStatus, comment: parsed.data.comment || null },
  });

  // Notify submitter when the change is public-facing
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (isPublic && req.submitter_email && req.submitter_name) {
    await sendEmail({
      template: "request_status_change",
      to: req.submitter_email,
      subject: `Update on your request: "${req.title}"`,
      body: RequestStatusChangeEmail({
        submitterName: req.submitter_name,
        requestTitle: req.title,
        newStatus: toStatus,
        comment: parsed.data.comment || undefined,
        viewUrl: `${siteUrl}/my-requests/${requestId}`,
      }),
      relatedEntityType: "request",
      relatedEntityId: requestId,
    }).catch((e) => console.error("status email failed", e));
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/my-requests/${requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return { ok: true };
}
