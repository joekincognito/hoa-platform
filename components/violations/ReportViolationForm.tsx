"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
import { reportViolationAction, type ReportState } from "@/lib/actions/violations";
import {
  VIOLATION_CATEGORIES,
  VIOLATION_CATEGORY_LABEL,
} from "@/lib/workflow/violations";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit report"}
    </Button>
  );
}

export function ReportViolationForm() {
  const [state, run] = useActionState<ReportState | undefined, FormData>(
    reportViolationAction,
    undefined
  );

  return (
    <form action={run} className="space-y-6">
      <div>
        <Label htmlFor="address">
          Property address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          required
          maxLength={300}
          placeholder="123 Main Street"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Must match a property in the HOA registry.
        </p>
        {state?.fieldErrors?.address && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.address}
          </p>
        )}
      </div>

      <div>
        <Label>Category <span className="text-destructive">*</span></Label>
        <Select name="category" defaultValue="parking">
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIOLATION_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {VIOLATION_CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          placeholder="What did you observe, when, and where on the property? Be specific."
          className="mt-1"
        />
        {state?.fieldErrors?.description && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.description}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="files">Photos (optional)</Label>
        <Input
          id="files"
          name="files"
          type="file"
          accept="image/*,.pdf"
          multiple
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Up to 20 MB per file. Visible to the board only.
        </p>
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
