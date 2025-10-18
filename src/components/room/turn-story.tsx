"use client";

import * as React from "react";
import { Loader2, Music2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoom } from "@/components/room/room-provider";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface GeneratedSong {
  audio: string;
  prompt: string;
  excerpt: string;
  mood: {
    id: string;
    label: string;
    vibe: string;
    tempo: string;
    instrumentation: string;
    description: string;
  };
  stats: {
    positivity: number;
    energy: number;
    keywords: string[];
  };
}

export function TurnStory() {
  const { room, turns, participants } = useRoom();
  const [song, setSong] = React.useState<GeneratedSong | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const orderedTurns = React.useMemo(
    () =>
      [...turns]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .filter((turn) => turn.content.trim().length > 0),
    [turns],
  );

  const authorLookup = React.useMemo(() => {
    return new Map(participants.map((participant) => [participant.id, participant.name]));
  }, [participants]);

  const handleGenerateSong = React.useCallback(async () => {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/song`, { method: "POST" });

      if (!response.ok) {
        let message = "Unable to compose a soundtrack.";
        try {
          const payload = await response.json();
          if (payload?.error) {
            message = String(payload.error);
          }
        } catch (error) {
          console.error("Failed to parse soundtrack error", error);
        }
        throw new Error(message);
      }

      const payload = (await response.json()) as GeneratedSong;
      setSong(payload);
      toast({
        title: "Soundtrack ready",
        description: "Press play to hear the room's new theme.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to compose a soundtrack.";
      toast({
        title: "Music not available",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, room.id]);

  if (orderedTurns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Story so far</CardTitle>
          <CardDescription>The room hasn&apos;t collected any lines yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Story so far</CardTitle>
          <CardDescription>
            {orderedTurns.length} {orderedTurns.length === 1 ? "contribution" : "contributions"}{" "}
            building the narrative
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleGenerateSong}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Music2 className="mr-2 h-4 w-4" />
          )}
          {song ? "Regenerate song" : "Create room soundtrack"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {song && (
          <section className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{song.mood.label}</p>
              <p className="text-xs text-muted-foreground">
                {song.mood.description} · {song.mood.tempo}
              </p>
            </div>
            <audio controls className="w-full" src={song.audio} />
            <p className="text-xs text-muted-foreground">{song.mood.instrumentation}</p>
            <p className="text-xs italic text-muted-foreground">Inspired by: “{song.excerpt}”</p>
            {song.stats.keywords.length > 0 && (
              <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                Keywords: {song.stats.keywords.join(", ")}
              </p>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none text-foreground">
                Prompt details
              </summary>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{song.prompt}</p>
            </details>
          </section>
        )}
        {orderedTurns.map((turn) => (
          <article key={turn.id} className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Round {turn.round} · {authorLookup.get(turn.authorId) ?? "Unknown"}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {turn.content}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
