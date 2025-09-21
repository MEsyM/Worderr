import { NextResponse } from "next/server";

import { wordCount } from "@/lib/text";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, submission } = body ?? {};

    if (typeof submission !== "string") {
      return NextResponse.json({ error: "A submission is required." }, { status: 400 });
    }

    const words = wordCount(submission);
    const accepted = words % 2 === 0;
    const verdict = accepted ? "approve" : "revise";
    const reasoning = accepted
      ? "Submission length looks balanced and rhythmic."
      : "Try adjusting the length for a more balanced cadence.";

    return NextResponse.json({ verdict, reasoning, prompt, metrics: { words } });
  } catch (error) {
    console.error("AI judge mock failed", error);
    return NextResponse.json({ error: "Unable to evaluate submission." }, { status: 500 });
  }
}
