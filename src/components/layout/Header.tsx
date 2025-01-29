"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="h-16 bg-white border-b">
      <div className="max-w-lg mx-auto h-full px-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-blue-600">
          TickTick NLP
        </Link>
        {status === "authenticated" && (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
