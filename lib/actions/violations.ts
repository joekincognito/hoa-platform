"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { ViolationWarningEmail } from "@/emails/ViolationWarning";
import { ViolationResolvedEmail } from "@/emails/ViolationResolved";
import { ViolationAppealFiledEmail } from "@/emails/ViolationAppealFiled";
import {
  ALLOWED_TRANSITIONS,
  VIOLATION_CATEGORIES,
  VIOLATION_STATUSES,
  WARNING_STATUSES,
  generateAppealToken,
  type ViolationCategory,
  type ViolationStatus,
} from "@/lib/workflow/violations";
import { pickOne } from "@/lib/format";

// --------------------------- Member: report a violation ----------------------

const ReportSchema = z.object({
  address: z.string().trim().min(1, "Address required").max(300),
  category: z.enum(VIOLATION_CATEGORIES),
  description: z.string().trim().min(10, "Please describe the issue").max(5000),
});

export type ReportState = {
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

export async function reportViolationAction(
  _prev: ReportState | undefined,
  formData: FormData
): Promise<ReportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not logged in." };

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name, is_approved")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_approved)
    return { ok: false, error: "Your account is still pending approval." };

  const parsed = ReportSchema.safeParse({
    address: formData.get("address"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };

  // Look up property by address (required — violations need a property_id)
  const { data: matchedProperty } = await supabase
    .from("properties")
    .select("id")
    .ilike("address", parsed.data.address)
    .maybeSingle();

  if (!matchedProperty) {
    return {
      ok: false,
      fieldErrors: {
        address:
          "We can't find that address in the property registry. Double-check spelling or ask an admin to add it.",
      },
    };
  }

  const { data: created, error } = await supabase
    .from("violations")
    .insert({
      property_id: matchedProperty.id,
      category: parsed.data.category,
      description: parsed.data.description,
      reported_by: user.id,
      reporter_name: me.full_name,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("violations insert failed", error);
    return { ok: false, error: "Couldn't save the report." };
  }

  // Photos
  const files = formData.getAll("files") as File[];
  for (const file of files) {
    if (!file || typeof file === "string" || file.size === 0) continue;
    if (file.size > 20 * 1024 * 1024) continue;
    const ext = file.name.split(".").pop() || "bin";
    const path = `violations/${created.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      console.error("violation attachment upload failed", upErr);
      continue;
    }
    await supabase.from("attachments").insert({
      entity_type: "violation",
      entity_id: created.id,
      file_path: path,
      file_type: file.type || null,
      uploaded_by: user.id,
    });
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "create",
    entity_type: "violation",
    entity_id: created.id,
    diff: { category: parsed.data.category, status: "pending_review" },
  });

  revalidatePath("/admin/violations");
  revalidatePath("/admin");
  redirect(`/my-violations?reported=1`);
}

// --------------------------- Admin: create directly -------------------------

const AdminCreateSchema = z.object({
  property_id: z.string().uuid("Pick a property"),
  category: z.enum(VIOLATION_CATEGORIES),
  description: z.string().trim().min(10, "Please describe the issue").max(5000),
});

export type AdminCreateState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  violationId?: string;
};

export async function adminCreateViolationAction(
  _prev: AdminCreateState | undefined,
  formData: FormData
): Promise<AdminCreateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not logged in." };

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) return { ok: false, error: "Not an admin." };

  const parsed = AdminCreateSchema.safeParse({
    property_id: formData.get("property_id"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };

  const { data: created, error } = await supabase
    .from("violations")
    .insert({
      property_id: parsed.data.property_id,
      category: parsed.data.category,
      description: parsed.data.description,
      reported_by: user.id,
      reporter_name: me.full_name,
      status: "pending_review",
    })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Couldn't create violation." };
  }

  // Photos
  const files = formData.getAll("files") as File[];
  for (const file of files) {
    if (!file || typeof file === "string" || file.size === 0) continue;
    if (file.size > 20 * 1024 * 1024) continue;
    const ext = file.name.split(".").pop() || "bin";
    const path = `violations/${created.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("attachments")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      console.error("violation attachment upload failed", upErr);
      continue;
    }
    await supabase.from("attachments").insert({
      entity_type: "violation",
      entity_id: created.id,
      file_path: path,
      file_type: file.type || null,
      uploaded_by: user.id,
    });
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "create",
    entity_type: "violation",
    entity_id: created.id,
    diff: { category: parsed.data.category, status: "pending_review", source: "admin" },
  });

  revalidatePath("/admin/violations");
  revalidatePath("/admin");
  redirect(`/admin/violations/${created.id}`);
}

// --------------------------- Admin: status change ----------------------------

const StatusSchema = z.object({
  to_status: z.enum(VIOLATION_STATUSES),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  fine_amount: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  is_public: z
    .union([
      z.literal("on"),
      z.literal("true"),
      z.literal("false"),
      z.literal(""),
    ])
    .optional(),
});

export async function changeViolationStatusAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const violationId = String(formData.get("violation_id") ?? "");
  if (!violationId) return { ok: false, error: "Missing violation id." };

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

  const parsed = StatusSchema.safeParse({
    to_status: formData.get("to_status"),
    comment: formData.get("comment") ?? "",
    fine_amount: formData.get("fine_amount") ?? "",
    is_public: formData.get("is_public") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { data: v } = await supabase
    .from("violations")
    .select(
      "id, status, category, description, appeal_token, properties(address, homeowner_name, homeowner_email)"
    )
    .eq("id", violationId)
    .maybeSingle();
  if (!v) return { ok: false, error: "Violation not found." };

  const fromStatus = v.status as ViolationStatus;
  const toStatus = parsed.data.to_status;
  const allowed = ALLOWED_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus) && fromStatus !== toStatus) {
    return { ok: false, error: `Cannot change ${fromStatus} → ${toStatus}.` };
  }

  // Fine amount required when moving to 'fined'
  let fineAmount: number | null = null;
  if (toStatus === "fined") {
    const n = Number(parsed.data.fine_amount);
    if (!Number.isFinite(n) || n <= 0) {
      return {
        ok: false,
        error: "A positive fine amount is required when marking as fined.",
      };
    }
    fineAmount = n;
  }

  // Generate appeal_token when first moving into a warning state
  const updates: Record<string, unknown> = { status: toStatus };
  if (WARNING_STATUSES.includes(toStatus) && !v.appeal_token) {
    updates.appeal_token = generateAppealToken();
  }
  if (toStatus === "fined") updates.fine_amount = fineAmount;
  if (toStatus === "resolved") updates.resolved_at = new Date().toISOString();

  const { error: upErr } = await supabase
    .from("violations")
    .update(updates)
    .eq("id", violationId);
  if (upErr) return { ok: false, error: upErr.message };

  // Re-fetch to get updated appeal_token if just set
  const { data: vAfter } = await supabase
    .from("violations")
    .select("appeal_token")
    .eq("id", violationId)
    .maybeSingle();

  // Internal-only by default for non-warning transitions; admins can override.
  // For warning/fined/resolved transitions, public is the default (the
  // homeowner needs to see them anyway via the appeal page).
  const isPublic =
    parsed.data.is_public === "on" || parsed.data.is_public === "true";

  await supabase.from("status_events").insert({
    entity_type: "violation",
    entity_id: violationId,
    actor_id: user.id,
    from_status: fromStatus,
    to_status: toStatus,
    comment: parsed.data.comment || null,
    is_public: isPublic,
  });

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action: "status_change",
    entity_type: "violation",
    entity_id: violationId,
    diff: {
      from: fromStatus,
      to: toStatus,
      comment: parsed.data.comment || null,
      fine_amount: fineAmount,
    },
  });

  // Email the homeowner for warning + fine + resolved transitions
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  type Prop = {
    address: string;
    homeowner_name: string | null;
    homeowner_email: string | null;
  };
  const property = pickOne<Prop>(
    v.properties as Prop | Prop[] | null
  );
  const homeownerEmail = property?.homeowner_email;
  const homeownerName = property?.homeowner_name ?? null;
  const address = property?.address ?? "your property";
  const appealUrl = `${siteUrl}/appeals/${vAfter?.appeal_token ?? v.appeal_token ?? ""}`;

  // Only email the homeowner if the change is public-facing
  if (isPublic && homeownerEmail && WARNING_STATUSES.includes(toStatus)) {
    await sendEmail({
      template: `violation_${toStatus}`,
      to: homeownerEmail,
      subject: `HOA notice for ${address}: ${toStatus.replace("_", " ")}`,
      body: ViolationWarningEmail({
        status: toStatus,
        homeownerName,
        address,
        category: v.category as ViolationCategory,
        description: v.description,
        fineAmount,
        comment: parsed.data.comment || undefined,
        appealUrl,
      }),
      relatedEntityType: "violation",
      relatedEntityId: violationId,
    }).catch((e) => console.error("violation email failed", e));
  } else if (isPublic && homeownerEmail && toStatus === "resolved") {
    await sendEmail({
      template: "violation_resolved",
      to: homeownerEmail,
      subject: `HOA notice for ${address}: resolved`,
      body: ViolationResolvedEmail({
        homeownerName,
        address,
        category: v.category as ViolationCategory,
        comment: parsed.data.comment || undefined,
      }),
      relatedEntityType: "violation",
      relatedEntityId: violationId,
    }).catch((e) => console.error("violation resolved email failed", e));
  }

  revalidatePath(`/admin/violations/${violationId}`);
  revalidatePath("/admin/violations");
  revalidatePath("/admin");
  revalidatePath("/my-violations");
  return { ok: true };
}

// --------------------------- Public: file an appeal --------------------------

const AppealSchema = z.object({
  token: z.string().min(8).max(128),
  from_name: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(5, "Please write a response").max(5000),
});

export type AppealState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Public action — invoked without auth. We trust the unguessable token but
 * still validate the input. Replies are stored as status_events rows; no
 * status change happens automatically.
 */
export async function fileAppealAction(
  _prev: AppealState | undefined,
  formData: FormData
): Promise<AppealState> {
  const parsed = AppealSchema.safeParse({
    token: formData.get("token"),
    from_name: formData.get("from_name") ?? "",
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsFromZod(parsed.error) };

  // Use the anon client here intentionally — but we need a row that's
  // not normally readable by anon. Switch to a fresh server client and
  // bypass RLS via a service-role lookup ONLY for this row.
  //
  // Simpler approach: use the configured server client, and rely on a
  // separate dedicated DB function. For now, hit the table directly with
  // the regular client — RLS will block it. We need the service role here.
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: v } = await admin
    .from("violations")
    .select("id, status, properties(address)")
    .eq("appeal_token", parsed.data.token)
    .maybeSingle();
  if (!v) return { ok: false, error: "Invalid or expired appeal link." };
  const vProp = pickOne<{ address: string }>(
    v.properties as { address: string } | { address: string }[] | null
  );

  // Append the response as a status_events row with no status transition
  await admin.from("status_events").insert({
    entity_type: "violation",
    entity_id: v.id,
    actor_id: null,
    from_status: v.status,
    to_status: v.status,
    comment: `Homeowner response${parsed.data.from_name ? ` from ${parsed.data.from_name}` : ""}:\n\n${parsed.data.body}`,
    is_public: true,
  });

  // Notify admins
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (adminEmail) {
    await sendEmail({
      template: "violation_appeal_filed",
      to: adminEmail,
      subject: `Homeowner response — ${vProp?.address ?? "violation"}`,
      body: ViolationAppealFiledEmail({
        address: vProp?.address ?? "(no address on file)",
        fromName: parsed.data.from_name || null,
        body: parsed.data.body,
        adminUrl: `${siteUrl}/admin/violations/${v.id}`,
      }),
      relatedEntityType: "violation",
      relatedEntityId: v.id,
    }).catch((e) => console.error("appeal-filed email failed", e));
  }

  revalidatePath(`/admin/violations/${v.id}`);
  return { ok: true };
}
