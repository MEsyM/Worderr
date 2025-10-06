import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a LingvoJam account to host and join collaborative rooms.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Join LingvoJam</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Spin up rooms, invite your crew, and start riffing instantly.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
