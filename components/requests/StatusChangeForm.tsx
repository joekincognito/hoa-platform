"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeRequestStatusAction } from "@/lib/actions/requests";
import {
  REQUEST_STATUS_LABEL,
  type RequestStatus,
} from "@/lib/workflow/requests";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : "Update status"}
    </Button>
  );
}

export function StatusChangeForm({
  requestId,
  currentStatus,
  allowedNextStatuses,
}: {
  requestId: string;
  currentStatus: RequestStatus;
  allowedNextStatuses: RequestStatus[];
}) {
  const [state, run] = useActionState<
    { ok: boolean; error?: string } | undefined,
    FormData
  >(changeRequestStatusAction, undefined);

  useEffect(() => {
    if (state?.ok) toast.success("Status updated.");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  if (allowedNextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This request is closed. No further status changes are allowed.
      </p>
    );
  }

  return (
    <form action={run} className="space-y-4">
      <input type="hidden" name="request_id" value={requestId} />

      <div>
        <Label>Move to status</Label>
        <Select name="to_status" defaultValue={allowedNextStatuses[0]}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedNextStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {REQUEST_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          From{" "}
          <span className="font-medium">
            {REQUEST_STATUS_LABEL[currentStatus]}
          </span>
        </p>
      </div>

      <div>
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          className="mt-1"
          placeholder="Optional note to the submitter or internal-only note."
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked
          className="h-4 w-4 rounded border-input"
        />
        <span>
          Notify submitter by email & show on their timeline (uncheck for an
          internal-only note)
        </span>
      </label>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
