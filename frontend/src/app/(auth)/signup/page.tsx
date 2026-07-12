"use client";

import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">Create an Account</h2>
        <form className="mt-8 space-y-6">
          <input type="text" placeholder="Full Name" required className="w-full p-2 border rounded" />
          <input type="email" placeholder="Email address" required className="w-full p-2 border rounded" />
          <input type="password" placeholder="Password" required className="w-full p-2 border rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">Sign Up</button>
        </form>
        <div className="text-center text-sm mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
