"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TargetSchema = z.object({
  user_id: z.string().uuid(),
});

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

  return { supabase, actor: user };
}

export async function approveMemberAction(formData: FormData) {
  const parsed = TargetSchema.safeParse({ user_id: formData.get("user_id") });
  if (!parsed.success) return;

  const { supabase } = await requireAdmin();
  await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", parsed.data.user_id);

  revalidatePath("/admin/members");
  revalidatePath("/admin");
}

export async function revokeMemberAction(formData: FormData) {
  const parsed = TargetSchema.safeParse({ user_id: formData.get("user_id") });
  if (!parsed.success) return;

  const { supabase } = await requireAdmin();
  await supabase
    .from("profiles")
    .update({ is_approved: false })
    .eq("id", parsed.data.user_id);

  revalidatePath("/admin/members");
}

/**
 * Link a member profile to a property (and vice versa) in one go.
 * Setting propertyId to null unlinks. Uses service-role so we can clear
 * any other profile that was previously linked to this property.
 */
export async function linkMemberPropertyAction(formData: FormData) {
  const parsed = z
    .object({
      user_id: z.string().uuid(),
      property_id: z.string().uuid().optional().or(z.literal("")),
    })
    .safeParse({
      user_id: formData.get("user_id"),
      property_id: formData.get("property_id") ?? "",
    });
  if (!parsed.success) return;

  await requireAdmin();

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const propertyId = parsed.data.property_id || null;

  // First, clear any other profiles previously linked to this property
  // (a property has at most one homeowner-of-record account).
  if (propertyId) {
    await admin
      .from("profiles")
      .update({ property_id: null })
      .eq("property_id", propertyId)
      .neq("id", parsed.data.user_id);

    // Clear linked_user_id from any property previously held by this user
    const { data: existing } = await admin
      .from("profiles")
      .select("property_id")
      .eq("id", parsed.data.user_id)
      .maybeSingle();
    if (existing?.property_id && existing.property_id !== propertyId) {
      await admin
        .from("properties")
        .update({ linked_user_id: null })
        .eq("id", existing.property_id);
    }
  } else {
    // Unlinking: also clear the old property's linked_user_id
    const { data: existing } = await admin
      .from("profiles")
      .select("property_id")
      .eq("id", parsed.data.user_id)
      .maybeSingle();
    if (existing?.property_id) {
      await admin
        .from("properties")
        .update({ linked_user_id: null })
        .eq("id", existing.property_id);
    }
  }

  // Set both sides
  await admin
    .from("profiles")
    .update({ property_id: propertyId })
    .eq("id", parsed.data.user_id);

  if (propertyId) {
    await admin
      .from("properties")
      .update({ linked_user_id: parsed.data.user_id })
      .eq("id", propertyId);
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin/properties");
}

export async function setAdminAction(formData: FormData) {
  const parsed = z
    .object({
      user_id: z.string().uuid(),
      make_admin: z.string(),
    })
    .safeParse({
      user_id: formData.get("user_id"),
      make_admin: formData.get("make_admin"),
    });
  if (!parsed.success) return;

  const { supabase, actor } = await requireAdmin();

  // Refuse to demote yourself (avoids accidentally locking out the last admin).
  // Return silently instead of throwing — the UI hides this button on the
  // viewer's own row, so reaching here means hand-crafted POST or a stale page.
  if (parsed.data.user_id === actor.id && parsed.data.make_admin === "false") {
    return;
  }

  await supabase
    .from("profiles")
    .update({ is_admin: parsed.data.make_admin === "true" })
    .eq("id", parsed.data.user_id);

  revalidatePath("/admin/members");
}
