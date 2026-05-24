import { format, isSameDay } from "date-fns";

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
