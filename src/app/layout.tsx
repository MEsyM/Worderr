// Root layout establishing fonts, metadata, and shared chrome for LingvoJam.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import "./globals.css";

import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/use-toast";
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
          "min-h-screen bg-gradient-to-br from-background via-background to-primary/5 font-sans text-base antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10">
            <header className="sticky top-0 z-30 -mx-4 mb-6 border-b bg-background/80 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                <Link href="/" className="text-lg font-semibold tracking-tight">
                  LingvoJam
                </Link>
                <nav className="hidden items-center gap-4 text-sm font-medium sm:flex">
                  <Link
                    href="/new"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    New game
                  </Link>
                  <Link
                    href="/highlights"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    Highlights
                  </Link>
                  <Link
                    href="/profile"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    Profile
                  </Link>
                </nav>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link href="/new">Launch room</Link>
                  </Button>
                </div>
              </div>
            </header>
            <main className="flex-1 space-y-8 pb-8">{children}</main>
            <footer className="mt-auto border-t py-6 text-center text-xs text-muted-foreground">
              © {currentYear} LingvoJam. Crafted for collaborative wordplay.
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
