import Link from "next/link";
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
import { Plus, Upload } from "lucide-react";
import { deletePropertyAction } from "@/lib/actions/properties";

export const metadata = { title: "Properties | Admin" };

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*")
    .order("address", { ascending: true });
  if (q) query = query.ilike("address", `%${q}%`);

  const { data: rows, error } = await query;

  // Resolve linked-user names + emails via service-role lookup so admins
  // can see at a glance which member-of-record owns each property.
  const linkedUserMap = new Map<string, { name: string | null; email: string | null }>();
  const linkedUserIds = Array.from(
    new Set(
      (rows ?? []).map((r) => r.linked_user_id).filter(Boolean) as string[]
    )
  );
  if (linkedUserIds.length > 0) {
    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    );
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", linkedUserIds);
    for (const p of profs ?? []) {
      linkedUserMap.set(p.id, { name: p.full_name, email: null });
    }
    const { data: users } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of users?.users ?? []) {
      if (linkedUserMap.has(u.id)) {
        const cur = linkedUserMap.get(u.id)!;
        linkedUserMap.set(u.id, { ...cur, email: u.email ?? null });
      }
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Properties
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registry of every address in the HOA + homeowner-of-record contact
            info. Used to send violation and request notifications even when
            the owner has no site account.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/properties/import" />} variant="outline">
            <Upload className="mr-2 h-4 w-4" /> CSV import
          </Button>
          <Button render={<Link href="/admin/properties/new" />}>
            <Plus className="mr-2 h-4 w-4" /> Add property
          </Button>
        </div>
      </header>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by address..."
          className="flex h-9 w-72 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </form>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Properties{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {rows?.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(rows ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No properties yet. Use{" "}
              <Link href="/admin/properties/import" className="underline">
                CSV import
              </Link>{" "}
              to load the HOA roster in bulk.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Homeowner</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Linked account
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows!.map((r) => {
                  const linked = r.linked_user_id
                    ? linkedUserMap.get(r.linked_user_id)
                    : null;
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.address}</TableCell>
                    <TableCell>
                      {r.homeowner_name ?? (
                        <span className="text-muted-foreground italic">
                          (unknown)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      <div>{r.homeowner_email ?? "—"}</div>
                      <div>{r.homeowner_phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="hidden text-sm md:hidden lg:table-cell">
                      {linked ? (
                        <div className="text-muted-foreground">
                          <div className="font-medium text-foreground">
                            {linked.name ?? "—"}
                          </div>
                          {linked.email && (
                            <div className="text-xs">{linked.email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          (no account)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/admin/properties/${r.id}`} />}
                        >
                          Edit
                        </Button>
                        <form action={deletePropertyAction}>
                          <input type="hidden" name="id" value={r.id} />
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
