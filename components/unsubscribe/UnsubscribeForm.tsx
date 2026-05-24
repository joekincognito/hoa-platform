"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  processUnsubscribeAction,
  type UnsubscribeUpdateState,
} from "@/lib/actions/unsubscribe";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save preferences"}
    </Button>
  );
}

export function UnsubscribeForm({
  userId,
  token,
  initial,
  smsEnabled,
}: {
  userId: string;
  token: string;
  initial: {
    email_broadcast_opt_in: boolean;
    email_emergency_opt_in: boolean;
    sms_broadcast_opt_in: boolean;
    sms_emergency_opt_in: boolean;
  };
  smsEnabled: boolean;
}) {
  const [state, run] = useActionState<
    UnsubscribeUpdateState | undefined,
    FormData
  >(processUnsubscribeAction, undefined);

  const [opts, setOpts] = useState(initial);

  function toggleAll(value: boolean) {
    setOpts({
      email_broadcast_opt_in: value,
      email_emergency_opt_in: value,
      sms_broadcast_opt_in: value && smsEnabled,
      sms_emergency_opt_in: value && smsEnabled,
    });
  }

  if (state?.ok) {
    return (
      <div className="rounded-md border border-green-500/40 bg-green-500/5 p-4 text-sm">
        <p className="font-medium text-green-700 dark:text-green-400">
          Saved.
        </p>
        <p className="mt-1 text-muted-foreground">
          Your notification preferences have been updated.
        </p>
      </div>
    );
  }

  function Box({
    name,
    label,
    description,
    disabled,
  }: {
    name: keyof typeof opts;
    label: string;
    description: string;
    disabled?: boolean;
  }) {
    return (
      <label
        className={
          "flex items-start gap-3 rounded-md border bg-card p-3 text-sm " +
          (disabled ? "opacity-50" : "")
        }
      >
        <input
          type="checkbox"
          name={name}
          checked={opts[name]}
          onChange={(e) => setOpts({ ...opts, [name]: e.target.checked })}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span>
          <span className="font-medium">{label}</span>
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </label>
    );
  }

  return (
    <form action={run} className="space-y-5">
      <input type="hidden" name="u" value={userId} />
      <input type="hidden" name="t" value={token} />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toggleAll(false)}
        >
          Unsubscribe from everything
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => toggleAll(true)}
        >
          Subscribe to everything
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-semibold">Email</p>
        <Box
          name="email_broadcast_opt_in"
          label="General announcements"
          description="Community updates, event reminders, board messages."
        />
        <Box
          name="email_emergency_opt_in"
          label="Emergency alerts"
          description="Water shutoffs, weather, gate issues, safety. Recommended."
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-semibold">
          SMS
          {!smsEnabled && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (not currently available)
            </span>
          )}
        </p>
        <Box
          name="sms_broadcast_opt_in"
          label="General SMS"
          description="Off by default."
          disabled={!smsEnabled}
        />
        <Box
          name="sms_emergency_opt_in"
          label="Emergency SMS"
          description="Off by default. Not a 911 substitute."
          disabled={!smsEnabled}
        />
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
