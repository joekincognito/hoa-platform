import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
import { deleteAnnouncementAction } from "@/lib/actions/admin-announcements";

export const metadata = { title: "Announcements | Admin" };

export default async function AnnouncementsAdminPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("announcements")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Site-wide notices shown on the home page. Active announcements
            render in display order.
          </p>
        </div>
        <Button render={<Link href="/admin/announcements/new" />}>
          <Plus className="mr-2 h-4 w-4" /> New announcement
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No announcements yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.display_order}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/announcements/${r.id}`}
                        className="hover:underline"
                      >
                        {r.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {r.body}
                      </p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-500/15">
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          render={
                            <Link href={`/admin/announcements/${r.id}`} />
                          }
                        >
                          Edit
                        </Button>
                        <form action={deleteAnnouncementAction}>
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
