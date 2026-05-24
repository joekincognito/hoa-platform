/**
 * Promote a user to admin (and approve them) by email.
 * Usage: npx tsx scripts/make-admin.ts user@example.com
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Use the auth admin API to find the user by email
  const { data: list, error: listErr } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    process.exit(1);
  }

  const target = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (!target) {
    console.error(`No user found with email ${email}`);
    console.error("Have they signed up at /auth/signup yet?");
    process.exit(1);
  }

  // Ensure profile row exists (trigger creates it on signup, but be safe)
  const { error: upsertErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: target.id,
        full_name: target.user_metadata?.full_name ?? null,
        is_approved: true,
        is_admin: true,
      },
      { onConflict: "id" }
    );

  if (upsertErr) {
    console.error("Failed to upsert profile:", upsertErr.message);
    process.exit(1);
  }

  console.log(`✓ ${email} is now an approved admin (user_id=${target.id})`);
}

main();
