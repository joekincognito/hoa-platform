/**
 * Idempotent seed for a fresh hoa-platform Supabase project.
 * Inserts placeholder content so the public site renders something during dev.
 * Run: npx tsx scripts/seed-remote.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function upsertAnnouncements() {
  const rows = [
    {
      title: "Welcome to the new community site",
      body: "This site is in early development. Member sign-ups, document downloads, and the request workflows will be live soon.",
      display_order: 1,
      is_active: true,
    },
    {
      title: "Pool season reminder",
      body: "The pool opens Memorial Day weekend. Please register your household for gate access at least one week in advance.",
      display_order: 2,
      is_active: true,
    },
  ];

  // Wipe and reinsert — placeholder content only.
  await supabase.from("announcements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("announcements").insert(rows);
  if (error) throw error;
  console.log(`  ✓ Announcements: ${rows.length}`);
}

async function upsertBoardMembers() {
  const rows = [
    { name: "Jane Smith", role: "President", display_order: 1, is_active: true },
    { name: "John Doe", role: "Vice President", display_order: 2, is_active: true },
    { name: "Mary Johnson", role: "Treasurer", display_order: 3, is_active: true },
    { name: "Robert Brown", role: "Secretary", display_order: 4, is_active: true },
    { name: "Sarah Davis", committee: "Architectural Review", display_order: 5, is_active: true },
    { name: "Michael Wilson", committee: "Architectural Review", display_order: 6, is_active: true },
    { name: "Lisa Garcia", committee: "Social Committee", display_order: 7, is_active: true },
  ];

  await supabase.from("board_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("board_members").insert(rows);
  if (error) throw error;
  console.log(`  ✓ Board members: ${rows.length}`);
}

async function upsertEvents() {
  const now = new Date();
  const inDays = (d: number, h = 18) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    x.setHours(h, 0, 0, 0);
    return x.toISOString();
  };

  const rows = [
    {
      slug: "monthly-board-meeting",
      title: "Monthly board meeting",
      description: "Regular open board meeting. Agenda will be posted 48 hours in advance. All homeowners welcome.",
      start_time: inDays(14, 19),
      end_time: inDays(14, 21),
      location: "Community Pavilion",
      is_published: true,
    },
    {
      slug: "summer-community-day",
      title: "Summer community day",
      description: "Annual outdoor gathering with food, games, and a chance to meet neighbors. Bring a dish to share.",
      start_time: inDays(45, 14),
      end_time: inDays(45, 20),
      location: "Pavilion + Pool area",
      is_published: true,
    },
    {
      slug: "fall-cleanup-day",
      title: "Fall common-area cleanup",
      description: "Volunteer cleanup of shared spaces. Refreshments provided. Sign up at the door.",
      start_time: inDays(90, 9),
      end_time: inDays(90, 13),
      location: "Main entrance",
      is_published: true,
    },
  ];

  await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("events").insert(rows);
  if (error) throw error;
  console.log(`  ✓ Events: ${rows.length}`);
}

async function main() {
  console.log("Seeding remote DB...\n");
  await upsertAnnouncements();
  await upsertBoardMembers();
  await upsertEvents();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
