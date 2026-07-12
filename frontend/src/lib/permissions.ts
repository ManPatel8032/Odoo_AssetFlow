export type UserRole = "admin" | "manager" | "employee";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "org_setup",
    "promote_employee",
    "assets_create",
    "assets_edit",
    "assets_delete",
    "audit_manage",
    "bookings_manage",
    "maintenance_manage",
  ],
  manager: [
    "assets_create",
    "assets_edit",
    "audit_view",
    "bookings_manage",
    "maintenance_manage",
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
