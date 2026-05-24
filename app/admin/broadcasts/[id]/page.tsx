import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Mail, MessageSquare, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { dispatchBroadcastAction } from "@/lib/actions/broadcasts";

export const metadata = { title: "Broadcast | Admin" };

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  bounced: "Bounced",
  opted_out: "Opted out",
};

function statusBadge(status: string) {
  const cls =
    status === "delivered" || status === "sent"
      ? "bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/15"
      : status === "failed" || status === "bounced"
        ? "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15"
        : status === "opted_out"
          ? "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-500/15"
          : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/15";
  return (
    <Badge className={cls}>{STATUS_LABEL[status] ?? status}</Badge>
  );
}

export default async function BroadcastDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: b } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();

  const { data: deliveries } = await supabase
    .from("broadcast_deliveries")
    .select("*")
    .eq("broadcast_id", id)
    .order("created_at", { ascending: true });

  // Stats
  const total = deliveries?.length ?? 0;
  const byStatus = (deliveries ?? []).reduce<Record<string, number>>(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const byChannel = (deliveries ?? []).reduce<Record<string, number>>(
    (acc, d) => {
      acc[d.channel] = (acc[d.channel] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin/broadcasts" />}
        className="-ml-2 gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> All broadcasts
      </Button>

      {sp.sent === "1" && (
        <div className="rounded-md border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
          Broadcast dispatched.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">
                {b.subject || "(no subject)"}
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-1">
                {b.channels?.includes("email") && (
                  <Badge variant="outline">
                    <Mail className="mr-1 h-3 w-3" /> Email
                  </Badge>
                )}
                {b.channels?.includes("sms") && (
                  <Badge variant="outline">
                    <MessageSquare className="mr-1 h-3 w-3" /> SMS
                  </Badge>
                )}
                {b.is_emergency && (
                  <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15">
                    Emergency
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {b.sent_at ? (
                <p>Sent {format(new Date(b.sent_at), "MMM d, yyyy h:mm a")}</p>
              ) : b.scheduled_for ? (
                <p>
                  Scheduled for{" "}
                  {format(new Date(b.scheduled_for), "MMM d, yyyy h:mm a")}
                </p>
              ) : (
                <p>Draft</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm">{b.body}</p>
        </CardContent>
      </Card>

      {!b.sent_at && (
        <Card>
          <CardHeader>
            <CardTitle>Dispatch now</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={dispatchBroadcastAction}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit">Send now</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Delivery stats</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No delivery rows yet. Will populate when the broadcast is
              dispatched.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="mt-1 text-2xl font-semibold">{total}</p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" /> Sent /
                    Delivered
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {(byStatus.sent ?? 0) + (byStatus.delivered ?? 0)}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-600" /> Failed /
                    Bounced
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {(byStatus.failed ?? 0) + (byStatus.bounced ?? 0)}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                By channel:{" "}
                {Object.entries(byChannel)
                  .map(([k, v]) => `${k} ${v}`)
                  .join(" · ")}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {(deliveries ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-recipient detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Sent at
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries!.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm">
                      {d.recipient_email ?? d.recipient_phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{d.channel}</TableCell>
                    <TableCell>{statusBadge(d.status)}</TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {d.sent_at
                        ? format(new Date(d.sent_at), "MMM d, h:mm a")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-xs text-destructive lg:table-cell">
                      {d.error ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
