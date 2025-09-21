import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emitToRoom, startRoomTimer } from "@/lib/realtime/server";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { hostId, duration } = body ?? {};

    const room = await prisma.room.update({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
        hostId: hostId ?? undefined,
      },
    });

    const payload = {
      roomId: params.id,
      startedAt: new Date().toISOString(),
      hostId: room.hostId,
    };

    emitToRoom(params.id, "room:started", payload);

    if (typeof duration === "number" && duration >= 0) {
      startRoomTimer(params.id, duration);
    }

    return NextResponse.json({ room, event: payload });
  } catch (error) {
    console.error(`Failed to start room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to start room." }, { status: 500 });
  }
}
