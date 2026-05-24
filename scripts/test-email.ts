/**
 * One-shot test: send a test email via Resend.
 * Note: Without a verified sending domain, Resend will only deliver to the
 * email address tied to your Resend account. Other recipients silently fail.
 * Usage: npx tsx scripts/test-email.ts <to-email>
 */
import { Resend } from "resend";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const to = process.argv[2];
if (!to) {
  console.error("Usage: npx tsx scripts/test-email.ts <to-email>");
  process.exit(1);
}

const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(key);

async function main() {
  const { data, error } = await resend.emails.send({
    from: "HOA Platform Test <onboarding@resend.dev>",
    to,
    subject: "hoa-platform: Resend connectivity test",
    html: "<p>If you see this, the Resend wiring works.</p>",
    text: "If you see this, the Resend wiring works.",
  });
  if (error) {
    console.error("FAILED:", error);
    process.exit(1);
  }
  console.log("OK message id:", data?.id);
}

main();
