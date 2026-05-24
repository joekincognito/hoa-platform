"use client";

import { useActionState, useState } from "react";
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
import {
  REQUEST_TYPE_LABEL,
  type RequestType,
} from "@/lib/workflow/requests";

const TREE_TYPES: RequestType[] = ["tree_hoa_removal", "tree_homeowner_permission"];
const ARC_TYPES: RequestType[] = [
  "arc_fence",
  "arc_paint",
  "arc_addition",
  "arc_shed",
  "arc_other",
];

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
}: {
  defaultAddress: string;
}) {
  const [state, run] = useActionState<NewRequestState | undefined, FormData>(
    createRequestAction,
    undefined
  );
  const [type, setType] = useState<RequestType>("tree_hoa_removal");
  const isTree = type.startsWith("tree_");

  return (
    <form action={run} className="space-y-6">
      <input type="hidden" name="type" value={type} />

      <div>
        <Label>What kind of request?</Label>
        <Select value={type} onValueChange={(v) => setType(v as RequestType)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Tree
            </div>
            {TREE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {REQUEST_TYPE_LABEL[t]}
              </SelectItem>
            ))}
            <div className="mt-1 px-2 py-1 text-xs font-medium text-muted-foreground">
              Architectural review
            </div>
            {ARC_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {REQUEST_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
