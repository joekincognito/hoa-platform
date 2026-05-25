import { format } from "date-fns";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
  approveMemberAction,
  revokeMemberAction,
  setAdminAction,
} from "@/lib/actions/admin-members";
import { LinkPropertyButton } from "@/components/admin/LinkPropertyButton";

export const metadata = { title: "Members | Admin" };

type Props = {
  searchParams: Promise<{ filter?: "pending" | "all" | "admins" }>;
};

export default async function AdminMembersPage({ searchParams }: Props) {
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const viewerId = viewer?.id;

  let q = supabase
    .from("profiles")
    .select(
      "id, full_name, address, phone, is_approved, is_admin, created_at, property_id, property:properties(id, address)"
    )
    .order("created_at", { ascending: false });

  if (filter === "pending") q = q.eq("is_approved", false);
  else if (filter === "admins") q = q.eq("is_admin", true);

  const { data: members, error } = await q;

  // Resolve auth emails for every member via service-role lookup.
  const emailMap = new Map<string, string>();
  if (members && members.length > 0) {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: list } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of list?.users ?? []) {
      if (u.email) emailMap.set(u.id, u.email);
    }
  }

  // Fetch all properties for the link dialog
  const { data: allProperties } = await supabase
    .from("properties")
    .select("id, address, linked_user_id")
    .order("address", { ascending: true });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Members
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve new signups, promote admins, revoke access, link to a
            property in the registry.
          </p>
        </div>
        <nav className="flex gap-2 text-sm">
          {(["all", "pending", "admins"] as const).map((f) => (
            <a
              key={f}
              href={`/admin/members?filter=${f}`}
              className={
                filter === f
                  ? "rounded-md bg-foreground px-3 py-1.5 text-background"
                  : "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted"
              }
            >
              {f === "all"
                ? "All"
                : f === "pending"
                  ? "Pending approval"
                  : "Admins"}
            </a>
          ))}
        </nav>
      </header>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "pending"
              ? "Pending approval"
              : filter === "admins"
                ? "Admin users"
                : "All members"}{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {members?.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(members ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No members in this view.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name / email</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Linked property
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Joined
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members!.map((m) => {
                  // Supabase-js infers FK joins as arrays
                  const linkedProperty = Array.isArray(m.property)
                    ? m.property[0]
                    : m.property;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.full_name ?? (
                          <span className="italic">No name</span>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {emailMap.get(m.id) ?? ""}
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-sm md:hidden lg:table-cell">
                        {linkedProperty ? (
                          <span className="text-muted-foreground">
                            {linkedProperty.address}
                          </span>
                        ) : m.address ? (
                          <span className="text-xs italic text-muted-foreground">
                            Profile address: {m.address}
                            <br />
                            (not yet linked)
                          </span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">
                            (not linked)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {format(new Date(m.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {m.is_approved ? (
                            <Badge variant="secondary">Approved</Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20">
                              Pending
                            </Badge>
                          )}
                          {m.is_admin && <Badge>Admin</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {!m.is_approved ? (
                            <form action={approveMemberAction}>
                              <input
                                type="hidden"
                                name="user_id"
                                value={m.id}
                              />
                              <Button size="sm" type="submit">
                                Approve
                              </Button>
                            </form>
                          ) : m.id !== viewerId ? (
                            <form action={revokeMemberAction}>
                              <input
                                type="hidden"
                                name="user_id"
                                value={m.id}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                type="submit"
                              >
                                Revoke
                              </Button>
                            </form>
                          ) : null}
                          <LinkPropertyButton
                            userId={m.id}
                            currentPropertyId={m.property_id ?? null}
                            currentPropertyAddress={
                              linkedProperty?.address ?? null
                            }
                            properties={(allProperties ?? []).map((p) => ({
                              id: p.id,
                              address: p.address,
                              isLinkedElsewhere:
                                Boolean(p.linked_user_id) &&
                                p.linked_user_id !== m.id,
                            }))}
                          />
                          {m.id !== viewerId && (
                            <form action={setAdminAction}>
                              <input
                                type="hidden"
                                name="user_id"
                                value={m.id}
                              />
                              <input
                                type="hidden"
                                name="make_admin"
                                value={m.is_admin ? "false" : "true"}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                type="submit"
                              >
                                {m.is_admin ? "Remove admin" : "Make admin"}
                              </Button>
                            </form>
                          )}
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
