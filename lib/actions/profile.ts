"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name required").max(120),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  sms_phone: z.string().trim().max(40).optional().or(z.literal("")),
  show_in_directory: z.coerce.boolean(),
  directory_show_phone: z.coerce.boolean(),
  directory_show_email: z.coerce.boolean(),
  directory_show_address: z.coerce.boolean(),
  email_broadcast_opt_in: z.coerce.boolean(),
  email_emergency_opt_in: z.coerce.boolean(),
  sms_broadcast_opt_in: z.coerce.boolean(),
  sms_emergency_opt_in: z.coerce.boolean(),
});

export type ProfileState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfileAction(
  _prev: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not logged in." };

  // FormData checkboxes are absent when unchecked. Normalize to boolean.
  const raw = Object.fromEntries(
    [
      "full_name",
      "address",
      "phone",
      "sms_phone",
      "show_in_directory",
      "directory_show_phone",
      "directory_show_email",
      "directory_show_address",
      "email_broadcast_opt_in",
      "email_emergency_opt_in",
      "sms_broadcast_opt_in",
      "sms_emergency_opt_in",
    ].map((k) => {
      const v = formData.get(k);
      if (
        k.startsWith("show_") ||
        k.startsWith("directory_") ||
        k.includes("_opt_in")
      ) {
        return [k, v === "on" || v === "true"];
      }
      return [k, v ?? ""];
    })
  );

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const out: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "");
      if (k && !out[k]) out[k] = i.message;
    }
    return { ok: false, fieldErrors: out };
  }

  const d = parsed.data;

  // Reset sms_phone_verified if phone number changed
  const { data: existing } = await supabase
    .from("profiles")
    .select("sms_phone")
    .eq("id", user.id)
    .maybeSingle();

  const phoneChanged = (existing?.sms_phone ?? "") !== (d.sms_phone ?? "");

  const updates: Record<string, unknown> = {
    full_name: d.full_name,
    address: d.address || null,
    phone: d.phone || null,
    sms_phone: d.sms_phone || null,
    show_in_directory: d.show_in_directory,
    directory_show_phone: d.directory_show_phone,
    directory_show_email: d.directory_show_email,
    directory_show_address: d.directory_show_address,
    email_broadcast_opt_in: d.email_broadcast_opt_in,
    email_emergency_opt_in: d.email_emergency_opt_in,
    sms_broadcast_opt_in: d.sms_broadcast_opt_in,
    sms_emergency_opt_in: d.sms_emergency_opt_in,
  };

  if (phoneChanged) {
    updates.sms_phone_verified = false;
    // If they cleared their phone, also flip SMS opt-ins off.
    if (!d.sms_phone) {
      updates.sms_broadcast_opt_in = false;
      updates.sms_emergency_opt_in = false;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { ok: false, error: "Couldn't save your profile." };

  revalidatePath("/profile");
  return { ok: true };
}
