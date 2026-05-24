import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const path = (await headers()).get("x-pathname") ?? "/documents";
    redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_approved) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-muted/30 py-20">
          <div className="mx-auto max-w-xl px-4">
            <Card>
              <CardHeader>
                <CardTitle>Awaiting board approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Thanks for signing up
                  {profile?.full_name ? `, ${profile.full_name}` : ""}. Your
                  account is pending board review. You&apos;ll get an email
                  when you&apos;re approved.
                </p>
                <p>
                  In the meantime you can{" "}
                  <Link href="/profile" className="underline text-foreground">
                    fill out your profile
                  </Link>
                  .
                </p>
                <Button render={<Link href="/" />} variant="outline">
                  Back to home
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
