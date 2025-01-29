import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-50">
              <main className="max-w-lg mx-auto bg-white min-h-screen shadow-sm">
                {children}
              </main>
            </div>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
