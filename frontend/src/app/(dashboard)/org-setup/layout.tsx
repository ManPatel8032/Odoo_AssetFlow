"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

export default function OrgSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (!hasPermission(user.role, "org_setup")) {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user || !hasPermission(user.role, "org_setup")) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Organization Setup</h1>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <Link href="/org-setup/departments" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Departments
          </Link>
          <Link href="/org-setup/categories" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Categories
          </Link>
          <Link href="/org-setup/employees" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Employees
          </Link>
        </nav>
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}
