"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileAppealAction, type AppealState } from "@/lib/actions/violations";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send response"}
    </Button>
  );
}

export function AppealForm({ token }: { token: string }) {
  const [state, run] = useActionState<AppealState | undefined, FormData>(
    fileAppealAction,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="rounded-md border border-green-500/40 bg-green-500/5 p-4 text-sm">
        <p className="font-medium text-green-700 dark:text-green-400">
          Thanks — your response was sent to the board.
        </p>
        <p className="mt-1 text-muted-foreground">
          The board will reply by email if they need anything else.
        </p>
      </div>
    );
  }

  return (
    <form action={run} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <Label htmlFor="from_name">Your name (optional)</Label>
        <Input
          id="from_name"
          name="from_name"
          maxLength={160}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="body">
          Your response <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={6}
          required
          minLength={5}
          maxLength={5000}
          placeholder="Explain your situation, dispute the notice, request more time, or describe what you've already done."
          className="mt-1"
        />
        {state?.fieldErrors?.body && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.body}
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
