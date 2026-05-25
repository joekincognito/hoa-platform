"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  FileText,
  LogOut,
  Shield,
  TreePine,
  User,
  Users,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function UserMenu({
  email,
  isAdmin,
  isApproved,
}: {
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1"
        )}
      >
        <User className="h-4 w-4" />
        <span className="hidden max-w-[140px] truncate sm:inline">
          {email}
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-medium">{email}</p>
            {!isApproved && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                Pending board approval
              </p>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/profile" />}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>

          {isApproved && (
            <>
              <DropdownMenuItem render={<Link href="/documents" />}>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/directory" />}>
                <Users className="mr-2 h-4 w-4" />
                Resident directory
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/my-requests" />}>
                <TreePine className="mr-2 h-4 w-4" />
                My requests
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/my-violations" />}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                My violations
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/notifications" />}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Board
              </DropdownMenuLabel>
              <DropdownMenuItem render={<Link href="/admin" />}>
                <Shield className="mr-2 h-4 w-4" />
                Admin dashboard
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
