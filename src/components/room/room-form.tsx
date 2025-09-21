"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";

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
}

const DEFAULT_STATE: FormState = {
  title: "LingvoJam Session",
  description: "Freestyle storytelling with collaborative twists.",
  mode: "crew",
  maxWords: 40,
  maxSentences: 2,
  forbiddenWords: "boring, skip",
  rhymeTarget: "velvet",
};

export function RoomForm() {
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
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          description: state.description,
          hostId: "demo-host",
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
      setState(() => ({ ...DEFAULT_STATE }));
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to create room",
        description: "Please try again in a moment.",
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
          <div className="grid gap-3">
            <label className="text-sm font-medium">Room title</label>
            <input
              value={state.title}
              onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="e.g. Friday Flash Chorus"
              required
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
            />
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Mode</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={state.mode === "solo" ? "secondary" : "outline"}
                onClick={() => setState((prev) => ({ ...prev, mode: "solo" }))}
              >
                Solo practice
              </Button>
              <Button
                type="button"
                variant={state.mode === "crew" ? "secondary" : "outline"}
                onClick={() => setState((prev) => ({ ...prev, mode: "crew" }))}
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
                disabled={state.mode === "solo"}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Preview rules</p>
            <RuleBadges rules={rules} className="mt-2" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Launch room
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
