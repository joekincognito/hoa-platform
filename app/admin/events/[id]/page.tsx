import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/EventForm";
import {
  updateEventAction,
  type EventState,
} from "@/lib/actions/admin-events";

export const metadata = { title: "Edit event | Admin" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();

  async function action(
    state: EventState | undefined,
    fd: FormData
  ): Promise<EventState> {
    "use server";
    return updateEventAction(id, state, fd);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/events" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Events
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit event</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm action={action} initial={e} submitLabel="Save changes" />
        </CardContent>
      </Card>
    </div>
  );
}
