"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Valid email required").max(200),
  message: z.string().trim().min(5, "Message is too short").max(5000),
});

export type ContactActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof ContactSchema>, string>>;
};

export async function submitContactForm(
  _prev: ContactActionState | undefined,
  formData: FormData
): Promise<ContactActionState> {
  const parsed = ContactSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") ?? "",
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: ContactActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof z.infer<typeof ContactSchema>;
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, error: "Please fix the errors below.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name || null,
    email: parsed.data.email,
    message: parsed.data.message,
  });

  if (error) {
    console.error("contact_submissions insert failed", error);
    return { ok: false, error: "Couldn't save your message. Please try again." };
  }

  // TODO Phase 2: email the board via Resend (contact_form_submitted template).

  return { ok: true };
}
