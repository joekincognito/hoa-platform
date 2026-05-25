"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Email = z.string().trim().email("Valid email required").max(200);
const Password = z.string().min(8, "Password must be at least 8 characters").max(128);

const LoginSchema = z.object({
  email: Email,
  password: z.string().min(1, "Password required"),
  next: z.string().optional(),
});

function safeNext(next: string | undefined | null): string {
  if (!next) return "/";
  // Only allow same-origin relative paths
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

const SignupSchema = z.object({
  email: Email,
  password: Password,
  full_name: z.string().trim().min(1, "Full name required").max(120),
});

const ForgotSchema = z.object({ email: Email });

const ResetSchema = z.object({ password: Password });

export type AuthState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  needsConfirmation?: boolean;
};

function fmtFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !out[k]) out[k] = i.message;
  }
  return out;
}

export async function loginAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: fmtFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { ok: false, error: "Invalid email or password." };
  redirect(safeNext(parsed.data.next));
}

export async function signupAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: fmtFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { full_name: parsed.data.full_name },
    },
  });

  if (error) return { ok: false, error: error.message };

  // If confirmation is required, Supabase returns user but no session.
  if (data.user && !data.session) {
    return { ok: true, needsConfirmation: true };
  }

  redirect("/profile?welcome=1");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = ForgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: fmtFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });

  // Always report success (don't leak which emails are registered)
  if (error) console.error("forgotPassword failed silently:", error);
  return { ok: true };
}

export async function resetPasswordAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = ResetSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: fmtFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { ok: false, error: error.message };
  redirect("/profile?reset=1");
}
