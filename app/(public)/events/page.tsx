import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateRange } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Events",
};

export default async function EventsListPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .gte("start_time", nowIso)
    .order("start_time", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-destructive">
        Failed to load events.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Upcoming events
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Meetings, gatherings, and community projects. Click an event for full
          details.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
          No upcoming events. Check back soon.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {events.map((e) => (
            <Card key={e.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{e.title}</CardTitle>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatEventDateRange(e.start_time, e.end_time)}
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
          ))}
        </div>
      )}
    </div>
  );
}
