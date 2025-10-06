import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/realtime/server";
import { DEFAULT_TURN_VALIDATION, validateTurn } from "@/lib/turn-validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const body = await request.json();
    const { action, round, prompt, content, authorId, turnId, validationOptions } = body ?? {};

    if (!action || !["propose", "validate", "publish"].includes(action)) {
      return NextResponse.json({ error: "A valid action is required." }, { status: 400 });
    }

    if (typeof round !== "number" || round < 0) {
      return NextResponse.json({ error: "Round must be a positive number." }, { status: 400 });
    }

    if (action === "propose" && (!prompt || typeof prompt !== "string")) {
      return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
    }

    if ((action === "validate" || action === "publish") && typeof turnId !== "string") {
      return NextResponse.json(
        { error: "An existing turnId is required for this action." },
        { status: 400 },
      );
    }

    const validation = validateTurn(content ?? "", {
      ...DEFAULT_TURN_VALIDATION,
      ...validationOptions,
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: "Turn failed validation.", validation }, { status: 422 });
    }

    if (action === "propose") {
      const turn = await prisma.turn.create({
        data: {
          roomId: params.id,
          round,
          prompt,
          content: validation.sanitized,
          authorId: authorId ?? null,
        },
      });

      emitToRoom(params.id, "turn:proposed", {
        roomId: params.id,
        turnId: turn.id,
        round: turn.round,
        prompt: turn.prompt,
        content: turn.content ?? "",
        authorId: turn.authorId,
      });

      return NextResponse.json({ turn, validation });
    }

    if (action === "validate") {
      const turn = await prisma.turn.update({
        where: { id: turnId },
        data: {
          content: validation.sanitized,
          authorId: authorId ?? undefined,
        },
      });

      emitToRoom(params.id, "turn:validated", {
        roomId: params.id,
        turnId: turn.id,
        round: turn.round,
        prompt: turn.prompt,
        content: turn.content ?? "",
        authorId: turn.authorId,
      });

      return NextResponse.json({ turn, validation });
    }

    const turn = await prisma.turn.update({
      where: { id: turnId },
      data: {
        content: validation.sanitized || undefined,
        endedAt: new Date(),
      },
    });

    const publishedAt = new Date().toISOString();

    emitToRoom(params.id, "turn:published", {
      roomId: params.id,
      turnId: turn.id,
      round: turn.round,
      prompt: turn.prompt,
      content: turn.content ?? "",
      authorId: turn.authorId,
      publishedAt,
    });

    return NextResponse.json({ turn, validation });
  } catch (error) {
    console.error(`Failed to process turn for room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to process turn." }, { status: 500 });
  }
}
