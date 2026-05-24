import Link from "next/link";
import { format } from "date-fns";
import { Inbox, MailOpen, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toggleContactReadAction } from "@/lib/actions/admin-contact";

export const metadata = { title: "Contact submissions | Admin" };

export default async function ContactSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: "unread" | "read" | "all" }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "unread";

  const supabase = await createClient();
  let q = supabase
    .from("contact_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (filter === "unread") q = q.eq("is_read", false);
  else if (filter === "read") q = q.eq("is_read", true);

  const { data: rows, error } = await q;

  function tab(value: string, label: string) {
    return (
      <Link
        href={`/admin/contact?filter=${value}`}
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
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Contact submissions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages from the public contact form in the footer.
        </p>
      </header>

      <div className="flex gap-1 rounded-md border bg-muted/30 p-1">
        {tab("unread", "Unread")}
        {tab("read", "Read")}
        {tab("all", "All")}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </p>
      )}

      {(rows ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto h-8 w-8" />
            <p className="mt-3">No submissions in this view.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows!.map((r) => (
            <Card
              key={r.id}
              className={r.is_read ? "" : "border-yellow-500/40 bg-yellow-500/5"}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">
                      {r.first_name}
                      {r.last_name ? ` ${r.last_name}` : ""}{" "}
                      <a
                        href={`mailto:${r.email}`}
                        className="ml-2 text-sm font-normal text-muted-foreground underline"
                      >
                        {r.email}
                      </a>
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(r.submitted_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.is_read ? (
                      <Badge variant="secondary">
                        <MailOpen className="mr-1 h-3 w-3" /> Read
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20">
                        <Mail className="mr-1 h-3 w-3" /> Unread
                      </Badge>
                    )}
                    <form action={toggleContactReadAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        type="hidden"
                        name="is_read"
                        value={String(r.is_read)}
                      />
                      <Button size="sm" variant="outline" type="submit">
                        Mark {r.is_read ? "unread" : "read"}
                      </Button>
                    </form>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm">{r.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
