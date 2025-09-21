"use client";

import { Crown, Mic } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoom } from "@/components/room/room-provider";

export function ScorePills() {
  const { participants, currentPlayer } = useRoom();
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scoreboard</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {sorted.map((participant, index) => {
          const isLeader = index === 0 && participant.score > 0;
          const isCurrent = participant.id === currentPlayer.id;

          return (
            <Badge
              key={participant.id}
              variant={isLeader ? "success" : isCurrent ? "secondary" : "outline"}
              className="flex items-center gap-1 text-sm"
            >
              {isLeader && <Crown className="h-3.5 w-3.5" />}
              {isCurrent && !isLeader && <Mic className="h-3.5 w-3.5" />}
              <span>{participant.name}</span>
              <span className="text-muted-foreground">· {participant.score}</span>
            </Badge>
          );
        })}
      </CardContent>
    </Card>
  );
}
