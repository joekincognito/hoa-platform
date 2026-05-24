import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
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
  REQUEST_STATUS_LABEL,
  REQUEST_TYPE_LABEL,
  statusBadgeClass,
  type RequestStatus,
  type RequestType,
} from "@/lib/workflow/requests";

export const metadata = { title: "My requests" };

export default async function MyRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requests } = await supabase
    .from("requests")
    .select("id, type, status, title, created_at")
    .eq("submitted_by", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            My requests
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tree removal and architectural review requests you&apos;ve
            submitted.
          </p>
        </div>
        <Button render={<Link href="/requests/new" />}>
          <Plus className="mr-2 h-4 w-4" /> New request
        </Button>
      </header>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            Your requests{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {requests?.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(requests ?? []).length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              You haven&apos;t submitted any requests.{" "}
              <Link href="/requests/new" className="underline">
                Start one.
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests!.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/my-requests/${r.id}`}
                        className="hover:underline"
                      >
                        {r.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {REQUEST_TYPE_LABEL[r.type as RequestType]}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                          statusBadgeClass(r.status as RequestStatus)
                        }
                      >
                        {REQUEST_STATUS_LABEL[r.status as RequestStatus]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={`/my-requests/${r.id}`} />}
                      >
                        View
                      </Button>
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
