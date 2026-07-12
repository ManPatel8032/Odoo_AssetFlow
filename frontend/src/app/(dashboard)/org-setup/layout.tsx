import React from "react";
import Link from "next/link";

export default function OrgSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <div>{children}</div>
    </div>
  );
}
