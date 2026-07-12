export type UserRole = "admin" | "asset_manager" | "department_head" | "employee";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "org_setup",
    "promote_employee",
    "audit_manage",
    "audit_view",
  ],
  asset_manager: [
    "assets_create",
    "assets_edit",
    "audit_manage",
    "audit_view",
    "bookings_manage",
    "maintenance_manage",
  ],
  department_head: [
    "assets_view",
    "bookings_manage", // e.g. approving bookings/transfers for their department
  ],
  employee: [
    "assets_view",
    "bookings_create",
    "bookings_view",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
