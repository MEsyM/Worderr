import "server-only";

import type { Prisma } from "@prisma/client";
import { RoomRole } from "@prisma/client";

import {
  buildRecapFromSnapshot,
  calculateParticipantScores,
  type RoomCurrentTurn,
  type RoomHighlight,
  type RoomParticipant,
  type RoomRecap,
  type RoomRule,
  type RoomSnapshot,
  type RoomTurn,
  type TurnStatus,
} from "@/lib/rooms";
import { prisma } from "@/lib/prisma";
import { MAX_TURN_SECONDS_CAP } from "@/lib/constants";
import { ensureTurnState, loadTurnState } from "@/lib/server/turn-cycle";

const ROOM_WITH_RELATIONS_INCLUDE = {
  memberships: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  },
  turns: {
    orderBy: { startedAt: "asc" },
    include: {
      votes: true,
    },
  },
  summaries: {
    orderBy: { createdAt: "desc" },
    include: {
      turn: {
        select: {
          id: true,
          prompt: true,
          content: true,
        },
      },
    },
  },
  currentTurnMembership: true,
} satisfies Prisma.RoomInclude;

type RoomWithRelations = Prisma.RoomGetPayload<{ include: typeof ROOM_WITH_RELATIONS_INCLUDE }>;

export type TurnWithVotes = Prisma.TurnGetPayload<{
  include: {
    votes: true;
  };
}>;

type SummaryWithTurn = Prisma.SummaryGetPayload<{
  include: {
    turn: {
      select: {
        id: true;
        prompt: true;
        content: true;
      };
    };
    room: {
      select: {
        id: true;
        title: true;
        code: true;
      };
    };
  };
}>;

export function toRoomTurn(turn: TurnWithVotes): RoomTurn {
  const status: TurnStatus = turn.content ? "published" : turn.endedAt ? "validated" : "proposed";

  return {
    id: turn.id,
    round: turn.round,
    prompt: turn.prompt,
    content: turn.content ?? "",
    authorId: turn.authorId ?? "",
    status,
    createdAt: turn.startedAt.toISOString(),
    publishedAt: turn.endedAt?.toISOString(),
    votes: turn.votes.map((vote) => ({
      voterId: vote.voterId,
      value: vote.value,
    })),
  };
}

function deriveRules(room: RoomWithRelations): RoomRule[] {
  const rules: RoomRule[] = [
    { type: "maxWords", value: room.maxWords ?? 40 },
    { type: "maxSentences", value: room.maxSentences ?? 2 },
  ];

  const forbiddenWords = room.forbiddenWords ?? [];
  if (forbiddenWords.length > 0) {
    rules.push({ type: "forbidden", value: forbiddenWords });
  }

  if (room.rhymeTarget) {
    rules.push({ type: "rhyme", value: room.rhymeTarget });
  }

  const cappedTimer = Math.max(0, Math.min(room.maxTurnSeconds ?? 0, MAX_TURN_SECONDS_CAP));
  if (cappedTimer > 0) {
    rules.push({ type: "turnTimer", value: cappedTimer });
  }

  rules.push({ type: "maxWarnings", value: Math.max(1, room.maxWarnings ?? 1) });

  return rules;
}

function mapParticipants(room: RoomWithRelations): RoomParticipant[] {
  return room.memberships.map((membership) => {
    const name = membership.user?.name ?? "Anonymous";
    const avatar = membership.user?.image ?? name.charAt(0) ?? undefined;
    return {
      id: membership.userId,
      name,
      avatar,
      score: 0,
      isHost: membership.role === RoomRole.HOST,
      warnings: membership.warnings,
      isActive: membership.isActive,
    } satisfies RoomParticipant;
  });
}

function mapSummaryToHighlight(summary: SummaryWithTurn): RoomHighlight {
  const excerpt = summary.turn?.content ?? summary.content;
  const title = summary.turn?.prompt ?? `${summary.room.title} recap`;

  return {
    id: summary.id,
    roomId: summary.roomId,
    roomTitle: summary.room.title,
    roomCode: summary.room.code,
    turnId: summary.turn?.id ?? undefined,
    title,
    excerpt,
    createdAt: summary.createdAt.toISOString(),
  };
}

function derivePrompts(room: RoomWithRelations, turns: RoomTurn[]): string[] {
  const prompts = room.prompts ?? [];
  if (prompts.length > 0) {
    return [...prompts];
  }

  const derivedPrompts = Array.from(new Set(turns.map((turn) => turn.prompt).filter(Boolean)));
  if (derivedPrompts.length === 0) {
    derivedPrompts.push("Start the story with your first prompt.");
  }
  return derivedPrompts;
}

function mapRoom(room: RoomWithRelations): RoomSnapshot {
  const participants = mapParticipants(room);
  const turns = room.turns.map(toRoomTurn);
  const participantsWithScores = calculateParticipantScores(participants, turns);
  const highlights = room.summaries.map((summary) =>
    mapSummaryToHighlight({
      ...summary,
      room: { id: room.id, title: room.title, code: room.code },
    } as SummaryWithTurn),
  );
  const currentTurn = mapCurrentTurn(room);
  const cappedTimer = Math.max(0, Math.min(room.maxTurnSeconds ?? 0, MAX_TURN_SECONDS_CAP));
  const maxWarnings = Math.max(1, room.maxWarnings ?? 1);

  return {
    id: room.id,
    code: room.code,
    title: room.title,
    description: room.description ?? undefined,
    createdAt: room.createdAt.toISOString(),
    hostId: room.hostId ?? undefined,
    participants: participantsWithScores,
    turns,
    rules: deriveRules(room),
    prompts: derivePrompts(room, turns),
    highlights,
    maxTurnSeconds: cappedTimer,
    maxWarnings,
    currentTurn,
  };
}

function mapCurrentTurn(room: RoomWithRelations): RoomCurrentTurn | undefined {
  const membership = room.currentTurnMembership;
  if (!membership) {
    return undefined;
  }

  const startedAt = room.currentTurnStartedAt?.toISOString();
  const cappedTimer = Math.max(0, Math.min(room.maxTurnSeconds ?? 0, MAX_TURN_SECONDS_CAP));
  const dueAt =
    cappedTimer > 0 && room.currentTurnStartedAt
      ? new Date(room.currentTurnStartedAt.getTime() + cappedTimer * 1000).toISOString()
      : undefined;

  return {
    membershipId: membership.id,
    userId: membership.userId,
    startedAt: startedAt ?? new Date().toISOString(),
    dueAt,
    warnings: membership.warnings,
  } satisfies RoomCurrentTurn;
}

export async function getRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const room = await prisma.$transaction(async (tx) => {
    const turnState = await loadTurnState(tx, roomId);
    if (!turnState) {
      return null;
    }

    await ensureTurnState(tx, turnState);

    return tx.room.findUnique({
      where: { id: roomId },
      include: ROOM_WITH_RELATIONS_INCLUDE,
    });
  });

  if (!room) {
    return null;
  }

  return mapRoom(room);
}

export async function listRoomSnapshots(): Promise<RoomSnapshot[]> {
  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: "desc" },
    include: ROOM_WITH_RELATIONS_INCLUDE,
  });

  return rooms.map(mapRoom);
}

export async function listHighlights(limit = 12): Promise<RoomHighlight[]> {
  const summaries = await prisma.summary.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      turn: { select: { id: true, prompt: true, content: true } },
      room: { select: { id: true, title: true, code: true } },
    },
  });

  return summaries.map((summary) => mapSummaryToHighlight(summary as SummaryWithTurn));
}

export async function listRoomsForUser(userId: string): Promise<RoomSnapshot[]> {
  const rooms = await prisma.room.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "desc" },
    include: ROOM_WITH_RELATIONS_INCLUDE,
  });

  return rooms.map(mapRoom);
}

export async function buildRoomRecap(roomId: string): Promise<RoomRecap | null> {
  const snapshot = await getRoomSnapshot(roomId);
  if (!snapshot) {
    return null;
  }

  return buildRecapFromSnapshot(snapshot);
}

export async function ensureMembership(roomId: string, userId: string) {
  const existing = await prisma.membership.findFirst({
    where: { roomId, userId },
  });

  if (!existing) {
    throw new Error("User is not a member of this room");
  }
}

export async function joinRoom(roomId: string, userId: string, role?: RoomRole) {
  await prisma.membership.upsert({
    where: {
      userId_roomId: {
        userId,
        roomId,
      },
    },
    update: {
      role: role ?? undefined,
    },
    create: {
      userId,
      roomId,
      role: role ?? undefined,
    },
  });
}
