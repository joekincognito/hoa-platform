"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
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
import {
  adminCreateViolationAction,
  type AdminCreateState,
} from "@/lib/actions/violations";
import {
  VIOLATION_CATEGORIES,
  VIOLATION_CATEGORY_LABEL,
} from "@/lib/workflow/violations";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Create violation"}
    </Button>
  );
}

export function AdminCreateViolationForm({
  properties,
}: {
  properties: Array<{
    id: string;
    address: string;
    homeowner_name: string | null;
    homeowner_email: string | null;
  }>;
}) {
  const [state, run] = useActionState<AdminCreateState | undefined, FormData>(
    adminCreateViolationAction,
    undefined
  );
  const [propertyId, setPropertyId] = useState<string>(
    properties[0]?.id ?? ""
  );
  const selected = properties.find((p) => p.id === propertyId);

  if (properties.length === 0) {
    return (
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-4 text-sm">
        <p className="font-medium text-yellow-800 dark:text-yellow-300">
          No properties in the registry yet.
        </p>
        <p className="mt-1 text-muted-foreground">
          Add properties first at{" "}
          <a href="/admin/properties" className="underline">
            /admin/properties
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={run} className="space-y-6">
      <input type="hidden" name="property_id" value={propertyId} />

      <div>
        <Label>
          Property <span className="text-destructive">*</span>
        </Label>
        <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.address}
                {p.homeowner_name ? ` — ${p.homeowner_name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && !selected.homeowner_email && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3" />
            No homeowner email on file — escalation emails won&apos;t deliver
            until you fill it in.
          </p>
        )}
      </div>

      <div>
        <Label>
          Category <span className="text-destructive">*</span>
        </Label>
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
          placeholder="What was observed, when, and where on the property?"
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
