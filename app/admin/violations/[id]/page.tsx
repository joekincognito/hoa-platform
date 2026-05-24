import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
import { Paperclip } from "lucide-react";
import { AttachmentLink } from "@/components/requests/AttachmentLink";
import { ViolationStatusChangeForm } from "@/components/violations/ViolationStatusChangeForm";
import {
  ALLOWED_TRANSITIONS,
  VIOLATION_CATEGORY_LABEL,
  VIOLATION_STATUS_LABEL,
  statusBadgeClass,
  type ViolationCategory,
  type ViolationStatus,
} from "@/lib/workflow/violations";
import { pickOne } from "@/lib/format";

export const metadata = { title: "Violation | Admin" };

export default async function AdminViolationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: v } = await supabase
    .from("violations")
    .select(
      "*, properties(address, homeowner_name, homeowner_email, homeowner_phone)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!v) notFound();

  // Attachments for this violation
  const { data: attachments } = await supabase
    .from("attachments")
    .select("id, file_path, file_type")
    .eq("entity_type", "violation")
    .eq("entity_id", id)
    .order("uploaded_at", { ascending: true });

  const { data: events } = await supabase
    .from("status_events")
    .select("*")
    .eq("entity_type", "violation")
    .eq("entity_id", id)
    .order("created_at", { ascending: true });

  const status = v.status as ViolationStatus;
  const allowedNext = ALLOWED_TRANSITIONS[status] ?? [];
  type Prop = {
    address: string;
    homeowner_name: string | null;
    homeowner_email: string | null;
    homeowner_phone: string | null;
  };
  const prop = pickOne<Prop>(v.properties as Prop | Prop[] | null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const appealUrl = v.appeal_token ? `${siteUrl}/appeals/${v.appeal_token}` : null;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/violations" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> All violations
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">
                {prop?.address ?? "Violation"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {VIOLATION_CATEGORY_LABEL[v.category as ViolationCategory]}
              </p>
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
                statusBadgeClass(status)
              }
            >
              {VIOLATION_STATUS_LABEL[status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Homeowner of record</p>
            <p className="mt-1 text-muted-foreground">
              {prop?.homeowner_name ?? "(unknown)"}
              {prop?.homeowner_email && (
                <>
                  <br />
                  <a
                    href={`mailto:${prop.homeowner_email}`}
                    className="underline"
                  >
                    {prop.homeowner_email}
                  </a>
                </>
              )}
              {prop?.homeowner_phone && (
                <>
                  <br />
                  {prop.homeowner_phone}
                </>
              )}
            </p>
            {!prop?.homeowner_email && (
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                No homeowner email on file — escalation emails will not deliver.
              </p>
            )}
          </div>
          <div>
            <p className="font-medium">Reported by</p>
            <p className="mt-1 text-muted-foreground">
              {v.reporter_name ?? "—"}
              <br />
              {format(new Date(v.created_at), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-medium">Description</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">
              {v.description}
            </p>
          </div>
          {v.fine_amount && (
            <div className="sm:col-span-2">
              <p className="font-medium">Fine amount</p>
              <p className="mt-1 text-muted-foreground">
                ${Number(v.fine_amount).toFixed(2)}
              </p>
            </div>
          )}
          {appealUrl && (
            <div className="sm:col-span-2">
              <p className="font-medium">Appeal link (homeowner-facing)</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                <a
                  href={appealUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  {appealUrl} <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          )}
          <div className="sm:col-span-2">
            <Separator />
          </div>
          <div className="sm:col-span-2">
            <p className="font-medium">Attachments</p>
            {(attachments ?? []).length === 0 ? (
              <p className="mt-1 text-muted-foreground">No attachments.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {attachments!.map((a) => {
                  const name = a.file_path.split("/").pop() ?? a.file_path;
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      <AttachmentLink id={a.id} label={name} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ViolationStatusChangeForm
            violationId={id}
            currentStatus={status}
            allowedNextStatuses={allowedNext}
            hasHomeownerEmail={Boolean(prop?.homeowner_email)}
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
              <Badge variant="secondary">Reported</Badge>{" "}
              <span className="text-muted-foreground">
                {format(new Date(v.created_at), "MMM d, yyyy h:mm a")}
              </span>
            </li>
            {(events ?? []).map((e) => (
              <li key={e.id} className="text-sm">
                <Badge variant="secondary">
                  {VIOLATION_STATUS_LABEL[e.to_status as ViolationStatus] ??
                    e.to_status}
                </Badge>{" "}
                <span className="text-muted-foreground">
                  {format(new Date(e.created_at), "MMM d, yyyy h:mm a")}
                  {e.actor_id === null && " · homeowner response"}
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
