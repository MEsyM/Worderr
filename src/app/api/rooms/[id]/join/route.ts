import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/realtime/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { userId, role } = body ?? {};

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "A userId is required to join a room." }, { status: 400 });
    }

    const membership = await prisma.membership.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId: params.id,
        },
      },
      update: {
        role: role ?? undefined,
      },
      create: {
        userId,
        roomId: params.id,
        role: role ?? undefined,
      },
    });

    const participantCount = await prisma.membership.count({ where: { roomId: params.id } });

    emitToRoom(params.id, "room:joined", {
      roomId: params.id,
      participants: participantCount,
      userId,
    });

    return NextResponse.json({ membership });
  } catch (error) {
    console.error(`Failed to join room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to join room." }, { status: 500 });
  }
}
