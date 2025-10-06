"use client";

import * as React from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRoom } from "@/components/room/room-provider";
import type { RoomTurn } from "@/lib/rooms";

interface VoteBarProps {
  turn: RoomTurn;
  viewerId: string;
}

export function VoteBar({ turn, viewerId }: VoteBarProps) {
  const { castVote } = useRoom();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const positiveVotes = turn.votes.filter((vote) => vote.value > 0).length;
  const totalVotes = turn.votes.length;
  const percentage = totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0;
  const viewerVote = turn.votes.find((vote) => vote.voterId === viewerId)?.value ?? 0;

  const handleVote = async (value: number) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await castVote(turn.id, viewerId, value);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{positiveVotes} approvals</span>
        <span>·</span>
        <span>{totalVotes - positiveVotes} passes</span>
        <span>·</span>
        <span>{percentage}% vibe score</span>
      </div>
      <Progress
        value={percentage}
        indicatorClassName="bg-gradient-to-r from-emerald-500 via-primary to-primary"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant={viewerVote > 0 ? "secondary" : "outline"}
          size="sm"
          disabled={isSubmitting}
          onClick={() => handleVote(viewerVote > 0 ? 0 : 1)}
        >
          <ArrowBigUp className="mr-2 h-4 w-4" /> Cheer
        </Button>
        <Button
          type="button"
          variant={viewerVote < 0 ? "destructive" : "outline"}
          size="sm"
          disabled={isSubmitting}
          onClick={() => handleVote(viewerVote < 0 ? 0 : -1)}
        >
          <ArrowBigDown className="mr-2 h-4 w-4" /> Skip
        </Button>
      </div>
    </div>
  );
}
