"use client";

import Link from "next/link";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    asset_manager: "Asset Manager",
    department_head: "Department Head",
    employee: "Employee",
  };

  return (
    <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-8 shadow-sm flex-shrink-0">
      {/* Left: Greeting */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-800">
          Welcome back, {user?.full_name || "User"}
        </span>
        <span className="text-xs text-gray-400">{roleLabel[user?.role ?? ""] || "AssetFlow"}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-700 leading-none">{user?.full_name || "User"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.email || ""}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <button
                onClick={() => { setShowDropdown(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
