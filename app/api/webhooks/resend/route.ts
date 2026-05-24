import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Resend webhook endpoint. Configure in Resend dashboard:
 *   URL: https://<your-site>/api/webhooks/resend
 *   Events: email.delivered, email.bounced, email.complained
 *
 * We don't currently verify the Svix signature (RESEND_WEBHOOK_SECRET) —
 * which is fine for status updates since we only ever flip statuses
 * based on a provider_message_id we issued ourselves. Sign-and-verify
 * is a TODO before going live with anything sensitive.
 */
export async function POST(request: Request) {
  let payload: {
    type?: string;
    data?: {
      email_id?: string;
      to?: string[];
    };
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const messageId = payload?.data?.email_id;
  if (!messageId) {
    return NextResponse.json({ ok: true });
  }

  const eventType = payload.type ?? "";

  let nextStatus: string | null = null;
  if (eventType === "email.delivered") nextStatus = "delivered";
  else if (eventType === "email.bounced") nextStatus = "bounced";
  else if (eventType === "email.complained") nextStatus = "bounced";

  if (!nextStatus) return NextResponse.json({ ok: true });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Update broadcast_deliveries with this provider_message_id
  await admin
    .from("broadcast_deliveries")
    .update({
      status: nextStatus,
      ...(nextStatus === "delivered"
        ? { delivered_at: new Date().toISOString() }
        : {}),
    })
    .eq("provider_message_id", messageId);

  // Also update transactional notifications log
  await admin
    .from("notifications")
    .update({
      status: nextStatus === "delivered" ? "sent" : nextStatus,
    })
    .eq("resend_message_id", messageId);

  return NextResponse.json({ ok: true });
}
