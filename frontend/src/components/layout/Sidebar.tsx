"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  BookOpen,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/allocations", label: "Allocations", icon: Users },
  { href: "/bookings", label: "Bookings", icon: BookOpen },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/audits", label: "Audits", icon: ClipboardCheck, roles: ["admin", "asset_manager"] },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/org-setup/departments", label: "Org Setup", icon: Settings, roles: ["admin", "department_head"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || null;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filtered = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role ?? "");
  });

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } bg-gray-900 text-white flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out relative`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200 flex items-center justify-center shadow-md transition-all duration-200"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${collapsed ? "rotate-0" : "rotate-180"}`} />
      </button>

      {/* Logo */}
      <div className={`border-b border-gray-800/60 flex items-center ${collapsed ? "justify-center px-0 py-5" : "px-6 py-5"}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-lg tracking-tight text-white block">AssetFlow</span>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Management Suite</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2" : "px-3"}`}>
        {filtered.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group ${
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
              } ${
                active
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  active ? "text-gray-200" : "text-gray-500 group-hover:text-gray-300"
                }`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-gray-800/60 ${collapsed ? "px-2 py-4 flex justify-center" : "px-4 py-4"}`}>
        {collapsed ? (
          <div
            title={user?.full_name || "User"}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 cursor-default"
          >
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-gray-200 truncate">{user?.full_name || "User"}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role?.replace("_", " ") || ""}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
