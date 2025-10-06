"use client";

import * as React from "react";
import { Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface RegisterState {
  name: string;
  email: string;
  password: string;
}

const INITIAL_STATE: RegisterState = {
  name: "",
  email: "",
  password: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = React.useState<RegisterState>(INITIAL_STATE);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange =
    (field: keyof RegisterState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim() || null,
          email: state.email,
          password: state.password,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "Unable to register.");
        return;
      }

      toast({
        title: "Account created",
        description: "We signed you in automatically. Let\'s build your first room!",
      });

      const signInResult = await signIn("credentials", {
        email: state.email,
        password: state.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast({
          title: "Log in to continue",
          description: "Your account is ready. Please sign in with your email and password.",
        });
        router.push("/login");
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-0">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="h-6 w-6 text-primary" /> Create your account
          </CardTitle>
          <CardDescription>
            Unlock collaborative wordplay by creating a LingvoJam account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="name">
              Display name
            </label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <input
                id="name"
                type="text"
                value={state.name}
                onChange={handleChange("name")}
                className="w-full bg-transparent text-sm focus-visible:outline-none"
                placeholder="e.g. Cipher Sage"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={state.email}
                onChange={handleChange("email")}
                className="w-full bg-transparent text-sm focus-visible:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={state.password}
                onChange={handleChange("password")}
                className="w-full bg-transparent text-sm focus-visible:outline-none"
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account
              </>
            ) : (
              "Register"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Log in
            </Link>
            .
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
