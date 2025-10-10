"use client";
import { Loader2, Users } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

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
import { RoomTimer } from "@/components/room/timer";
import { TurnComposer } from "@/components/room/turn-composer";
import { TurnFeed } from "@/components/room/turn-feed";
import { ScorePills } from "@/components/room/score-pills";
import { RecapView } from "@/components/room/recap-view";
import { useRoom } from "@/components/room/room-provider";
import { TurnStory } from "@/components/room/turn-story";
import { toast } from "@/components/ui/use-toast";

interface RoomExperienceProps {
  viewer?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

export function RoomExperience({ viewer }: RoomExperienceProps) {
  const { room, participants } = useRoom();
  const router = useRouter();
  const viewerId = viewer?.id;
  const isParticipant = viewerId
    ? participants.some((participant) => participant.id === viewerId)
    : false;
  const [isJoining, setIsJoining] = React.useState(false);
  const resolvedViewerId = isParticipant ? viewerId : undefined;
  const canVote = Boolean(resolvedViewerId);

  const handleJoin = React.useCallback(async () => {
    if (!viewerId || isParticipant || isJoining) {
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: viewerId }),
      });

      if (!response.ok) {
        throw new Error("Failed to join room");
      }

      toast({
        title: "You're in!",
        description: "Welcome to the room. Take the next turn when it's yours.",
      });
      router.refresh();
    } catch (error) {
      console.error("joinRoom failed", error);
      toast({
        title: "Unable to join",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, isParticipant, room.id, router, viewerId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{room.title}</h1>
            <p className="text-sm text-muted-foreground">Room code {room.code}</p>
            {room.description && (
              <p className="mt-2 text-sm text-muted-foreground">{room.description}</p>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" /> {participants.length} players
            </div>
            <RuleBadges className="flex flex-wrap gap-1 text-xs" />
          </div>
        </CardContent>
      </Card>
      <RoomTimer />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <TurnStory />
          {isParticipant ? (
            <TurnComposer />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Join this room</CardTitle>
                <CardDescription>
                  {viewer?.name
                    ? `${viewer.name}, jump in to add your twists to the story.`
                    : "Sign in to add your twists to the story."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Joining lets you submit turns, cheer on other players, and collect points.
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                {viewerId ? (
                  <Button type="button" onClick={handleJoin} disabled={isJoining}>
                    {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Join the room
                  </Button>
                ) : (
                  <Button type="button" asChild>
                    <Link href="/login">Sign in to join</Link>
                  </Button>
                )}
                {!viewerId && (
                  <p className="text-xs text-muted-foreground">
                    You need an account to participate in the story.
                  </p>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <ScorePills />
          <TurnFeed viewerId={resolvedViewerId} canVote={canVote} />
          <RecapView />
        </div>
      </div>
    </div>
  );
}
