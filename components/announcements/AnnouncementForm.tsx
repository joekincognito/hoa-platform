"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AnnouncementState } from "@/lib/actions/admin-announcements";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function AnnouncementForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: {
    title?: string | null;
    body?: string | null;
    is_active?: boolean | null;
    display_order?: number | null;
  };
  action: (
    state: AnnouncementState | undefined,
    fd: FormData
  ) => Promise<AnnouncementState>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, run] = useActionState<AnnouncementState | undefined, FormData>(
    action,
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Saved.");
      router.push("/admin/announcements");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={run} className="space-y-4">
      <div>
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={initial?.title ?? ""}
          className="mt-1"
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.title}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="body">
          Body <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={6}
          required
          maxLength={8000}
          defaultValue={initial?.body ?? ""}
          className="mt-1"
        />
        {state?.fieldErrors?.body && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.body}
          </p>
        )}
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
            defaultValue={initial?.display_order ?? 0}
            className="mt-1 w-32"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lower numbers appear first.
          </p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial?.is_active ?? true}
              className="h-4 w-4 rounded border-input"
            />
            <span>Active (visible on home page)</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end">
        <Submit label={submitLabel} />
      </div>
    </form>
  );
}
