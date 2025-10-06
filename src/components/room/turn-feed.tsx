"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteBar } from "@/components/room/vote-bar";
import { useRoom } from "@/components/room/room-provider";
import type { RoomTurn } from "@/lib/rooms";

interface TurnFeedProps {
  viewerId: string;
}

export function TurnFeed({ viewerId }: TurnFeedProps) {
  const { turns, participants } = useRoom();
  const authorLookup = React.useMemo(() => {
    const map = new Map(participants.map((participant) => [participant.id, participant]));
    return map;
  }, [participants]);

  const orderedTurns = [...turns].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (orderedTurns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turn feed</CardTitle>
          <CardDescription>No turns have been submitted yet. Set the tone!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orderedTurns.map((turn) => (
        <TurnCard
          key={turn.id}
          turn={turn}
          viewerId={viewerId}
          authorName={authorLookup.get(turn.authorId)?.name ?? "Unknown"}
        />
      ))}
    </div>
  );
}

interface TurnCardProps {
  turn: RoomTurn;
  viewerId: string;
  authorName: string;
}

function TurnCard({ turn, viewerId, authorName }: TurnCardProps) {
  const timestamp = new Date(turn.publishedAt ?? turn.createdAt);
  const timeAgo = formatDistanceToNow(timestamp);
  const statusVariant =
    turn.status === "published" ? "success" : turn.status === "validated" ? "secondary" : "muted";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Round {turn.round}</CardTitle>
          <CardDescription>{turn.prompt}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{turn.status}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {turn.content}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-foreground">By {authorName}</span>
          <VoteBar turn={turn} viewerId={viewerId} />
        </div>
      </CardContent>
    </Card>
  );
}

function formatDistanceToNow(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}
