import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Building2,
  Calendar,
  FileText,
  Megaphone,
  ScrollText,
  Shield,
  Users,
  AlertTriangle,
  TreePine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/siteConfig";

const NAV = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/violations", label: "Violations", icon: AlertTriangle },
  { href: "/admin/requests", label: "Requests (trees/ARC)", icon: TreePine },
  { href: "/admin/request-types", label: "Request types", icon: TreePine },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const path = (await headers()).get("x-pathname") ?? "/admin";
    redirect(`/auth/login?next=${encodeURIComponent(path)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn&apos;t have admin permissions. Ask another
            board member to grant access.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4" />
            {siteConfig.hoa.shortName} Admin
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
