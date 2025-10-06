"use client";

import * as React from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

interface LoginState {
  email: string;
  password: string;
}

const INITIAL_STATE: LoginState = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<LoginState>(INITIAL_STATE);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const email = searchParams.get("email");
    if (email) {
      setState((prev) => ({ ...prev, email }));
    }
  }, [searchParams]);

  const handleChange =
    (field: keyof LoginState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: state.email,
        password: state.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      toast({
        title: "Welcome back",
        description: "Great to see you again. Let\'s jam!",
      });

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
            <Lock className="h-6 w-6 text-primary" /> Log in
          </CardTitle>
          <CardDescription>Access your rooms and keep the storytelling flowing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
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
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={state.password}
                onChange={handleChange("password")}
                className="w-full bg-transparent text-sm focus-visible:outline-none"
                placeholder="Your password"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in
              </>
            ) : (
              "Log in"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link href="/register" className="font-medium text-primary underline">
              Register
            </Link>
            .
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
