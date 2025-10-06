import { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { listRoomsForUser } from "@/lib/server/rooms";

export const metadata: Metadata = {
  title: "Profile",
  description: "Personal stats, recent turns, and rooms hosted in LingvoJam.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="space-y-6">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to see your rooms, turns, and session stats.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Ready to jam?</CardTitle>
            <CardDescription>
              Create an account or log in to track your progress across rooms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/register">Create account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rooms = await listRoomsForUser(session.user.id);
  const hostedRooms = rooms.filter((room) => room.hostId === session.user?.id);
  const totalTurns = rooms.reduce(
    (acc, room) => acc + room.turns.filter((turn) => turn.authorId === session.user?.id).length,
    0,
  );
  const totalScore = rooms.reduce((acc, room) => {
    const participant = room.participants.find((entry) => entry.id === session.user?.id);
    return acc + (participant?.score ?? 0);
  }, 0);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          {session.user.name ?? "Lingvo jammer"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tracking hosted rooms, turn streaks, and community accolades.
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
            {rooms.length === 0 ? (
              <p className="text-muted-foreground">
                You haven&apos;t joined any rooms yet. Launch a new one to get started.
              </p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{room.title}</p>
                    {room.description && (
                      <p className="text-xs text-muted-foreground">{room.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">{room.code}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
