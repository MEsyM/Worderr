import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toRoomTurn } from "@/lib/server/rooms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { content, prompt } = body ?? {};

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Turn content is required." }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { memberships: { select: { userId: true } } },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const isMember = room.memberships.some((membership) => membership.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Join the room before submitting turns." },
        { status: 403 },
      );
    }

    const latestTurn = await prisma.turn.findFirst({
      where: { roomId: params.id },
      orderBy: { round: "desc" },
      select: { round: true },
    });
    const nextRound = (latestTurn?.round ?? 0) + 1;

    const created = await prisma.turn.create({
      data: {
        roomId: params.id,
        authorId: session.user.id,
        round: nextRound,
        prompt: typeof prompt === "string" ? prompt : "",
        content,
        endedAt: new Date(),
      },
      include: { votes: true },
    });

    return NextResponse.json({ turn: toRoomTurn(created) }, { status: 201 });
  } catch (error) {
    console.error(`Failed to create turn for room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to submit turn." }, { status: 500 });
  }
}
