"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifyUnsubscribeToken } from "@/lib/email/tokens";

export type UnsubscribeUpdateState = {
  ok: boolean;
  error?: string;
};

/**
 * Public action — no auth. Verifies HMAC token then flips opt-in flags.
 * Defaults to opting out of all non-emergency channels (CAN-SPAM one-click).
 */
export async function processUnsubscribeAction(
  _prev: UnsubscribeUpdateState | undefined,
  formData: FormData
): Promise<UnsubscribeUpdateState> {
  const userId = String(formData.get("u") ?? "");
  const token = String(formData.get("t") ?? "");
  if (!userId || !token) return { ok: false, error: "Invalid link." };
  if (!verifyUnsubscribeToken(userId, token))
    return { ok: false, error: "Invalid or tampered link." };

  const updates: Record<string, unknown> = {
    email_broadcast_opt_in:
      formData.get("email_broadcast_opt_in") === "on",
    email_emergency_opt_in:
      formData.get("email_emergency_opt_in") === "on",
    sms_broadcast_opt_in: formData.get("sms_broadcast_opt_in") === "on",
    sms_emergency_opt_in: formData.get("sms_emergency_opt_in") === "on",
  };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
