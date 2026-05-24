import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/siteConfig";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/site/UserMenu";

const NAV = [
  { href: "/#about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/#announcements", label: "Announcements" },
  { href: "/board", label: "Board" },
  { href: "/documents", label: "Documents" },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-semibold tracking-tight text-foreground">
            {siteConfig.hoa.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu email={user.email ?? ""} />
          ) : (
            <Button
              render={<Link href="/auth/login" />}
              size="sm"
              variant="outline"
            >
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
