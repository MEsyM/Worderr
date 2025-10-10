import type { Membership, Prisma } from "@prisma/client";

import { MAX_TURN_SECONDS_CAP } from "@/lib/constants";

const TURN_STATE_INCLUDE = {
  memberships: {
    orderBy: { joinedAt: "asc" as const },
  },
  currentTurnMembership: true,
} satisfies Prisma.RoomInclude;

export type TurnCycleRoom = Prisma.RoomGetPayload<{
  include: typeof TURN_STATE_INCLUDE;
}>;

export interface TurnTimeoutEvent {
  type: "timeout";
  membershipId: string;
  userId: string;
  warnings: number;
  kicked: boolean;
}

export async function loadTurnState(
  tx: Prisma.TransactionClient,
  roomId: string,
): Promise<TurnCycleRoom | null> {
  return tx.room.findUnique({
    where: { id: roomId },
    include: TURN_STATE_INCLUDE,
  });
}

export async function ensureTurnState(
  tx: Prisma.TransactionClient,
  room: TurnCycleRoom,
  now = new Date(),
): Promise<{ room: TurnCycleRoom; events: TurnTimeoutEvent[] }> {
  let state = room;
  const events: TurnTimeoutEvent[] = [];
  const warningLimit = Math.max(1, room.maxWarnings ?? 1);
  const maxTurnSeconds = clampTurnSeconds(room.maxTurnSeconds ?? 0);

  while (true) {
    const activeMembers = state.memberships.filter((membership) => membership.isActive);

    if (activeMembers.length === 0) {
      if (state.currentTurnMembershipId) {
        state = await tx.room.update({
          where: { id: state.id },
          data: { currentTurnMembershipId: null, currentTurnStartedAt: null },
          include: TURN_STATE_INCLUDE,
        });
      }
      break;
    }

    const currentId = state.currentTurnMembershipId;
    const currentMember = currentId
      ? activeMembers.find((membership) => membership.id === currentId)
      : undefined;

    if (!currentMember) {
      const assigned = activeMembers[0];
      state = await tx.room.update({
        where: { id: state.id },
        data: {
          currentTurnMembershipId: assigned.id,
          currentTurnStartedAt: now,
        },
        include: TURN_STATE_INCLUDE,
      });
      continue;
    }

    if (maxTurnSeconds > 0 && state.currentTurnStartedAt) {
      const dueAt = new Date(state.currentTurnStartedAt.getTime() + maxTurnSeconds * 1000);
      if (now > dueAt) {
        const shouldKick = currentMember.warnings + 1 >= warningLimit;
        const updated = await tx.membership.update({
          where: { id: currentMember.id },
          data: {
            warnings: { increment: 1 },
            ...(shouldKick ? { isActive: false, kickedAt: now } : {}),
          },
        });

        events.push({
          type: "timeout",
          membershipId: updated.id,
          userId: updated.userId,
          warnings: updated.warnings,
          kicked: shouldKick,
        });

        state = await tx.room.update({
          where: { id: state.id },
          data: { currentTurnMembershipId: null, currentTurnStartedAt: null },
          include: TURN_STATE_INCLUDE,
        });
        continue;
      }
    }

    break;
  }

  return { room: state, events };
}

export async function advanceTurn(
  tx: Prisma.TransactionClient,
  room: TurnCycleRoom,
  now = new Date(),
): Promise<TurnCycleRoom> {
  const activeMembers = room.memberships.filter((membership) => membership.isActive);

  if (activeMembers.length === 0) {
    return tx.room.update({
      where: { id: room.id },
      data: { currentTurnMembershipId: null, currentTurnStartedAt: null },
      include: TURN_STATE_INCLUDE,
    });
  }

  const currentId = room.currentTurnMembershipId;
  let nextMembership: Membership | undefined;

  if (!currentId) {
    nextMembership = activeMembers[0];
  } else {
    const index = activeMembers.findIndex((membership) => membership.id === currentId);
    if (index === -1) {
      nextMembership = activeMembers[0];
    } else if (activeMembers.length === 1) {
      nextMembership = activeMembers[0];
    } else {
      nextMembership = activeMembers[(index + 1) % activeMembers.length];
    }
  }

  return tx.room.update({
    where: { id: room.id },
    data: nextMembership
      ? {
          currentTurnMembershipId: nextMembership.id,
          currentTurnStartedAt: now,
        }
      : { currentTurnMembershipId: null, currentTurnStartedAt: null },
    include: TURN_STATE_INCLUDE,
  });
}

export function clampTurnSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0;
  }
  return Math.max(0, Math.min(Math.floor(seconds), MAX_TURN_SECONDS_CAP));
}

export function serializeCurrentTurn(room: TurnCycleRoom) {
  const membership = room.currentTurnMembershipId
    ? room.memberships.find((entry) => entry.id === room.currentTurnMembershipId)
    : undefined;

  if (!membership) {
    return undefined;
  }

  const startedAt = room.currentTurnStartedAt?.toISOString();
  const turnSeconds = clampTurnSeconds(room.maxTurnSeconds ?? 0);
  const dueAt =
    turnSeconds > 0 && room.currentTurnStartedAt
      ? new Date(room.currentTurnStartedAt.getTime() + turnSeconds * 1000).toISOString()
      : undefined;

  return {
    membershipId: membership.id,
    userId: membership.userId,
    startedAt: startedAt ?? new Date().toISOString(),
    dueAt,
    warnings: membership.warnings,
  };
}
