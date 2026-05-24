import { format } from "date-fns";
import { Bell, Mail, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pull broadcasts the user actually received (via broadcast_deliveries RLS)
  const { data: deliveries } = await supabase
    .from("broadcast_deliveries")
    .select("channel, status, sent_at, broadcast:broadcasts(id, subject, body, is_emergency, sent_at)")
    .eq("recipient_user_id", user!.id)
    .order("sent_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Notifications
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Community-wide messages you&apos;ve received. Update preferences on
          your{" "}
          <a href="/profile" className="underline">
            profile
          </a>
          .
        </p>
      </header>

      {(deliveries ?? []).length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto h-8 w-8" />
            <p className="mt-3">No broadcasts received yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {deliveries!.map((d, i) => {
            // broadcast can be array due to Supabase join inference
            const broadcast = Array.isArray(d.broadcast)
              ? d.broadcast[0]
              : d.broadcast;
            if (!broadcast) return null;
            return (
              <Card
                key={i}
                className={
                  broadcast.is_emergency
                    ? "border-red-500/40 bg-red-500/5"
                    : ""
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {broadcast.subject || "(no subject)"}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {broadcast.sent_at
                          ? format(
                              new Date(broadcast.sent_at),
                              "MMM d, yyyy h:mm a"
                            )
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="outline">
                        {d.channel === "email" ? (
                          <Mail className="mr-1 h-3 w-3" />
                        ) : (
                          <MessageSquare className="mr-1 h-3 w-3" />
                        )}
                        {d.channel}
                      </Badge>
                      {broadcast.is_emergency && (
                        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15">
                          Emergency
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm">{broadcast.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
