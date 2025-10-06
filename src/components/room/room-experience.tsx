"use client";
import { Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { RuleBadges } from "@/components/room/rule-badges";
import { RoomTimer } from "@/components/room/timer";
import { TurnComposer } from "@/components/room/turn-composer";
import { TurnFeed } from "@/components/room/turn-feed";
import { ScorePills } from "@/components/room/score-pills";
import { RecapView } from "@/components/room/recap-view";
import { useRoom } from "@/components/room/room-provider";
import { TurnStory } from "@/components/room/turn-story";

interface RoomExperienceProps {
  viewerId?: string;
}

export function RoomExperience({ viewerId }: RoomExperienceProps) {
  const { room, participants } = useRoom();
  const fallbackViewer = participants[0]?.id;
  const resolvedViewerId = viewerId ?? fallbackViewer ?? "";

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
          <TurnComposer />
        </div>
        <div className="space-y-6">
          <ScorePills />
          <TurnFeed viewerId={resolvedViewerId} />
          <RecapView />
        </div>
      </div>
    </div>
  );
}
