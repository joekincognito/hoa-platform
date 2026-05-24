import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  Inbox,
  Megaphone,
  TreePine,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: pendingApprovals },
    { count: openContact },
    { count: openViolations },
    { count: openRequests },
    { count: upcomingEvents },
    { count: totalMembers },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false),
    supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
    supabase
      .from("violations")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(dismissed,resolved)"),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("status", "in", "(approved,denied,withdrawn)"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .gte("start_time", new Date().toISOString()),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", true),
  ]);

  const tiles = [
    {
      label: "Pending approvals",
      count: pendingApprovals ?? 0,
      href: "/admin/members?filter=pending",
      icon: UserCheck,
      tone: pendingApprovals && pendingApprovals > 0 ? "warn" : "neutral",
    },
    {
      label: "Unread contact submissions",
      count: openContact ?? 0,
      href: "/admin/contact",
      icon: Inbox,
      tone: openContact && openContact > 0 ? "warn" : "neutral",
    },
    {
      label: "Open violations",
      count: openViolations ?? 0,
      href: "/admin/violations",
      icon: AlertTriangle,
      tone: openViolations && openViolations > 0 ? "warn" : "neutral",
    },
    {
      label: "Open tree / ARC requests",
      count: openRequests ?? 0,
      href: "/admin/requests",
      icon: TreePine,
      tone: openRequests && openRequests > 0 ? "warn" : "neutral",
    },
    {
      label: "Upcoming events",
      count: upcomingEvents ?? 0,
      href: "/admin/events",
      icon: Calendar,
      tone: "neutral" as const,
    },
    {
      label: "Active members",
      count: totalMembers ?? 0,
      href: "/admin/members",
      icon: UserCheck,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Admin overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick triage. Click a tile to drill in.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}>
              <Card
                className={
                  t.tone === "warn"
                    ? "border-yellow-500/40 transition-colors hover:bg-yellow-500/5"
                    : "transition-colors hover:bg-muted/50"
                }
              >
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{t.count}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li>
              <Link href="/admin/announcements" className="text-foreground underline">
                <Megaphone className="mr-2 inline h-3.5 w-3.5" />
                Post an announcement
              </Link>
            </li>
            <li>
              <Link href="/admin/broadcasts" className="text-foreground underline">
                <Megaphone className="mr-2 inline h-3.5 w-3.5" />
                Send a community broadcast
              </Link>
            </li>
            <li>
              <Link href="/admin/events" className="text-foreground underline">
                <Calendar className="mr-2 inline h-3.5 w-3.5" />
                Schedule an event
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
