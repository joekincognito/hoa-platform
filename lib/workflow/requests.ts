export const REQUEST_TYPES = [
  "tree_hoa_removal",
  "tree_homeowner_permission",
  "arc_fence",
  "arc_paint",
  "arc_addition",
  "arc_shed",
  "arc_other",
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "inspection_scheduled",
  "needs_more_info",
  "approved",
  "denied",
  "withdrawn",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  tree_hoa_removal: "Request removal of an HOA tree",
  tree_homeowner_permission: "Request permission to remove my own tree",
  arc_fence: "Architectural: Fence",
  arc_paint: "Architectural: Exterior paint",
  arc_addition: "Architectural: Addition / new structure",
  arc_shed: "Architectural: Shed",
  arc_other: "Architectural: Other",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  inspection_scheduled: "Inspection scheduled",
  needs_more_info: "Needs more info",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
};

export function statusBadgeClass(status: RequestStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "denied":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "withdrawn":
      return "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400";
    case "needs_more_info":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
    case "inspection_scheduled":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    case "under_review":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
    case "submitted":
    default:
      return "bg-neutral-500/15 text-neutral-700 dark:text-neutral-400";
  }
}

export function isTreeRequest(t: RequestType) {
  return t.startsWith("tree_");
}

export function isArcRequest(t: RequestType) {
  return t.startsWith("arc_");
}

/** Valid transitions from a status. Admins only — submitters can withdraw. */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ["under_review", "needs_more_info", "denied", "approved", "withdrawn"],
  under_review: [
    "inspection_scheduled",
    "needs_more_info",
    "approved",
    "denied",
    "withdrawn",
  ],
  needs_more_info: ["under_review", "denied", "approved", "withdrawn"],
  inspection_scheduled: ["approved", "denied", "needs_more_info"],
  approved: [],
  denied: [],
  withdrawn: [],
};
