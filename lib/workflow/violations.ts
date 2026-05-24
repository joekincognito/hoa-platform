export const VIOLATION_CATEGORIES = [
  "parking",
  "landscaping",
  "noise",
  "trash",
  "architectural",
  "pets",
  "signs",
  "other",
] as const;

export type ViolationCategory = (typeof VIOLATION_CATEGORIES)[number];

export const VIOLATION_CATEGORY_LABEL: Record<ViolationCategory, string> = {
  parking: "Parking",
  landscaping: "Landscaping / lawn",
  noise: "Noise",
  trash: "Trash / debris",
  architectural: "Architectural / unapproved changes",
  pets: "Pets",
  signs: "Signs",
  other: "Other",
};

export const VIOLATION_STATUSES = [
  "pending_review",
  "dismissed",
  "warning_1",
  "warning_2",
  "final_notice",
  "fined",
  "resolved",
] as const;

export type ViolationStatus = (typeof VIOLATION_STATUSES)[number];

export const VIOLATION_STATUS_LABEL: Record<ViolationStatus, string> = {
  pending_review: "Pending review",
  dismissed: "Dismissed",
  warning_1: "First warning",
  warning_2: "Second warning",
  final_notice: "Final notice",
  fined: "Fined",
  resolved: "Resolved",
};

/**
 * Statuses that send a warning email to the homeowner with an appeal link.
 * (Resolved/dismissed/pending_review just notify or don't email at all.)
 */
export const WARNING_STATUSES: ViolationStatus[] = [
  "warning_1",
  "warning_2",
  "final_notice",
  "fined",
];

export const ALLOWED_TRANSITIONS: Record<ViolationStatus, ViolationStatus[]> = {
  pending_review: ["dismissed", "warning_1"],
  dismissed: [], // terminal
  warning_1: ["resolved", "warning_2"],
  warning_2: ["resolved", "final_notice"],
  final_notice: ["resolved", "fined"],
  fined: ["resolved"],
  resolved: [], // terminal
};

export function statusBadgeClass(status: ViolationStatus): string {
  switch (status) {
    case "resolved":
      return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "dismissed":
      return "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400";
    case "warning_1":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
    case "warning_2":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
    case "final_notice":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "fined":
      return "bg-red-500/25 text-red-700 dark:text-red-300";
    case "pending_review":
    default:
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  }
}

export function generateAppealToken(): string {
  // 32 hex chars from crypto.getRandomValues — unguessable.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
