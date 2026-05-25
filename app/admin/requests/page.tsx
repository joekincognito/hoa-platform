import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
  REQUEST_STATUSES,
  statusBadgeClass,
  type RequestStatus,
} from "@/lib/workflow/requests";

export const metadata = { title: "Requests | Admin" };

const OPEN_STATUSES: RequestStatus[] = [
  "submitted",
  "under_review",
  "inspection_scheduled",
  "needs_more_info",
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "open";
  const typeFilter = sp.type ?? "all";

  const supabase = await createClient();

  let q = supabase
    .from("requests")
    .select(
      "id, type, status, title, submitter_name, submitter_email, created_at"
    )
    .order("created_at", { ascending: false });

  if (statusFilter === "open") q = q.in("status", OPEN_STATUSES);
  else if (REQUEST_STATUSES.includes(statusFilter as RequestStatus)) {
    q = q.eq("status", statusFilter);
  }

  // Look up dynamic type keys for category-based filters
  if (typeFilter === "tree" || typeFilter === "arc") {
    const { data: keys } = await supabase
      .from("request_types")
      .select("key")
      .eq("category", typeFilter);
    const keyList = (keys ?? []).map((k) => k.key);
    if (keyList.length > 0) q = q.in("type", keyList);
  } else if (typeFilter !== "all") {
    q = q.eq("type", typeFilter);
  }

  const { data: rows, error } = await q;

  function tab(href: string, label: string, active: boolean) {
    return (
      <Link
        href={href}
        className={
          active
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
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tree removal and architectural review submissions.
        </p>
      </header>

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1 rounded-md border bg-muted/30 p-1">
          {tab(
            `/admin/requests?status=open&type=${typeFilter}`,
            "Open",
            statusFilter === "open"
          )}
          {tab(
            `/admin/requests?status=approved&type=${typeFilter}`,
            "Approved",
            statusFilter === "approved"
          )}
          {tab(
            `/admin/requests?status=denied&type=${typeFilter}`,
            "Denied",
            statusFilter === "denied"
          )}
          {tab(
            `/admin/requests?status=all&type=${typeFilter}`,
            "All",
            statusFilter === "all"
          )}
        </div>
        <div className="flex gap-1 rounded-md border bg-muted/30 p-1">
          {tab(
            `/admin/requests?status=${statusFilter}&type=all`,
            "All types",
            typeFilter === "all"
          )}
          {tab(
            `/admin/requests?status=${statusFilter}&type=tree`,
            "Trees",
            typeFilter === "tree"
          )}
          {tab(
            `/admin/requests?status=${statusFilter}&type=arc`,
            "Architectural",
            typeFilter === "arc"
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No requests match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">From</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Submitted
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="hover:underline"
                      >
                        {r.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {REQUEST_TYPE_LABEL[r.type] ?? r.type}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {r.submitter_name ?? r.submitter_email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                          statusBadgeClass(r.status as RequestStatus)
                        }
                      >
                        {REQUEST_STATUS_LABEL[r.status as RequestStatus]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={`/admin/requests/${r.id}`} />}
                      >
                        Open
                      </Button>
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
