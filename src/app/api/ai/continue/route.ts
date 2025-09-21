import { NextResponse } from "next/server";

import { rhymeHeuristic, sanitize } from "@/lib/text";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { previousLine } = body ?? {};

    const sanitized = typeof previousLine === "string" ? sanitize(previousLine) : "";
    const suggestion = sanitized
      ? `${sanitized.split(" ").slice(-1)[0] ?? ""} delight ignites the night`
      : "Words await your spark tonight.";

    const rhyme = sanitized ? rhymeHeuristic(sanitized, suggestion) : { score: 0, fragment: null };

    return NextResponse.json({ suggestion, rhyme });
  } catch (error) {
    console.error("AI continue mock failed", error);
    return NextResponse.json({ error: "Unable to generate suggestion." }, { status: 500 });
  }
}
