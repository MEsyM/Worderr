"use client";

import { SessionProvider } from "next-auth/react";
import * as React from "react";
import type { Session } from "next-auth";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/use-toast";

type AppProvidersProps = {
  children: React.ReactNode;
  session: Session | null;
};

export function AppProviders({ children, session }: AppProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
