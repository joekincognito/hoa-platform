import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Twilio webhook endpoint. Configure in Twilio console:
 *   Status callback URL: https://<your-site>/api/webhooks/twilio?type=status
 *   Inbound webhook URL: https://<your-site>/api/webhooks/twilio?type=inbound
 *
 * Inbound messages let us auto-honor STOP keywords. Status callbacks let us
 * update broadcast_deliveries with delivered/failed transitions.
 *
 * Currently inert because no Twilio account is configured. Once SMS is
 * enabled this works as-is. Signature verification (Twilio's X-Twilio-Signature
 * with TWILIO_AUTH_TOKEN as the HMAC key) is a TODO before going live.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // 'status' | 'inbound'

  // Twilio posts application/x-www-form-urlencoded
  const formData = await request.formData();

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  if (type === "inbound") {
    const from = String(formData.get("From") ?? "").trim();
    const body = String(formData.get("Body") ?? "")
      .trim()
      .toUpperCase();

    if (!from) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Auto-honor opt-out keywords (Twilio also auto-honors STOP at the
    // carrier level — we mirror it in our DB so the UI shows the right
    // state).
    const isStop = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(body);
    if (isStop) {
      await admin
        .from("profiles")
        .update({
          sms_broadcast_opt_in: false,
          sms_emergency_opt_in: false,
        })
        .eq("sms_phone", from);
    }
    // Note: We could also auto-handle START to re-subscribe, but only for
    // general (not emergency) per TCPA best practice.

    return NextResponse.json({ ok: true });
  }

  // status callback
  if (type === "status") {
    const messageSid = String(formData.get("MessageSid") ?? "");
    const status = String(formData.get("MessageStatus") ?? "");

    if (!messageSid || !status) return NextResponse.json({ ok: true });

    let nextStatus: string | null = null;
    if (status === "delivered") nextStatus = "delivered";
    else if (status === "failed" || status === "undelivered") nextStatus = "failed";
    else if (status === "sent") nextStatus = "sent";

    if (nextStatus) {
      await admin
        .from("broadcast_deliveries")
        .update({
          status: nextStatus,
          ...(nextStatus === "delivered"
            ? { delivered_at: new Date().toISOString() }
            : {}),
        })
        .eq("provider_message_id", messageSid);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "unknown type" }, { status: 400 });
}
