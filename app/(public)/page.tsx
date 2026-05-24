import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/siteConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEventDateShort } from "@/lib/format";
import { Calendar, MapPin } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  const [{ data: announcements }, { data: upcomingEvents }, { data: boardMembers }] =
    await Promise.all([
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("start_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(2),
      supabase
        .from("board_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

  const officers = (boardMembers ?? []).filter(
    (m) => m.role && !m.committee
  );
  const committees = groupBy(
    (boardMembers ?? []).filter((m) => m.committee),
    "committee"
  );

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 lg:py-40">
          <p className="text-sm font-medium uppercase tracking-widest text-neutral-400">
            Welcome to
          </p>
          <h1 className="mt-4 font-heading text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {siteConfig.hoa.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-neutral-300">
            {siteConfig.hoa.tagline}
          </p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            About {siteConfig.hoa.shortName}
          </h2>
          <div className="mt-6 space-y-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {siteConfig.aboutCopy}
          </div>
          {siteConfig.amenities.length > 0 && (
            <>
              <h3 className="mt-10 text-lg font-semibold">Community amenities</h3>
              <ul className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                {siteConfig.amenities.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {a}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-10 text-sm text-muted-foreground">
            {siteConfig.hoa.name} · {siteConfig.hoa.city}, {siteConfig.hoa.state}{" "}
            {siteConfig.hoa.zip}
          </p>
        </div>
      </section>

      {/* Upcoming events */}
      <section id="events" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Upcoming events
              </h2>
              <p className="mt-2 text-muted-foreground">
                Meetings, gatherings, and community projects.
              </p>
            </div>
            <Button render={<Link href="/events" />} variant="outline">
              View all events
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {(upcomingEvents ?? []).length === 0 ? (
              <p className="col-span-full rounded-lg border border-dashed bg-background p-10 text-center text-sm text-muted-foreground">
                No upcoming events scheduled. Check back soon.
              </p>
            ) : (
              upcomingEvents!.map((e) => (
                <Card key={e.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{e.title}</CardTitle>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatEventDateShort(e.start_time)}
                    </p>
                    {e.location && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {e.location}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    {e.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {e.description}
                      </p>
                    )}
                    <Button
                      render={<Link href={`/events/${e.slug}`} />}
                      size="sm"
                      className="w-fit"
                    >
                      Details &rarr;
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Announcements
          </h2>
          <div className="mt-8 space-y-6">
            {(announcements ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed bg-background p-8 text-sm text-muted-foreground">
                No active announcements.
              </p>
            ) : (
              announcements!.map((a) => (
                <Card key={a.id}>
                  <CardHeader>
                    <CardTitle>{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-line text-muted-foreground">
                    {a.body}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Board members */}
      <section id="board" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Board &amp; committee members
          </h2>

          {officers.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Officers
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {officers.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border bg-background px-4 py-3"
                  >
                    <p className="font-medium">{m.name}</p>
                    {m.role && (
                      <p className="text-sm text-muted-foreground">{m.role}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.entries(committees).map(([name, members]) => (
            <div key={name} className="mt-10">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {name}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {members.map((m) => (
                  <li key={m.id}>
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                      {m.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-8">
            <Button render={<Link href="/board" />} variant="outline">
              View full board page
            </Button>
          </div>
        </div>
      </section>

      {/* Documents CTA */}
      <section id="documents-cta" className="bg-neutral-900 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Community documents
          </h2>
          <p className="mt-3 text-neutral-300">
            Meeting minutes, newsletters, and governing documents — available to
            approved members.
          </p>
          <Button
            render={<Link href="/documents" />}
            size="lg"
            className="mt-8"
          >
            Open document library
          </Button>
        </div>
      </section>
    </>
  );
}

function groupBy<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const row of rows) {
    const k = String(row[key] ?? "");
    if (!k) continue;
    (out[k] ??= []).push(row);
  }
  return out;
}
