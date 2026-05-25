"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import type { RequestTypeState } from "@/lib/actions/admin-request-types";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function RequestTypeForm({
  initial,
  action,
  submitLabel,
  lockKey,
}: {
  initial?: {
    key?: string;
    label?: string;
    category?: "tree" | "arc" | "other";
    description?: string | null;
    allows_inspection?: boolean;
    is_active?: boolean;
    display_order?: number;
  };
  action: (
    state: RequestTypeState | undefined,
    fd: FormData
  ) => Promise<RequestTypeState>;
  submitLabel: string;
  lockKey?: boolean;
}) {
  const router = useRouter();
  const [state, run] = useActionState<RequestTypeState | undefined, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Saved.");
      router.push("/admin/request-types");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={run} className="space-y-4">
      <div>
        <Label htmlFor="key">
          Key <span className="text-destructive">*</span>
        </Label>
        <Input
          id="key"
          name="key"
          required
          maxLength={80}
          defaultValue={initial?.key ?? ""}
          readOnly={lockKey}
          disabled={lockKey}
          placeholder="custom_type_name"
          className="mt-1 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Internal identifier. Lowercase letters, digits, underscores. Cannot
          change after creation.
        </p>
        {state?.fieldErrors?.key && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.key}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="label">
          Label (shown to members) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="label"
          name="label"
          required
          maxLength={200}
          defaultValue={initial?.label ?? ""}
          className="mt-1"
        />
        {state?.fieldErrors?.label && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.label}
          </p>
        )}
      </div>
      <div>
        <Label>Category</Label>
        <Select name="category" defaultValue={initial?.category ?? "other"}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tree">Tree</SelectItem>
            <SelectItem value="arc">Architectural review</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description / help text</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={initial?.description ?? ""}
          placeholder="Optional helper text shown under the type selector."
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="display_order">Display order</Label>
          <Input
            id="display_order"
            name="display_order"
            type="number"
            min={0}
            max={9999}
            defaultValue={initial?.display_order ?? 100}
            className="mt-1 w-32"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lower numbers appear first within the category.
          </p>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial?.is_active ?? true}
              className="h-4 w-4 rounded border-input"
            />
            <span>Active (shown in member picker)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="allows_inspection"
              defaultChecked={initial?.allows_inspection ?? false}
              className="h-4 w-4 rounded border-input"
            />
            <span>Allows inspection_scheduled status</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <Submit label={submitLabel} />
      </div>
    </form>
  );
}
