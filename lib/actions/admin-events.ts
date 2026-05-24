"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug required")
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug: lowercase letters, numbers, single dashes"
    ),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  start_time: z.string().trim().min(1, "Start time required"),
  end_time: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  rsvp_url: z.string().trim().url("Must be a URL").max(500).optional().or(z.literal("")),
  is_published: z.coerce.boolean(),
});

export type EventState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) throw new Error("Not an admin");
  return supabase;
}

function fmt(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (k && !out[k]) out[k] = i.message;
  }
  return out;
}

function parse(formData: FormData) {
  return Schema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time") ?? "",
    location: formData.get("location") ?? "",
    rsvp_url: formData.get("rsvp_url") ?? "",
    is_published: formData.get("is_published") === "on",
  });
}

function row(d: z.infer<typeof Schema>) {
  return {
    title: d.title,
    slug: d.slug,
    description: d.description || null,
    start_time: new Date(d.start_time).toISOString(),
    end_time: d.end_time ? new Date(d.end_time).toISOString() : null,
    location: d.location || null,
    rsvp_url: d.rsvp_url || null,
    is_published: d.is_published,
  };
}

export async function createEventAction(
  _prev: EventState | undefined,
  formData: FormData
): Promise<EventState> {
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fmt(parsed.error) };
  const supabase = await requireAdmin();
  const { error } = await supabase.from("events").insert(row(parsed.data));
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { ok: true };
}

export async function updateEventAction(
  id: string,
  _prev: EventState | undefined,
  formData: FormData
): Promise<EventState> {
  const parsed = parse(formData);
  if (!parsed.success) return { ok: false, fieldErrors: fmt(parsed.error) };
  const supabase = await requireAdmin();
  const { error } = await supabase.from("events").update(row(parsed.data)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEventAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await requireAdmin();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
}
