"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const { user, loading } = useAuth();
  const role = user?.role || null;

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-6 font-bold text-2xl border-b border-gray-800">
        AssetFlow
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
          Dashboard
        </Link>
        <Link href="/assets" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
          Assets
        </Link>
        <Link href="/allocations" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
          Allocations
        </Link>
        <Link href="/bookings" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
          Bookings
        </Link>
        <Link href="/maintenance" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
          Maintenance
        </Link>
        {(role === "admin" || role === "asset_manager") && (
          <Link href="/audits" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
            Audits
          </Link>
        )}
        <Link href="/reports" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800">
          Reports
        </Link>
        {role === "admin" && (
          <Link href="/org-setup/departments" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-800 text-gray-400 hover:text-white">
            Org Setup
          </Link>
        )}
      </nav>
    </aside>
  );
}
