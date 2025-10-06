"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <Button type="button" variant="ghost" size="sm" className={className} onClick={() => signOut()}>
      <LogOut className="mr-2 h-4 w-4" /> Sign out
    </Button>
  );
}
