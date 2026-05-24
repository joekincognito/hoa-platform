"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EventState } from "@/lib/actions/admin-events";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Convert to YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: {
    title?: string | null;
    slug?: string | null;
    description?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    rsvp_url?: string | null;
    is_published?: boolean | null;
  };
  action: (
    state: EventState | undefined,
    fd: FormData
  ) => Promise<EventState>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, run] = useActionState<EventState | undefined, FormData>(
    action,
    undefined
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  useEffect(() => {
    if (state?.ok) {
      toast.success("Saved.");
      router.push("/admin/events");
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
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="mt-1"
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.title}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="slug">
          URL slug <span className="text-destructive">*</span>
        </Label>
        <Input
          id="slug"
          name="slug"
          required
          maxLength={200}
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          /events/{slug || "your-slug"}
        </p>
        {state?.fieldErrors?.slug && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.slug}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          maxLength={8000}
          defaultValue={initial?.description ?? ""}
          className="mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start_time">
            Start <span className="text-destructive">*</span>
          </Label>
          <Input
            id="start_time"
            name="start_time"
            type="datetime-local"
            required
            defaultValue={toLocalInputValue(initial?.start_time)}
            className="mt-1"
          />
          {state?.fieldErrors?.start_time && (
            <p className="mt-1 text-xs text-destructive">
              {state.fieldErrors.start_time}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="end_time">End</Label>
          <Input
            id="end_time"
            name="end_time"
            type="datetime-local"
            defaultValue={toLocalInputValue(initial?.end_time)}
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          maxLength={300}
          defaultValue={initial?.location ?? ""}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="rsvp_url">RSVP / external link</Label>
        <Input
          id="rsvp_url"
          name="rsvp_url"
          type="url"
          maxLength={500}
          defaultValue={initial?.rsvp_url ?? ""}
          placeholder="https://..."
          className="mt-1"
        />
        {state?.fieldErrors?.rsvp_url && (
          <p className="mt-1 text-xs text-destructive">
            {state.fieldErrors.rsvp_url}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={initial?.is_published ?? true}
          className="h-4 w-4 rounded border-input"
        />
        <span>Publish (visible on /events)</span>
      </label>
      <div className="flex justify-end">
        <Submit label={submitLabel} />
      </div>
    </form>
  );
}
