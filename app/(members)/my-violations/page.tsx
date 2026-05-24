import Link from "next/link";
import { format } from "date-fns";
import { Plus, ShieldAlert } from "lucide-react";
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
  VIOLATION_CATEGORY_LABEL,
  VIOLATION_STATUS_LABEL,
  statusBadgeClass,
  type ViolationCategory,
  type ViolationStatus,
} from "@/lib/workflow/violations";

export const metadata = { title: "My violations" };

export default async function MyViolationsPage({
  searchParams,
}: {
  searchParams: Promise<{ reported?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Violations on properties this user is the homeowner-of-record for
  // (RLS already enforces this, but be explicit for clarity).
  const { data: myProps } = await supabase
    .from("properties")
    .select("id, address")
    .eq("linked_user_id", user!.id);

  const propIds = (myProps ?? []).map((p) => p.id);

  const { data: violations } =
    propIds.length > 0
      ? await supabase
          .from("violations")
          .select("id, category, status, description, created_at, properties(address)")
          .in("property_id", propIds)
          .order("created_at", { ascending: false })
      : { data: [] as never[] };

  // Violations the user themselves reported (separate section)
  const { data: reported } = await supabase
    .from("violations")
    .select("id, category, status, description, created_at, properties(address)")
    .eq("reported_by", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Violations
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            See violations against your property and reports you&apos;ve
            submitted.
          </p>
        </div>
        <Button render={<Link href="/violations/report" />}>
          <Plus className="mr-2 h-4 w-4" /> Report a violation
        </Button>
      </header>

      {sp.reported && (
        <div className="mt-4 rounded-md border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
          Thanks — your report was submitted to the board for review.
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Against my property
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {violations?.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!myProps || myProps.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No property is linked to your account yet. Ask an admin to link
              your profile to your property in the registry.
            </p>
          ) : (violations ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No violations on file against your property. ✓
            </p>
          ) : (
            <ViolationTable rows={violations!} />
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            Reports I submitted
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {reported?.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(reported ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              You haven&apos;t submitted any violation reports.
            </p>
          ) : (
            <ViolationTable rows={reported!} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type ViolationRow = {
  id: string;
  category: string;
  status: string;
  description: string;
  created_at: string;
  properties:
    | { address: string }
    | { address: string }[]
    | null;
};

function pickAddress(p: ViolationRow["properties"]): string {
  if (!p) return "—";
  if (Array.isArray(p)) return p[0]?.address ?? "—";
  return p.address;
}

function ViolationTable({ rows }: { rows: ViolationRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead className="hidden md:table-cell">Category</TableHead>
          <TableHead className="hidden md:table-cell">Reported</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {pickAddress(r.properties)}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
