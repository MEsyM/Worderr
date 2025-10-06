import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteParams) {
  const params = await context.params;
  try {
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
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
        },
        turns: {
          orderBy: { round: "asc" },
          include: {
            votes: true,
            summary: true,
          },
        },
        summaries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error(`Failed to load room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to load room." }, { status: 500 });
  }
}
