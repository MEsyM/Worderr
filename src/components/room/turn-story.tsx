"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoom } from "@/components/room/room-provider";

export function TurnStory() {
  const { turns, participants } = useRoom();

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
      <CardHeader>
        <CardTitle>Story so far</CardTitle>
        <CardDescription>
          {orderedTurns.length} {orderedTurns.length === 1 ? "contribution" : "contributions"}{" "}
          building the narrative
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
