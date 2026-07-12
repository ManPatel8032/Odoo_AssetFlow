import Link from "next/link";
import { Bell, User } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="text-gray-600 font-medium">Welcome back</div>
      <div className="flex items-center space-x-6">
        <Link href="/notifications" className="text-gray-500 hover:text-gray-700 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </Link>
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold cursor-pointer">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
