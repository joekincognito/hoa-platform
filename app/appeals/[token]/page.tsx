import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppealForm } from "@/components/violations/AppealForm";
import { siteConfig } from "@/siteConfig";
import { pickOne } from "@/lib/format";
import {
  VIOLATION_CATEGORY_LABEL,
  VIOLATION_STATUS_LABEL,
  statusBadgeClass,
  type ViolationCategory,
  type ViolationStatus,
} from "@/lib/workflow/violations";

export const metadata = { title: "Respond to a notice" };

type Props = { params: Promise<{ token: string }> };

export default async function AppealPage({ params }: Props) {
  const { token } = await params;

  // Direct service-role lookup so the page works without auth.
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: v } = await admin
    .from("violations")
    .select(
      "id, category, status, description, fine_amount, created_at, properties(address)"
    )
    .eq("appeal_token", token)
    .maybeSingle();

  if (!v) notFound();

  const status = v.status as ViolationStatus;
  const prop = pickOne<{ address: string }>(
    v.properties as { address: string } | { address: string }[] | null
  );

  // Public prior responses (homeowner messages already submitted)
  const { data: events } = await admin
    .from("status_events")
    .select("comment, created_at, actor_id, to_status")
    .eq("entity_type", "violation")
    .eq("entity_id", v.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link href="/" className="font-semibold tracking-tight">
            {siteConfig.hoa.name}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>
                    {VIOLATION_CATEGORY_LABEL[v.category as ViolationCategory]}{" "}
                    notice
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Property: <strong>{prop?.address ?? "(unknown)"}</strong>
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
                    statusBadgeClass(status)
                  }
                >
                  {VIOLATION_STATUS_LABEL[status]}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Description</p>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">
                  {v.description}
                </p>
              </div>
              {v.fine_amount && (
                <div>
                  <p className="font-medium">Fine amount</p>
                  <p className="mt-1 text-muted-foreground">
                    ${Number(v.fine_amount).toFixed(2)}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Notice issued {format(new Date(v.created_at), "MMMM d, yyyy")}
              </p>
            </CardContent>
          </Card>

          {events && events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {events.map((e, i) => (
                    <li key={i} className="text-sm">
                      <Badge variant="secondary">
                        {e.actor_id === null
                          ? "Homeowner"
                          : VIOLATION_STATUS_LABEL[
                              e.to_status as ViolationStatus
                            ] ?? e.to_status}
                      </Badge>{" "}
                      <span className="text-muted-foreground">
                        {format(new Date(e.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                      {e.comment && (
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {e.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Respond</CardTitle>
              <p className="text-sm text-muted-foreground">
                Send a message to the board: dispute, request more time, or
                explain steps you&apos;ve taken. Your response will be added to
                the violation record and emailed to the board.
              </p>
            </CardHeader>
            <CardContent>
              <AppealForm token={token} />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            This message comes from {siteConfig.hoa.name}. If you didn&apos;t
            expect this notice, please reply explaining and the board will look
            into it.
          </p>
        </div>
      </main>
    </div>
  );
}
