import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  VIOLATION_CATEGORY_LABEL,
  VIOLATION_STATUSES,
  VIOLATION_STATUS_LABEL,
  statusBadgeClass,
  type ViolationCategory,
  type ViolationStatus,
} from "@/lib/workflow/violations";
import { pickOne } from "@/lib/format";

export const metadata = { title: "Violations | Admin" };

const OPEN_STATUSES: ViolationStatus[] = [
  "pending_review",
  "warning_1",
  "warning_2",
  "final_notice",
  "fined",
];

export default async function AdminViolationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "open";

  const supabase = await createClient();
  let q = supabase
    .from("violations")
    .select(
      "id, category, status, description, created_at, properties(address, homeowner_name)"
    )
    .order("created_at", { ascending: false });

  if (statusFilter === "open") q = q.in("status", OPEN_STATUSES);
  else if (VIOLATION_STATUSES.includes(statusFilter as ViolationStatus)) {
    q = q.eq("status", statusFilter);
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
          Violations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Triage incoming reports, escalate warnings, mark resolved.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-1">
        {tab(`/admin/violations?status=open`, "Open", statusFilter === "open")}
        {tab(
          `/admin/violations?status=pending_review`,
          "Pending review",
          statusFilter === "pending_review"
        )}
        {tab(
          `/admin/violations?status=warning_1`,
          "First warning",
          statusFilter === "warning_1"
        )}
        {tab(
          `/admin/violations?status=warning_2`,
          "Second warning",
          statusFilter === "warning_2"
        )}
        {tab(
          `/admin/violations?status=final_notice`,
          "Final notice",
          statusFilter === "final_notice"
        )}
        {tab(`/admin/violations?status=fined`, "Fined", statusFilter === "fined")}
        {tab(
          `/admin/violations?status=resolved`,
          "Resolved",
          statusFilter === "resolved"
        )}
        {tab(
          `/admin/violations?status=dismissed`,
          "Dismissed",
          statusFilter === "dismissed"
        )}
        {tab(`/admin/violations?status=all`, "All", statusFilter === "all")}
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
              No violations match the current filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Reported
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => {
                  const prop = pickOne(r.properties);
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/violations/${r.id}`}
                        className="hover:underline"
                      >
                        {prop?.address ?? "—"}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {r.description}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {VIOLATION_CATEGORY_LABEL[r.category as ViolationCategory]}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                          statusBadgeClass(r.status as ViolationStatus)
                        }
                      >
                        {VIOLATION_STATUS_LABEL[r.status as ViolationStatus]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={`/admin/violations/${r.id}`} />
                        }
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
