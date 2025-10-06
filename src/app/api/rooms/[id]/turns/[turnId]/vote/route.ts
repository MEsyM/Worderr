import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toRoomTurn } from "@/lib/server/rooms";

interface RouteParams {
  params: Promise<{ id: string; turnId: string }>;
}

export async function PATCH(request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { value } = body ?? {};

    if (![-1, 0, 1].includes(Number(value))) {
      return NextResponse.json({ error: "Vote value must be -1, 0, or 1." }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: { roomId: params.id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Join the room before voting." }, { status: 403 });
    }

    const turn = await prisma.turn.findFirst({
      where: { id: params.turnId, roomId: params.id },
      select: { id: true },
    });

    if (!turn) {
      return NextResponse.json({ error: "Turn not found." }, { status: 404 });
    }

    if (Number(value) === 0) {
      await prisma.vote.deleteMany({
        where: { turnId: params.turnId, voterId: session.user.id },
      });
    } else {
      await prisma.vote.upsert({
        where: {
          turnId_voterId: {
            turnId: params.turnId,
            voterId: session.user.id,
          },
        },
        update: { value: Number(value) },
        create: {
          turnId: params.turnId,
          voterId: session.user.id,
          value: Number(value),
        },
      });
    }

    const updated = await prisma.turn.findUnique({
      where: { id: params.turnId },
      include: { votes: true },
    });

    if (!updated) {
      return NextResponse.json({ error: "Turn not found after voting." }, { status: 404 });
    }

    return NextResponse.json({ turn: toRoomTurn(updated) }, { status: 200 });
  } catch (error) {
    console.error(`Failed to record vote for turn ${params.turnId}`, error);
    return NextResponse.json({ error: "Unable to record vote." }, { status: 500 });
  }
}
