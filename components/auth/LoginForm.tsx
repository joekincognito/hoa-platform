"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthState } from "@/lib/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Logging in..." : "Log in"}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState | undefined, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
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
          autoComplete="current-password"
          className="mt-1"
        />
        {state?.fieldErrors?.password && (
          <p className="mt-1 text-xs text-destructive">{state.fieldErrors.password}</p>
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
