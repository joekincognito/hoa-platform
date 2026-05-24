"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  return supabase;
}

export async function toggleContactReadAction(formData: FormData) {
  const id = formData.get("id");
  const is_read = formData.get("is_read") === "true";
  if (typeof id !== "string") return;
  const supabase = await requireAdmin();
  await supabase
    .from("contact_submissions")
    .update({ is_read: !is_read })
    .eq("id", id);
  revalidatePath("/admin/contact");
  revalidatePath("/admin");
}
