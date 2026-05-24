import { format, isSameDay } from "date-fns";

/**
 * Supabase-js infers FK relationships as arrays by default (even when the
 * SQL guarantees one row). This helper picks the first row from either form.
 */
export function pickOne<T extends object>(
  rel: T | T[] | null | undefined
): T | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

export function formatEventDateRange(
  start: string | Date,
  end?: string | Date | null
): string {
  const s = new Date(start);
  if (!end) return format(s, "EEEE, MMMM d, yyyy · h:mm a");

  const e = new Date(end);
  if (isSameDay(s, e)) {
    return `${format(s, "EEEE, MMMM d, yyyy")} · ${format(s, "h:mm a")} – ${format(e, "h:mm a")}`;
  }
  return `${format(s, "MMM d, yyyy h:mm a")} – ${format(e, "MMM d, yyyy h:mm a")}`;
}

export function formatEventDateShort(start: string | Date): string {
  return format(new Date(start), "MMM d, yyyy · h:mm a");
}
