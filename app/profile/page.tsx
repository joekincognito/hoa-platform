import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = { title: "Your profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; reset?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Header />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Logged in as <span className="font-medium">{user.email}</span>
            {profile?.is_approved ? (
              <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                Approved member
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Pending board approval
              </span>
            )}
          </p>

          {sp.welcome && (
            <p className="mt-4 rounded-md border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
              Welcome! Fill out your details below — you&apos;ll get an email
              when the board approves your account.
            </p>
          )}
          {sp.reset && (
            <p className="mt-4 rounded-md border border-green-500/40 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
              Password updated.
            </p>
          )}

          <div className="mt-8">
            <ProfileForm initial={profile} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
