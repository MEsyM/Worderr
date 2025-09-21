import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const summaries = await prisma.summary.findMany({
      where: { roomId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        turn: {
          select: {
            id: true,
            round: true,
            prompt: true,
          },
        },
      },
    });

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error(`Failed to fetch recap for room ${params.id}`, error);
    return NextResponse.json({ error: "Unable to fetch recap." }, { status: 500 });
  }
}
