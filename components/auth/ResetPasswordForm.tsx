"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type AuthState } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Updating..." : "Update password"}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    resetPasswordAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.password}
          </p>
        )}
      </div>
      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Submit />
    </form>
  );
}
