"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type AuthState } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    signupAction,
    undefined
  );

  if (state?.needsConfirmation) {
    return (
      <div className="rounded-md border border-green-500/40 bg-green-500/5 p-4 text-sm">
        <p className="font-medium text-green-700 dark:text-green-400">
          Check your email
        </p>
        <p className="mt-1 text-muted-foreground">
          We sent you a confirmation link. After clicking it, your account will
          go to the board for approval.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          className="mt-1"
        />
        {state?.fieldErrors?.full_name && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.full_name}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="address">Home address in the HOA</Label>
        <Input
          id="address"
          name="address"
          type="text"
          required
          maxLength={300}
          autoComplete="street-address"
          placeholder="123 Main Street"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          If your address is in our property registry, your account will be
          linked to it automatically.
        </p>
        {state?.fieldErrors?.address && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.address}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          className="mt-1"
        />
        {state?.fieldErrors?.email && (
          <p className="mt-1 text-xs text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
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
