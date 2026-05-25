import Link from "next/link";
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
import { deleteRequestTypeAction } from "@/lib/actions/admin-request-types";

export const metadata = { title: "Request types | Admin" };

const CATEGORY_LABEL = {
  tree: "Tree",
  arc: "Architectural",
  other: "Other",
} as const;

export default async function RequestTypesAdminPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("request_types")
    .select("*")
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Request types
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Categories members can pick from on{" "}
            <code>/requests/new</code>. Editable here so the board can add new
            types without a code deploy. Inactive types stay in the DB but
            don&apos;t appear in the picker.
          </p>
        </div>
        <Button render={<Link href="/admin/request-types/new" />}>
          <Plus className="mr-2 h-4 w-4" /> New type
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No request types yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label / Key</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="font-medium">
                      {r.label}
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {r.key}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABEL[r.category as keyof typeof CATEGORY_LABEL] ?? r.category}
                      </Badge>
                      {r.allows_inspection && (
                        <Badge className="ml-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15">
                          Inspection
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {r.display_order}
                    </TableCell>
                    <TableCell>
                      {r.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge className="bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-500/15">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          render={
                            <Link href={`/admin/request-types/${r.key}`} />
                          }
                        >
                          Edit
                        </Button>
                        <form action={deleteRequestTypeAction}>
                          <input type="hidden" name="key" value={r.key} />
                          <Button
                            size="sm"
                            variant="destructive"
                            type="submit"
                          >
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
