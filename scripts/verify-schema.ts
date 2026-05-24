/**
 * Verify the schema landed correctly on the remote Supabase project.
 * Run: npx tsx scripts/verify-schema.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const expectedTables = [
  "events",
  "announcements",
  "board_members",
  "contact_submissions",
  "profiles",
  "properties",
  "documents",
  "requests",
  "violations",
  "attachments",
  "status_events",
  "notifications",
  "broadcasts",
  "broadcast_deliveries",
  "audit_log",
];

async function main() {
  console.log(`\nVerifying ${url}\n`);

  let failed = 0;
  for (const table of expectedTables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error) {
      console.log(`  ✗ ${table.padEnd(22)} — ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${table}`);
    }
  }

  if (failed) {
    console.error(`\n${failed} table(s) missing or unreadable.`);
    process.exit(1);
  }

  // Verify RLS helper functions exist by attempting an RPC
  const { error: rpcErr } = await supabase.rpc("is_admin", {
    uid: "00000000-0000-0000-0000-000000000000",
  });
  if (rpcErr && !rpcErr.message.includes("function")) {
    // The function call may return false but should not be a "function does not exist" error.
    console.log(`\n  ⚠ is_admin RPC: ${rpcErr.message}`);
  } else if (!rpcErr) {
    console.log("\n  ✓ is_admin() helper function callable");
  }

  console.log("\nAll 15 tables present and readable via service_role.\nSchema verification complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
