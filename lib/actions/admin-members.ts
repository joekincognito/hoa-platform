"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
