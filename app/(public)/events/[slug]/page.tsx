import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateRange } from "@/lib/format";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("title, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) return { title: "Event not found" };
  return { title: data.title, description: data.description ?? undefined };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!event) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Button
        render={<Link href="/events" />}
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Button>

      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
        {event.title}
      </h1>

      <div className="mt-6 space-y-2 text-muted-foreground">
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatEventDateRange(event.start_time, event.end_time)}
        </p>
        {event.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location}
          </p>
        )}
      </div>

      {event.description && (
        <div className="mt-10 whitespace-pre-line text-base leading-relaxed">
          {event.description}
        </div>
      )}

      {event.rsvp_url && (
        <div className="mt-12">
          <Button
            render={
              <a
                href={event.rsvp_url}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            size="lg"
          >
            RSVP / Register
          </Button>
        </div>
      )}
    </article>
  );
}
