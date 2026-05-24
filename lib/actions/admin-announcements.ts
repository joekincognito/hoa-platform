"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  body: z.string().trim().min(1, "Body required").max(8000),
  is_active: z.coerce.boolean(),
  display_order: z.coerce.number().int().min(0).max(9999),
});

export type AnnouncementState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
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
  return supabase;
}

function fmt(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !out[k]) out[k] = i.message;
  }
  return out;
}

function parse(formData: FormData) {
  return Schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    is_active: formData.get("is_active") === "on",
    display_order: formData.get("display_order") ?? 0,
  });
}

function row(d: z.infer<typeof Schema>) {
  return {
    title: d.title,
    body: d.body,
    is_active: d.is_active,
    display_order: d.display_order,
  };
}

export async function createAnnouncementAction(
  _prev: AnnouncementState | undefined,
  formData: FormData
): Promise<AnnouncementState> {
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fmt(parsed.error) };
  const supabase = await requireAdmin();
  const { error } = await supabase.from("announcements").insert(row(parsed.data));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { ok: true };
}

export async function updateAnnouncementAction(
  id: string,
  _prev: AnnouncementState | undefined,
  formData: FormData
): Promise<AnnouncementState> {
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fmt(parsed.error) };
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("announcements")
    .update(row(parsed.data))
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteAnnouncementAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await requireAdmin();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}
