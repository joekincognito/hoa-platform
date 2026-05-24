import { render } from "@react-email/components";
import { createClient } from "@/lib/supabase/server";
import { getResend, isEmailDispatchEnabled } from "@/lib/email/resend";
import { siteConfig } from "@/siteConfig";

export type SendEmailInput = {
  /** Stable identifier used for analytics + filtering (e.g. "request_submitted"). */
  template: string;
  to: string;
  subject: string;
  /** Pre-rendered React element from a react-email template. */
  body: React.ReactElement;
  /** Optional links back to the entity in the DB (e.g. request id). */
  relatedEntityType?: string;
  relatedEntityId?: string;
};

export type SendEmailResult = {
  ok: boolean;
  notificationId?: string;
  providerMessageId?: string;
  error?: string;
};

/**
 * Render + log + dispatch a transactional email.
 *
 * Always writes a notifications row first (so failures don't get lost). If
 * RESEND_API_KEY is unset, the row is marked 'failed' with a clear reason
 * — the workflow keeps running and the email can be re-dispatched later.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const supabase = await createClient();
  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "no-reply@example.com";
  const fromName = process.env.EMAIL_FROM_NAME ?? siteConfig.email.fromName;
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  const html = await render(input.body);
  const text = await render(input.body, { plainText: true });

  const { data: notif, error: insErr } = await supabase
    .from("notifications")
    .insert({
      template: input.template,
      to_email: input.to,
      subject: input.subject,
      body_text: text,
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null,
      status: "queued",
    })
    .select("id")
    .single();

  if (insErr) {
    console.error("sendEmail: failed to insert notification row", insErr);
    return { ok: false, error: insErr.message };
  }

  if (!isEmailDispatchEnabled()) {
    const reason = "RESEND_API_KEY not configured — email written to log only.";
    await supabase
      .from("notifications")
      .update({ status: "failed", error: reason })
      .eq("id", notif.id);
    return { ok: false, notificationId: notif.id, error: reason };
  }

  const resend = getResend()!;
  const { data: sent, error: sendErr } = await resend.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to: input.to,
    subject: input.subject,
    html,
    text,
    replyTo,
  });

  if (sendErr) {
    await supabase
      .from("notifications")
      .update({ status: "failed", error: sendErr.message })
      .eq("id", notif.id);
    return { ok: false, notificationId: notif.id, error: sendErr.message };
  }

  await supabase
    .from("notifications")
    .update({
      status: "sent",
      resend_message_id: sent?.id ?? null,
      sent_at: new Date().toISOString(),
    })
    .eq("id", notif.id);

  return { ok: true, notificationId: notif.id, providerMessageId: sent?.id };
}
