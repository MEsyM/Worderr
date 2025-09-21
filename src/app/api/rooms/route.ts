import { NextResponse } from "next/server";

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
    const body = await request.json();
    const { title, description, hostId } = body ?? {};

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "A room title is required." }, { status: 400 });
    }

    const code = await createRoomCode();

    const room = await prisma.room.create({
      data: {
        title,
        description: description ?? null,
        hostId: hostId ?? null,
        code,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room", error);
    return NextResponse.json({ error: "Unable to create room." }, { status: 500 });
  }
}
