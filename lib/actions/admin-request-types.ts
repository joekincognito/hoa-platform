"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  key: z
    .string()
    .trim()
    .min(2, "Key required")
    .max(80)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Key: lowercase letters, digits, and underscores; must start with a letter"
    ),
  label: z.string().trim().min(1, "Label required").max(200),
  category: z.enum(["tree", "arc", "other"]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  allows_inspection: z.coerce.boolean(),
  is_active: z.coerce.boolean(),
  display_order: z.coerce.number().int().min(0).max(9999),
});

export type RequestTypeState = {
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
    key: formData.get("key"),
    label: formData.get("label"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    allows_inspection: formData.get("allows_inspection") === "on",
    is_active: formData.get("is_active") === "on",
    display_order: formData.get("display_order") ?? 100,
  });
}

function row(d: z.infer<typeof Schema>) {
  return {
    key: d.key,
    label: d.label,
    category: d.category,
    description: d.description || null,
    allows_inspection: d.allows_inspection,
    is_active: d.is_active,
    display_order: d.display_order,
  };
}

export async function createRequestTypeAction(
  _prev: RequestTypeState | undefined,
  formData: FormData
): Promise<RequestTypeState> {
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fmt(parsed.error) };
  const supabase = await requireAdmin();
  const { error } = await supabase.from("request_types").insert(row(parsed.data));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/request-types");
  revalidatePath("/requests/new");
  return { ok: true };
}

export async function updateRequestTypeAction(
  key: string,
  _prev: RequestTypeState | undefined,
  formData: FormData
): Promise<RequestTypeState> {
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fmt(parsed.error) };
  const supabase = await requireAdmin();

  // Don't allow changing the key (it's the FK target). Update everything else.
  const { key: _ignoredKey, ...rest } = row(parsed.data);
  const { error } = await supabase
    .from("request_types")
    .update(rest)
    .eq("key", key);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/request-types");
  revalidatePath("/requests/new");
  return { ok: true };
}

export async function deleteRequestTypeAction(formData: FormData) {
  const key = formData.get("key");
  if (typeof key !== "string") return;
  const supabase = await requireAdmin();

  // Don't allow delete if any request still uses this type
  const { count } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("type", key);
  if ((count ?? 0) > 0) {
    // Soft-disable instead
    await supabase.from("request_types").update({ is_active: false }).eq("key", key);
  } else {
    await supabase.from("request_types").delete().eq("key", key);
  }

  revalidatePath("/admin/request-types");
  revalidatePath("/requests/new");
}
