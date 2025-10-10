"use client";
import * as React from "react";
import { AlarmClock, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { useRoom } from "@/components/room/room-provider";

export function RoomTimer() {
  const { currentPlayer, currentPrompt, timer, skipTurn, canSubmit, currentTurn, room } = useRoom();
  const [isSkipping, setIsSkipping] = React.useState(false);
  const remaining = Math.max(0, timer.remaining);
  const percentage = timer.duration > 0 ? (remaining / timer.duration) * 100 : 0;
  const hasTimer = timer.duration > 0 && Boolean(timer.dueAt);
  const warningsUsed = currentTurn?.warnings ?? 0;
  const warningsLeft = Math.max(0, room.maxWarnings - warningsUsed);

  const handleSkip = async () => {
    if (isSkipping || !canSubmit) {
      return;
    }
    setIsSkipping(true);
    try {
      await skipTurn();
    } catch (error) {
      console.error("skipTurn failed", error);
      toast({
        title: "Unable to skip turn",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSkipping(false);
    }
  };

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
          <p className="text-xs text-muted-foreground">
            Warnings remaining: {warningsLeft} of {room.maxWarnings}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkip}
          className="mt-2 sm:mt-0"
          disabled={!canSubmit || isSkipping}
        >
          <SkipForward className="mr-2 h-4 w-4" /> {isSkipping ? "Skipping..." : "Skip turn"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasTimer ? (
          <>
            <div className="flex items-end justify-between text-sm font-medium">
              <span>{remaining}s left</span>
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            </div>
            <Progress value={percentage} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">This room has no turn time limit.</p>
        )}
      </CardContent>
    </Card>
  );
}
