"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction, type AuthState } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send reset link"}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    forgotPasswordAction,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="rounded-md border border-green-500/40 bg-green-500/5 p-4 text-sm">
        <p className="font-medium text-green-700 dark:text-green-400">
          Check your email
        </p>
        <p className="mt-1 text-muted-foreground">
          If an account exists for that address, we sent a reset link.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="mt-1" />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>
      <Submit />
    </form>
  );
}
