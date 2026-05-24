import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <p className="text-sm text-muted-foreground">
          Welcome back. Members can access the document library and submit
          requests after logging in.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {decodeURIComponent(error)}
          </p>
        )}
        <LoginForm next={next} />
        <div className="flex justify-between text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </Link>
          <Link
            href="/auth/signup"
            className="text-muted-foreground hover:text-foreground"
          >
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
