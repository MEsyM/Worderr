"use client";
import { AlarmClock, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRoom } from "@/components/room/room-provider";

export function RoomTimer() {
  const { currentPlayer, currentPrompt, timer, advancePlayer } = useRoom();
  const remaining = Math.max(0, timer.remaining);
  const percentage = timer.duration > 0 ? (remaining / timer.duration) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlarmClock className="h-5 w-5 text-primary" /> Turn timer
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {currentPlayer.name} is on the mic · Prompt: {currentPrompt}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={advancePlayer} className="mt-2 sm:mt-0">
          <SkipForward className="mr-2 h-4 w-4" /> Skip turn
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end justify-between text-sm font-medium">
          <span>{remaining}s left</span>
          <span className="text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} />
      </CardContent>
    </Card>
  );
}
