"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PropertyState } from "@/lib/actions/properties";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function PropertyForm({
  initial,
  action,
  submitLabel,
  redirectAfter = "/admin/properties",
}: {
  initial?: {
    address?: string | null;
    homeowner_name?: string | null;
    homeowner_email?: string | null;
    homeowner_phone?: string | null;
    notes?: string | null;
  };
  action: (
    state: PropertyState | undefined,
    fd: FormData
  ) => Promise<PropertyState>;
  submitLabel: string;
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [state, run] = useActionState<PropertyState | undefined, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Saved.");
      router.push(redirectAfter);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router, redirectAfter]);

  return (
    <form action={run} className="space-y-4">
      <div>
        <Label htmlFor="address">
          Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          name="address"
          required
          maxLength={300}
          defaultValue={initial?.address ?? ""}
          className="mt-1"
        />
        {state?.fieldErrors?.address && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.address}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="homeowner_name">Homeowner name</Label>
          <Input
            id="homeowner_name"
            name="homeowner_name"
            maxLength={160}
            defaultValue={initial?.homeowner_name ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="homeowner_phone">Phone</Label>
          <Input
            id="homeowner_phone"
            name="homeowner_phone"
            maxLength={40}
            defaultValue={initial?.homeowner_phone ?? ""}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="homeowner_email">Email (used for notifications)</Label>
          <Input
            id="homeowner_email"
            name="homeowner_email"
            type="email"
            maxLength={200}
            defaultValue={initial?.homeowner_email ?? ""}
            className="mt-1"
          />
          {state?.fieldErrors?.homeowner_email && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.homeowner_email}
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={initial?.notes ?? ""}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Submit label={submitLabel} />
      </div>
    </form>
  );
}
