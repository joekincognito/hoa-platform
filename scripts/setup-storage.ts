/**
 * Idempotent storage bucket setup.
 * Creates the private 'documents' bucket if missing.
 * Run: npx tsx scripts/setup-storage.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const BUCKETS = [
  { id: "documents", public: false, fileSizeLimit: 50 * 1024 * 1024 },
  { id: "attachments", public: false, fileSizeLimit: 25 * 1024 * 1024 },
];

async function main() {
  const { data: existing, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existingIds = new Set((existing ?? []).map((b) => b.id));

  for (const b of BUCKETS) {
    if (existingIds.has(b.id)) {
      console.log(`  • ${b.id}: already exists`);
      continue;
    }
    const { error: ce } = await supabase.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
    });
    if (ce) {
      console.error(`  ✗ ${b.id}: ${ce.message}`);
      process.exit(1);
    }
    console.log(`  ✓ ${b.id}: created (private, ${b.fileSizeLimit / 1024 / 1024} MB limit)`);
  }
}

main();
