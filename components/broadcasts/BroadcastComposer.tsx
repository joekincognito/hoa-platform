"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  createBroadcastAction,
  type BroadcastState,
} from "@/lib/actions/broadcasts";

function Submit({ scheduled }: { scheduled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Working..."
        : scheduled
          ? "Schedule broadcast"
          : "Send now"}
    </Button>
  );
}

export function BroadcastComposer({ smsEnabled }: { smsEnabled: boolean }) {
  const [state, run] = useActionState<BroadcastState | undefined, FormData>(
    createBroadcastAction,
    undefined
  );
  const [emailChecked, setEmailChecked] = useState(true);
  const [smsChecked, setSmsChecked] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  return (
    <form action={run} className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Channels</Label>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
            <input
              type="checkbox"
              name="channels"
              value="email"
              checked={emailChecked}
              onChange={(e) => setEmailChecked(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">
              <span className="font-medium">Email</span>
              <span className="block text-xs text-muted-foreground">
                via Resend
              </span>
            </span>
          </label>
          <label
            className={
              "flex items-center gap-3 rounded-md border bg-card p-3 text-sm " +
              (smsEnabled ? "" : "opacity-50")
            }
          >
            <input
              type="checkbox"
              name="channels"
              value="sms"
              checked={smsChecked && smsEnabled}
              onChange={(e) => setSmsChecked(e.target.checked)}
              disabled={!smsEnabled}
              className="h-4 w-4 rounded border-input"
            />
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">
              <span className="font-medium">SMS</span>
              <span className="block text-xs text-muted-foreground">
                {smsEnabled
                  ? "via Twilio · ~$0.008 per message"
                  : "Disabled — siteConfig.features.smsEnabled is false"}
              </span>
            </span>
          </label>
        </div>
        {state?.fieldErrors?.channels && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.channels}
          </p>
        )}
      </div>

      <Separator />

      <div>
        <Label htmlFor="subject">Subject (email only)</Label>
        <Input
          id="subject"
          name="subject"
          maxLength={200}
          placeholder="Pool closure on Saturday"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="body">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={8}
          required
          maxLength={8000}
          placeholder="The pool will be closed Saturday May 10 for repairs."
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          SMS recipients see this body (with optional subject prepended) + an
          auto-appended &ldquo;Reply STOP&rdquo; opt-out line.
        </p>
        {state?.fieldErrors?.body && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.body}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <label className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
          <input
            type="checkbox"
            name="also_archive_as_announcement"
            className="h-4 w-4 rounded border-input"
          />
          <span>
            <span className="font-medium">Also post as announcement</span>
            <span className="block text-xs text-muted-foreground">
              Archives this message on the home page in addition to sending.
            </span>
          </span>
        </label>

        <label
          className={
            "flex items-center gap-3 rounded-md border p-3 text-sm " +
            (isEmergency ? "bg-red-500/5 border-red-500/40" : "bg-card")
          }
        >
          <input
            type="checkbox"
            name="is_emergency"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <AlertTriangle
            className={
              "h-4 w-4 " +
              (isEmergency ? "text-red-600" : "text-muted-foreground")
            }
          />
          <span>
            <span className="font-medium">Emergency alert</span>
            <span className="block text-xs text-muted-foreground">
              Uses each recipient&apos;s emergency opt-in (separate from
              general). Shows a red banner on the email.
            </span>
          </span>
        </label>

        <div className="space-y-2 rounded-md border bg-card p-3">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="font-medium">Schedule for later</span>
          </label>
          {scheduled && (
            <Input
              type="datetime-local"
              name="scheduled_for"
              required
              className="ml-7 w-auto"
            />
          )}
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Submit scheduled={scheduled} />
      </div>
    </form>
  );
}
