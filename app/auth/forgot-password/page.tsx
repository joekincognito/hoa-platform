import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-sm">
          <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
            ← Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
