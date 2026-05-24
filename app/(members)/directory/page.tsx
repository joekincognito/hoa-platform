import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, MapPin, Phone, Users } from "lucide-react";

export const metadata = { title: "Resident directory" };

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DirectoryPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  // RLS only returns profiles where show_in_directory = true and the viewer
  // is an approved member. Per-field opt-ins are stripped here on the server.
  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, address, phone, directory_show_phone, directory_show_email, directory_show_address"
    )
    .eq("show_in_directory", true)
    .order("full_name", { ascending: true });

  if (q) {
    query = query.ilike("full_name", `%${q}%`);
  }

  const { data: rows, error } = await query;

  // We need each user's email — fetch via auth admin would require service
  // role; instead, profiles don't store the email, so we surface only what's
  // already in profiles. Email visibility is intentionally limited here:
  // the email lives in auth.users, not profiles, so we can't leak it.

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Resident directory
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Listed neighbors only. Update your own listing on your{" "}
            <a href="/profile" className="underline">
              profile
            </a>
            .
          </p>
        </div>
        <form className="flex gap-2">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name..."
            className="w-64"
          />
        </form>
      </div>

      {error && (
        <p className="mt-8 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </p>
      )}

      {!error && (rows ?? []).length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed bg-muted/30 p-16 text-center text-sm text-muted-foreground">
          <Users className="mx-auto h-8 w-8" />
          <p className="mt-3">
            {q
              ? `No directory entries match "${q}".`
              : "Nobody has opted in to the directory yet."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(rows ?? []).map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {r.full_name ?? "Unnamed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {r.directory_show_address && r.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {r.address}
                  </p>
                )}
                {r.directory_show_phone && r.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    {r.phone}
                  </p>
                )}
                {r.directory_show_email && (
                  <p className="flex items-center gap-2 text-xs italic">
                    <Mail className="h-3.5 w-3.5" />
                    Email contact available — coming soon
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
