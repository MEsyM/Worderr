import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/realtime/server";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { turnId, voterId, value } = body ?? {};

    if (!turnId || typeof turnId !== "string") {
      return NextResponse.json({ error: "A turnId is required." }, { status: 400 });
    }

    if (!voterId || typeof voterId !== "string") {
      return NextResponse.json({ error: "A voterId is required." }, { status: 400 });
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return NextResponse.json({ error: "A numeric vote value is required." }, { status: 400 });
    }

    const vote = await prisma.vote.upsert({
      where: {
        turnId_voterId: {
          turnId,
          voterId,
        },
      },
      update: { value },
      create: {
        turnId,
        voterId,
        value,
      },
    });

    emitToRoom(params.id, "turn:voted", {
      roomId: params.id,
      turnId,
      voterId,
      value,
    });

    return NextResponse.json({ vote });
  } catch (error) {
    console.error(`Failed to register vote for room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to register vote." }, { status: 500 });
  }
}
