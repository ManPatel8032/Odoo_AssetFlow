"use client";

import Link from "next/link";
import { Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="text-gray-600 font-medium">
        Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
      </div>
      <div className="flex items-center space-x-6">
        <Link href="/notifications" className="text-gray-500 hover:text-gray-700 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 font-medium ml-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
