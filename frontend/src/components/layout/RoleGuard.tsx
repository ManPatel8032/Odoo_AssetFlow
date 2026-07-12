import React from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  userRole: string;
  fallback?: React.ReactNode;
}

export default function RoleGuard({
  children,
  allowedRoles,
  userRole,
  fallback = <div className="p-4 text-red-500">Access Denied</div>,
}: RoleGuardProps) {
  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
