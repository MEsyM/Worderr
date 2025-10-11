import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/realtime/server";
import {
  advanceTurn,
  ensureTurnState,
  loadTurnState,
  serializeCurrentTurn,
} from "@/lib/server/turn-cycle";
import { ApiError } from "@/lib/server/api-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteParams) {
  const params = await context.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const roomState = await loadTurnState(tx, params.id);
      if (!roomState) {
        throw new ApiError(404, "Room not found.");
      }

      const membership = roomState.memberships.find((entry) => entry.userId === session.user.id);
      if (!membership) {
        throw new ApiError(403, "Join the room before skipping turns.");
      }

      if (!membership.isActive) {
        throw new ApiError(403, "You are no longer allowed to contribute to this room.");
      }

      const { room: syncedRoom, events } = await ensureTurnState(tx, roomState, now);

      if (events.some((event) => event.userId === session.user.id)) {
        throw new ApiError(409, "You missed your turn and received a warning.", {
          timeoutEvents: events,
        });
      }

      const currentMembershipId = syncedRoom.currentTurnMembershipId;
      const currentMembership = currentMembershipId
        ? syncedRoom.memberships.find((entry) => entry.id === currentMembershipId)
        : undefined;

      if (!currentMembership || currentMembership.userId !== session.user.id) {
        throw new ApiError(409, "It is not your turn.", { timeoutEvents: events });
      }

      const nextRoom = await advanceTurn(tx, syncedRoom, now);

      return { timeoutEvents: events, nextRoomState: nextRoom };
    });

    const currentTurn = serializeCurrentTurn(result.nextRoomState);
    const memberships = result.nextRoomState.memberships.map((membership) => ({
      membershipId: membership.id,
      userId: membership.userId,
      warnings: membership.warnings,
      isActive: membership.isActive,
    }));

    emitToRoom(params.id, "turn:advanced", {
      roomId: params.id,
      currentTurn,
      memberships,
    });

    return NextResponse.json(
      { currentTurn, memberships, timeoutEvents: result.timeoutEvents },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, ...(error.payload ?? {}) },
        { status: error.status },
      );
    }
    console.error(`Failed to skip turn for room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to skip turn." }, { status: 500 });
  }
}
