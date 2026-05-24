import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/events/EventForm";
import { createEventAction } from "@/lib/actions/admin-events";

export const metadata = { title: "New event | Admin" };

export default function NewEventPage() {
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
          <CardTitle>New event</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm action={createEventAction} submitLabel="Create event" />
        </CardContent>
      </Card>
    </div>
  );
}
