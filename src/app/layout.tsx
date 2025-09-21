// Root layout establishing fonts, metadata, and shared chrome for LingvoJam.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
  title: {
    default: "LingvoJam",
    template: "%s | LingvoJam",
  },
  description: "Improv-inspired wordplay with live collaboration, powered by Next.js and Tailwind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-base antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4">
          <header className="flex items-center justify-between py-6">
            <span className="text-lg font-semibold">LingvoJam</span>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-sm text-muted-foreground">
            © {currentYear} LingvoJam. Crafted for collaborative wordplay.
          </footer>
        </div>
      </body>
    </html>
  );
}
