"use client";

import * as React from "react";
import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RuleBadges } from "@/components/room/rule-badges";
import { toast } from "@/components/ui/use-toast";
import type { RoomRule } from "@/lib/rooms";

interface FormState {
  title: string;
  description: string;
  mode: "solo" | "crew";
  maxWords: number;
  maxSentences: number;
  forbiddenWords: string;
  rhymeTarget: string;
  prompts: string;
}

const DEFAULT_STATE: FormState = {
  title: "LingvoJam Session",
  description: "Freestyle storytelling with collaborative twists.",
  mode: "crew",
  maxWords: 40,
  maxSentences: 2,
  forbiddenWords: "boring, skip",
  rhymeTarget: "velvet",
  prompts: [
    'Wordplay warmup: riff on "midnight sparks"',
    'Respond with a line that rhymes with "velvet"',
    "Invent a rule for round three",
  ].join("\n"),
};

export function RoomForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = React.useState<FormState>(DEFAULT_STATE);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const rules = React.useMemo<RoomRule[]>(() => {
    const list: RoomRule[] = [
      { type: "maxWords", value: state.maxWords },
      { type: "maxSentences", value: state.maxSentences },
    ];
    const forbidden = state.forbiddenWords
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    if (forbidden.length > 0) {
      list.push({ type: "forbidden", value: forbidden });
    }
    if (state.mode === "crew" && state.rhymeTarget.trim()) {
      list.push({ type: "rhyme", value: state.rhymeTarget.trim() });
    }
    return list;
  }, [state.maxWords, state.maxSentences, state.forbiddenWords, state.mode, state.rhymeTarget]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) {
      toast({
        title: "Sign in required",
        description: "Create an account or log in before launching a room.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const forbidden = state.forbiddenWords
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean);
      const prompts = state.prompts
        .split("\n")
        .map((prompt) => prompt.trim())
        .filter(Boolean);

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          prompts,
          maxWords: state.maxWords,
          maxSentences: state.maxSentences,
          forbiddenWords: forbidden,
          rhymeTarget: state.mode === "crew" ? state.rhymeTarget.trim() : "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const { room } = await response.json();
      toast({
        title: "Room created",
        description: `Room ${room.code} is ready. Share the code with your crew!`,
      });
      router.push(`/r/${room.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to create room",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> New jam session
          </CardTitle>
          <CardDescription>Configure the vibe and publish your room in seconds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session?.user?.id && status !== "loading" ? (
            <div className="flex items-start gap-3 rounded-md border border-dashed bg-muted/30 p-4 text-sm">
              <LockKeyhole className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Sign in to launch your room</p>
                <p className="text-muted-foreground">
                  You&apos;ll need an account before publishing.{" "}
                  <Link href="/register" className="font-medium underline">
                    Create one now
                  </Link>{" "}
                  or{" "}
                  <Link href="/login" className="font-medium underline">
                    log in
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3">
            <label className="text-sm font-medium">Room title</label>
            <input
              value={state.title}
              onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="e.g. Friday Flash Chorus"
              required
              disabled={!session?.user?.id}
            />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={state.description}
              onChange={(event) =>
                setState((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              disabled={!session?.user?.id}
            />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Prompts (one per line)</label>
            <textarea
              value={state.prompts}
              onChange={(event) => setState((prev) => ({ ...prev, prompts: event.target.value }))}
              className="min-h-[120px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder={'Wordplay warmup: riff on "midnight sparks"'}
              disabled={!session?.user?.id}
            />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Mode</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={state.mode === "solo" ? "secondary" : "outline"}
                onClick={() => setState((prev) => ({ ...prev, mode: "solo" }))}
                disabled={!session?.user?.id}
              >
                Solo practice
              </Button>
              <Button
                type="button"
                variant={state.mode === "crew" ? "secondary" : "outline"}
                onClick={() => setState((prev) => ({ ...prev, mode: "crew" }))}
                disabled={!session?.user?.id}
              >
                Crew battle
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Max words</label>
              <input
                type="number"
                min={10}
                max={150}
                value={state.maxWords}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, maxWords: Number(event.target.value) }))
                }
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={!session?.user?.id}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Max sentences</label>
              <input
                type="number"
                min={1}
                max={8}
                value={state.maxSentences}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, maxSentences: Number(event.target.value) }))
                }
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={!session?.user?.id}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Forbidden words</label>
              <input
                value={state.forbiddenWords}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, forbiddenWords: event.target.value }))
                }
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Comma separated"
                disabled={!session?.user?.id}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Rhyme with</label>
              <input
                value={state.rhymeTarget}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, rhymeTarget: event.target.value }))
                }
                className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                disabled={state.mode === "solo" || !session?.user?.id}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Preview rules</p>
            <RuleBadges rules={rules} className="mt-2 flex flex-wrap items-center gap-2" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSubmitting || !session?.user?.id}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
              </>
            ) : (
              "Create room"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
