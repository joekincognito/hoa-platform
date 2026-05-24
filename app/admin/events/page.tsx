import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
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
import { deleteEventAction } from "@/lib/actions/admin-events";

export const metadata = { title: "Events | Admin" };

export default async function EventsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: "upcoming" | "past" | "all" }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "upcoming";

  const supabase = await createClient();
  let q = supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: filter !== "past" });

  const nowIso = new Date().toISOString();
  if (filter === "upcoming") q = q.gte("start_time", nowIso);
  else if (filter === "past") q = q.lt("start_time", nowIso);

  const { data: rows } = await q;

  function tab(value: string, label: string) {
    return (
      <Link
        href={`/admin/events?filter=${value}`}
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
            Events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Calendar items shown on the public site.
          </p>
        </div>
        <Button render={<Link href="/admin/events/new" />}>
          <Plus className="mr-2 h-4 w-4" /> New event
        </Button>
      </header>

      <div className="flex gap-1 rounded-md border bg-muted/30 p-1">
        {tab("upcoming", "Upcoming")}
        {tab("past", "Past")}
        {tab("all", "All")}
      </div>

      <Card>
        <CardContent className="p-0">
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No events in this view.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">When</TableHead>
                  <TableHead className="hidden md:table-cell">Where</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/events/${r.id}`}
                        className="hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        /events/{r.slug}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {format(new Date(r.start_time), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {r.location ?? "—"}
                    </TableCell>
                    <TableCell>
                      {r.is_published ? (
                        <Badge variant="secondary">Published</Badge>
                      ) : (
                        <Badge className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-500/15">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/admin/events/${r.id}`} />}
                        >
                          Edit
                        </Button>
                        <form action={deleteEventAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button size="sm" variant="destructive" type="submit">
                            Delete
                          </Button>
                        </form>
                      </div>
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
