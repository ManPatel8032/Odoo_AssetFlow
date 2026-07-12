import Link from "next/link";

export default function Topbar() {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="text-gray-600 font-medium">Welcome back</div>
      <div className="flex items-center space-x-4">
        <Link href="/notifications" className="text-gray-500 hover:text-gray-700">
          Notifications
        </Link>
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          U
        </div>
      </div>
    </header>
  );
}
