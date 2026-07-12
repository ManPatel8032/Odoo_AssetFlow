export const ASSET_STATUSES = {
  AVAILABLE: "available",
  ALLOCATED: "allocated",
  MAINTENANCE: "maintenance",
  LOST: "lost",
  RETIRED: "retired",
} as const;

export const MAINTENANCE_STATUSES = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const AUDIT_STATUSES = {
  PENDING: "pending",
  VERIFIED: "verified",
  MISSING: "missing",
} as const;
