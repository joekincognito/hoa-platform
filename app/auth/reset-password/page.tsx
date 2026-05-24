import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Set new password" };

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <p className="text-sm text-muted-foreground">
          This page works after clicking the reset link from your email.
        </p>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
