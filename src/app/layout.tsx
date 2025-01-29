import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TickTick NLP",
  description: "Manage your tasks with natural language",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-lg mx-auto bg-white min-h-[calc(100vh-4rem)] shadow-sm">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
