import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ALLOWED_TRANSITIONS,
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
  statusBadgeClass,
  type RequestStatus,
  type RequestType,
} from "@/lib/workflow/requests";
import { RequestAttachments } from "@/components/requests/RequestAttachments";
import { StatusChangeForm } from "@/components/requests/StatusChangeForm";

export const metadata = { title: "Request | Admin" };

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("requests")
    .select("*, properties(address, homeowner_name, homeowner_email)")
    .eq("id", id)
    .maybeSingle();
  if (!req) notFound();

  // Admins see all events (including internal-only)
  const { data: events } = await supabase
    .from("status_events")
    .select("*")
    .eq("entity_type", "request")
    .eq("entity_id", id)
    .order("created_at", { ascending: true });

  const status = req.status as RequestStatus;
  const allowedNext = (ALLOWED_TRANSITIONS[status] ?? []).filter(
    (s) => s !== "withdrawn"
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/requests" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> All requests
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{req.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {REQUEST_TYPE_LABEL[req.type as RequestType]}
              </p>
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
                statusBadgeClass(status)
              }
            >
              {REQUEST_STATUS_LABEL[status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Submitter</p>
            <p className="mt-1 text-muted-foreground">
              {req.submitter_name ?? "—"}
              {req.submitter_email && (
                <>
                  <br />
                  <a
                    href={`mailto:${req.submitter_email}`}
                    className="underline"
                  >
                    {req.submitter_email}
                  </a>
                </>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium">Submitted</p>
            <p className="mt-1 text-muted-foreground">
              {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-medium">Property</p>
            {req.properties ? (
              <p className="mt-1 text-muted-foreground">
                {req.properties.address}
                {req.properties.homeowner_name &&
                  ` — ${req.properties.homeowner_name}`}
              </p>
            ) : (
              <p className="mt-1 text-muted-foreground italic">
                Not matched to a property in the registry
              </p>
            )}
          </div>
          {req.reason && (
            <div className="sm:col-span-2">
              <p className="font-medium">Reason</p>
              <p className="mt-1 text-muted-foreground">{req.reason}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <p className="font-medium">Description</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">
              {req.description}
            </p>
          </div>
          <div className="sm:col-span-2">
            <Separator />
          </div>
          <div className="sm:col-span-2">
            <RequestAttachments requestId={id} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusChangeForm
            requestId={id}
            currentStatus={status}
            allowedNextStatuses={allowedNext}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="text-sm">
              <Badge variant="secondary">Submitted</Badge>{" "}
              <span className="text-muted-foreground">
                {format(new Date(req.created_at), "MMM d, yyyy h:mm a")}
              </span>
            </li>
            {(events ?? []).map((e) => (
              <li key={e.id} className="text-sm">
                <Badge variant="secondary">
                  {REQUEST_STATUS_LABEL[e.to_status as RequestStatus] ??
                    e.to_status}
                </Badge>{" "}
                {!e.is_public && (
                  <Badge className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-400">
                    Internal
                  </Badge>
                )}{" "}
                <span className="text-muted-foreground">
                  {format(new Date(e.created_at), "MMM d, yyyy h:mm a")}
                </span>
                {e.comment && (
                  <p className="mt-1 whitespace-pre-line pl-1 text-muted-foreground">
                    {e.comment}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
