import { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listRoomSnapshots } from "@/lib/server/rooms";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Browse active LingvoJam sessions and jump into the story.",
};

function formatDistanceToNow(timestamp: string): string {
  const value = new Date(timestamp).getTime();
  const diffMs = Date.now() - value;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function RoomsPage() {
  const rooms = await listRoomSnapshots();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Active rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse current jams, peek at the rules, and join the vibe that suits your crew.
          </p>
        </div>
        <Button asChild>
          <Link href="/new">Launch a new game</Link>
        </Button>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        {rooms.map((room) => {
          const host = room.participants.find((participant) => participant.id === room.hostId);
          return (
            <Card key={room.id} className="flex h-full flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{room.title}</CardTitle>
                    <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                      Hosted by {host?.name ?? "Unknown"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{room.code}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {room.description && <p className="text-muted-foreground">{room.description}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{room.participants.length} players</span>
                  <span>·</span>
                  <span>{room.turns.length} turns</span>
                  <span>·</span>
                  <span>Updated {formatDistanceToNow(room.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {room.rules.map((rule) => (
                    <Badge key={JSON.stringify(rule)} variant="secondary">
                      {rule.type === "maxWords"
                        ? `${rule.value} words`
                        : rule.type === "maxSentences"
                          ? `${rule.value} sentences`
                          : rule.type === "forbidden"
                            ? `Avoid: ${rule.value.join(", ")}`
                            : `Rhyme with "${rule.value}"`}
                    </Badge>
                  ))}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/r/${room.id}`}>View room</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
