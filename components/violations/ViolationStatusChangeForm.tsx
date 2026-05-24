"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeViolationStatusAction } from "@/lib/actions/violations";
import {
  VIOLATION_STATUS_LABEL,
  WARNING_STATUSES,
  type ViolationStatus,
} from "@/lib/workflow/violations";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Apply"}
    </Button>
  );
}

export function ViolationStatusChangeForm({
  violationId,
  currentStatus,
  allowedNextStatuses,
  hasHomeownerEmail,
}: {
  violationId: string;
  currentStatus: ViolationStatus;
  allowedNextStatuses: ViolationStatus[];
  hasHomeownerEmail: boolean;
}) {
  const [state, run] = useActionState<
    { ok: boolean; error?: string } | undefined,
    FormData
  >(changeViolationStatusAction, undefined);
  const [toStatus, setToStatus] = useState<ViolationStatus>(
    allowedNextStatuses[0] ?? currentStatus
  );

  useEffect(() => {
    if (state?.ok) toast.success("Status updated.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  if (allowedNextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This violation is closed (
        <strong>{VIOLATION_STATUS_LABEL[currentStatus]}</strong>). No further
        changes allowed.
      </p>
    );
  }

  const willEmailHomeowner =
    WARNING_STATUSES.includes(toStatus) || toStatus === "resolved";
  const isFining = toStatus === "fined";

  return (
    <form action={run} className="space-y-4">
      <input type="hidden" name="violation_id" value={violationId} />

      <div>
        <Label>Move to status</Label>
        <Select
          name="to_status"
          value={toStatus}
          onValueChange={(v) => setToStatus(v as ViolationStatus)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedNextStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {VIOLATION_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          From{" "}
          <span className="font-medium">
            {VIOLATION_STATUS_LABEL[currentStatus]}
          </span>
        </p>
      </div>

      <div>
        <Label htmlFor="comment">
          Note (included in homeowner email if applicable)
        </Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          className="mt-1"
        />
      </div>

      {isFining && (
        <div>
          <Label htmlFor="fine_amount">
            Fine amount <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fine_amount"
            name="fine_amount"
            type="number"
            min={1}
            step="0.01"
            required
            className="mt-1 w-40"
          />
        </div>
      )}

      {willEmailHomeowner && !hasHomeownerEmail && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/5 p-3 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No homeowner email on file for this property. The status will
            change but no email will go out — update the property in the
            registry to enable notifications.
          </span>
        </div>
      )}

      {willEmailHomeowner && hasHomeownerEmail && (
        <p className="text-xs text-muted-foreground">
          ✉ An email will be sent to the homeowner-of-record with the appeal
          link.
        </p>
      )}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
