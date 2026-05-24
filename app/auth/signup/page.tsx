import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign-ups are reviewed by the board. You&apos;ll get an email once
          you&apos;re approved.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignupForm />
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-foreground underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
