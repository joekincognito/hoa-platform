import Link from "next/link";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnsubscribeForm } from "@/components/unsubscribe/UnsubscribeForm";
import { siteConfig } from "@/siteConfig";
import { verifyUnsubscribeToken } from "@/lib/email/tokens";

export const metadata = { title: "Notification preferences" };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string }>;
}) {
  const { u: userId = "", t: token = "" } = await searchParams;

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              This unsubscribe link is invalid or has expired. You can manage
              your notifications by{" "}
              <Link href="/auth/login?next=/profile" className="underline">
                logging in
              </Link>{" "}
              and editing your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "full_name, email_broadcast_opt_in, email_emergency_opt_in, sms_broadcast_opt_in, sms_emergency_opt_in"
    )
    .eq("id", userId)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link href="/" className="font-semibold tracking-tight">
            {siteConfig.hoa.name}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
            <p className="text-sm text-muted-foreground">
              {profile?.full_name
                ? `Hi ${profile.full_name}. `
                : ""}
              Update which messages you want to receive from{" "}
              {siteConfig.hoa.name}.
            </p>
          </CardHeader>
          <CardContent>
            <UnsubscribeForm
              userId={userId}
              token={token}
              initial={{
                email_broadcast_opt_in:
                  profile?.email_broadcast_opt_in ?? false,
                email_emergency_opt_in:
                  profile?.email_emergency_opt_in ?? false,
                sms_broadcast_opt_in: profile?.sms_broadcast_opt_in ?? false,
                sms_emergency_opt_in: profile?.sms_emergency_opt_in ?? false,
              }}
              smsEnabled={siteConfig.features.smsEnabled}
            />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can also manage these preferences from your{" "}
          <Link href="/auth/login?next=/profile" className="underline">
            profile
          </Link>{" "}
          after logging in.
        </p>
      </main>
    </div>
  );
}
