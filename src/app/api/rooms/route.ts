import { NextResponse } from "next/server";
import { RoomRole } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}

async function createRoomCode(): Promise<string> {
  // Ensure the room code is unique by retrying until one is available.
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const candidate = generateRoomCode();
    const existing = await prisma.room.findFirst({ where: { code: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique room code");
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a room." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      prompts: rawPrompts,
      maxWords,
      maxSentences,
      forbiddenWords: rawForbiddenWords,
      rhymeTarget,
    } = body ?? {};

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "A room title is required." }, { status: 400 });
    }

    const prompts = Array.isArray(rawPrompts)
      ? rawPrompts
          .map((prompt) => (typeof prompt === "string" ? prompt.trim() : ""))
          .filter((prompt) => prompt.length > 0)
      : [];

    const forbiddenWords = Array.isArray(rawForbiddenWords)
      ? rawForbiddenWords
          .map((word) => (typeof word === "string" ? word.trim() : ""))
          .filter((word) => word.length > 0)
      : [];

    const parsedMaxWords = Number.isInteger(maxWords) ? Number(maxWords) : 40;
    const parsedMaxSentences = Number.isInteger(maxSentences) ? Number(maxSentences) : 2;
    const normalizedRhymeTarget =
      typeof rhymeTarget === "string" && rhymeTarget.trim().length > 0 ? rhymeTarget.trim() : null;

    const code = await createRoomCode();

    const room = await prisma.room.create({
      data: {
        title,
        description: description ?? null,
        hostId: session.user.id,
        code,
        prompts,
        maxWords: Math.max(10, Math.min(parsedMaxWords, 200)),
        maxSentences: Math.max(1, Math.min(parsedMaxSentences, 8)),
        forbiddenWords,
        rhymeTarget: normalizedRhymeTarget,
        memberships: {
          create: {
            userId: session.user.id,
            role: RoomRole.HOST,
          },
        },
      },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room", error);
    return NextResponse.json({ error: "Unable to create room." }, { status: 500 });
  }
}
