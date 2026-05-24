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
import { withdrawRequestAction } from "@/lib/actions/requests";
import {
  ALLOWED_TRANSITIONS,
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
  statusBadgeClass,
  type RequestStatus,
  type RequestType,
} from "@/lib/workflow/requests";
import { RequestAttachments } from "@/components/requests/RequestAttachments";

export const metadata = { title: "Request" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export default async function MyRequestDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!req) notFound();

  const { data: events } = await supabase
    .from("status_events")
    .select("*")
    .eq("entity_type", "request")
    .eq("entity_id", id)
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  const status = req.status as RequestStatus;
  const canWithdraw = ALLOWED_TRANSITIONS[status]?.includes("withdrawn");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/my-requests" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> My requests
      </Button>

      {sp.new && (
        <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
          Submitted. The board will email you when the status changes.
        </div>
      )}

      <Card className="mt-4">
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
        <CardContent className="space-y-4 text-sm">
          {req.reason && (
            <div>
              <p className="font-medium">Reason</p>
              <p className="mt-1 text-muted-foreground">{req.reason}</p>
            </div>
          )}
          <div>
            <p className="font-medium">Description</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">
              {req.description}
            </p>
          </div>
          {req.address && (
            <div>
              <p className="font-medium">Property</p>
              <p className="mt-1 text-muted-foreground">{req.address ?? ""}</p>
            </div>
          )}
          <Separator />
          <RequestAttachments requestId={id} />
        </CardContent>
      </Card>

      <Card className="mt-6">
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

      {canWithdraw && (
        <div className="mt-6 flex justify-end">
          <form action={withdrawRequestAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="outline">
              Withdraw this request
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
