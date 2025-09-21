import { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRoomSnapshot } from "@/lib/rooms";
import type { RoomSnapshot } from "@/lib/rooms";

export const metadata: Metadata = {
  title: "Profile",
  description: "Personal stats, recent turns, and rooms hosted in LingvoJam.",
};

const VIEWER_ID = "host-1";

export default function ProfilePage() {
  const rooms = [getRoomSnapshot("improv"), getRoomSnapshot("solo")].filter(
    Boolean,
  ) as RoomSnapshot[];
  const hostedRooms = rooms.filter((room) => room.hostId === VIEWER_ID);
  const totalTurns = rooms.reduce(
    (acc, room) => acc + room.turns.filter((turn) => turn.authorId === VIEWER_ID).length,
    0,
  );
  const totalScore = rooms.reduce((acc, room) => {
    const participant = room.participants.find((participant) => participant.id === VIEWER_ID);
    return acc + (participant?.score ?? 0);
  }, 0);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Avery</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Host, facilitator, and rhyme wrangler. Tracking the latest sessions and victories.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
            <CardDescription>Lifetime contributions across all rooms.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total turns</span>
              <span className="font-medium">{totalTurns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Score</span>
              <span className="font-medium">{totalScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hosted rooms</span>
              <span className="font-medium">{hostedRooms.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent rooms</CardTitle>
            <CardDescription>Quick links to keep the story going.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{room.title}</p>
                  <p className="text-xs text-muted-foreground">{room.description}</p>
                </div>
                <Badge variant="outline">{room.code}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
