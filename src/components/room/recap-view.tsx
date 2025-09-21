"use client";
import Link from "next/link";
import { FileText, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoom } from "@/components/room/room-provider";

export function RecapView() {
  const { recap } = useRoom();
  const { room, winningTurn, scoreByParticipant, totalVotes } = recap;

  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" /> Recap
        </CardTitle>
        <CardDescription>
          {room.title} · {room.code} · {scoreByParticipant.length} players · {totalVotes} votes cast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {winningTurn ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <p className="text-xs uppercase tracking-wide text-primary">Highlight</p>
            <p className="mt-1 font-medium text-foreground">{winningTurn.content}</p>
            <p className="text-xs text-muted-foreground">Prompt: {winningTurn.prompt}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">No turns have been published yet.</p>
        )}
        <div className="grid gap-2">
          {scoreByParticipant.map(({ participant, score }) => (
            <div
              key={participant.id}
              className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2"
            >
              <span className="font-medium">{participant.name}</span>
              <span className="text-muted-foreground">{score} pts</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/api/rooms/${room.id}/recap?format=txt`} prefetch={false}>
            <FileText className="mr-2 h-4 w-4" /> Export .txt
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/api/rooms/${room.id}/recap?format=pdf`} prefetch={false}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
