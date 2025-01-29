"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to TickTick
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your tasks with natural language
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => signIn("ticktick", { callbackUrl: "/" })}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue with TickTick
          </button>
        </div>
      </div>
    </div>
  );
}
