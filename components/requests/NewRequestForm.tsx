"use client";

import { useActionState, useMemo, useState } from "react";
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
import {
  createRequestAction,
  type NewRequestState,
} from "@/lib/actions/requests";
import type { RequestTypeRow } from "@/lib/workflow/requests";

const CATEGORY_HEADER: Record<RequestTypeRow["category"], string> = {
  tree: "Tree",
  arc: "Architectural review",
  other: "Other",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit request"}
    </Button>
  );
}

export function NewRequestForm({
  defaultAddress,
  types,
}: {
  defaultAddress: string;
  types: RequestTypeRow[];
}) {
  const [state, run] = useActionState<NewRequestState | undefined, FormData>(
    createRequestAction,
    undefined
  );

  const grouped = useMemo(() => {
    const out: Record<RequestTypeRow["category"], RequestTypeRow[]> = {
      tree: [],
      arc: [],
      other: [],
    };
    for (const t of types) {
      out[t.category].push(t);
    }
    return out;
  }, [types]);

  const [type, setType] = useState<string>(types[0]?.key ?? "");
  const selectedType = types.find((t) => t.key === type);
  const isTree = selectedType?.category === "tree";

  if (types.length === 0) {
    return (
      <div className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-4 text-sm">
        <p className="font-medium text-yellow-800 dark:text-yellow-300">
          No request types available yet.
        </p>
        <p className="mt-1 text-muted-foreground">
          Ask an admin to add some at <code>/admin/request-types</code>.
        </p>
      </div>
    );
  }

  return (
    <form action={run} className="space-y-6">
      <input type="hidden" name="type" value={type} />

      <div>
        <Label>What kind of request?</Label>
        <Select value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="mt-1 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--anchor-width)] w-max max-w-[90vw]">
            {(["tree", "arc", "other"] as const).map((cat) =>
              grouped[cat].length === 0 ? null : (
                <div key={cat}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {CATEGORY_HEADER[cat]}
                  </div>
                  {grouped[cat].map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </div>
              )
            )}
          </SelectContent>
        </Select>
        {selectedType?.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedType.description}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="address">
          Property address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          required
          maxLength={300}
          defaultValue={defaultAddress}
          className="mt-1"
        />
        {state?.fieldErrors?.address && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.address}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="title">
          Short title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder={
            isTree
              ? "Maple in front yard, dead branches"
              : "6 ft cedar privacy fence, back yard"
          }
          className="mt-1"
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="reason">
          {isTree ? "Reason for removal" : "Scope / details"}
        </Label>
        <Input
          id="reason"
          name="reason"
          maxLength={200}
          placeholder={
            isTree
              ? "dead / diseased / hazard / blocking view / other"
              : "materials, dimensions, contractor name"
          }
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">
          Full description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={5000}
          className="mt-1"
          placeholder={
            isTree
              ? "Describe the tree (species if known), where it is on the property, why removal is needed, and any photos you'll attach."
              : "Describe the project: scope, materials, dimensions, location on lot, color choices, contractor."
          }
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
          Up to 20 MB per file. JPEG/PNG/PDF.
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
