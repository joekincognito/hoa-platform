import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Audit log | Admin" };

const PAGE_SIZE = 50;

const ENTITY_LINK: Partial<Record<string, (id: string) => string>> = {
  request: (id) => `/admin/requests/${id}`,
  violation: (id) => `/admin/violations/${id}`,
};

function actionBadgeVariant(
  action: string
): "default" | "secondary" | "destructive" | "outline" {
  if (action === "delete") return "destructive";
  if (action === "create") return "secondary";
  return "outline";
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const entityFilter = sp.entity ?? "all";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  let q = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (entityFilter !== "all") q = q.eq("entity_type", entityFilter);

  const { data: rows, count, error } = await q;

  // Resolve actor names in a second query
  const actorIds = Array.from(
    new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean))
  ) as string[];

  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) actorMap.set(p.id, p.full_name ?? "—");
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function tab(value: string, label: string) {
    return (
      <Link
        href={`/admin/audit?entity=${value}`}
        className={
          entityFilter === value
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
          Audit log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every create, update, delete, and status change on requests +
          violations, with the actor and a diff. Read-only.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-1">
        {tab("all", "All")}
        {tab("request", "Requests")}
        {tab("violation", "Violations")}
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
              No audit entries yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => {
                  const linker = ENTITY_LINK[r.entity_type];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.actor_id
                          ? actorMap.get(r.actor_id) ?? r.actor_id.slice(0, 8)
                          : <span className="italic text-muted-foreground">system</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionBadgeVariant(r.action)}>
                          {r.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">
                          {r.entity_type}
                        </span>{" "}
                        {linker && r.entity_id ? (
                          <Link
                            href={linker(r.entity_id)}
                            className="underline"
                          >
                            {r.entity_id.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs">
                            {r.entity_id?.slice(0, 8) ?? ""}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <pre className="overflow-x-auto rounded bg-muted/50 p-1 text-[10px] leading-tight">
                          {JSON.stringify(r.diff, null, 0)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} ({total} entries)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?entity=${entityFilter}&page=${page - 1}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit?entity=${entityFilter}&page=${page + 1}`}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
