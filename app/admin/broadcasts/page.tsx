import Link from "next/link";
import { format } from "date-fns";
import { Plus, Mail, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { siteConfig } from "@/siteConfig";

export const metadata = { title: "Broadcasts | Admin" };

export default async function BroadcastsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: "sent" | "scheduled" | "all" }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "all";

  const supabase = await createClient();
  let q = supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === "sent") q = q.not("sent_at", "is", null);
  else if (filter === "scheduled")
    q = q.is("sent_at", null).not("scheduled_for", "is", null);

  const { data: rows } = await q;

  function tab(value: string, label: string) {
    return (
      <Link
        href={`/admin/broadcasts?filter=${value}`}
        className={
          filter === value
            ? "rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        }
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Broadcasts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send HOA-wide messages by email
            {siteConfig.features.smsEnabled ? " and SMS" : ""}. Recipients only
            get messages they&apos;ve opted in to.
          </p>
          {!siteConfig.features.smsEnabled && (
            <p className="mt-1 text-xs text-muted-foreground">
              SMS dispatch is disabled in this deploy. Enable via{" "}
              <code>siteConfig.features.smsEnabled</code> after Twilio + A2P
              10DLC are set up.
            </p>
          )}
        </div>
        <Button render={<Link href="/admin/broadcasts/new" />}>
          <Plus className="mr-2 h-4 w-4" /> New broadcast
        </Button>
      </header>

      <div className="flex gap-1 rounded-md border bg-muted/30 p-1">
        {tab("all", "All")}
        {tab("sent", "Sent")}
        {tab("scheduled", "Scheduled")}
      </div>

      <Card>
        <CardContent className="p-0">
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No broadcasts yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject / preview</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Channels
                  </TableHead>
                  <TableHead className="hidden md:table-cell">When</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/broadcasts/${r.id}`}
                        className="hover:underline"
                      >
                        {r.subject || "(no subject)"}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {r.body}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-1">
                        {r.channels?.includes("email") && (
                          <Badge variant="outline">
                            <Mail className="mr-1 h-3 w-3" /> Email
                          </Badge>
                        )}
                        {r.channels?.includes("sms") && (
                          <Badge variant="outline">
                            <MessageSquare className="mr-1 h-3 w-3" /> SMS
                          </Badge>
                        )}
                        {r.is_emergency && (
                          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15">
                            Emergency
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {r.sent_at
                        ? format(new Date(r.sent_at), "MMM d, yyyy h:mm a")
                        : r.scheduled_for
                          ? `Scheduled ${format(new Date(r.scheduled_for), "MMM d, yyyy h:mm a")}`
                          : format(new Date(r.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      {r.sent_at ? (
                        <Badge variant="secondary">Sent</Badge>
                      ) : r.scheduled_for ? (
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15">
                          Scheduled
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/15">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
