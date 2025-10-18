import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { analyzeStoryMood, buildMusicPrompt } from "@/lib/music";
import { getRoomSnapshot } from "@/lib/server/rooms";

const DEFAULT_MODEL_URL = "https://api-inference.huggingface.co/models/facebook/musicgen-small";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ id: string }>;
}

function buildError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(_request: Request, context: RouteParams) {
  const params = await context.params;
  const token = process.env.MUSICGEN_API_TOKEN;

  if (!token) {
    return buildError("Music generation is not configured.");
  }

  const room = await getRoomSnapshot(params.id);

  if (!room) {
    return buildError("Room not found.", 404);
  }

  const storyText = room.turns
    .map((turn) => turn.content.trim())
    .filter((content) => content.length > 0)
    .join(" ");

  if (!storyText) {
    return buildError("The room needs published turns before a soundtrack can be created.", 400);
  }

  const analysis = analyzeStoryMood(storyText);
  const { prompt, excerpt } = buildMusicPrompt({
    roomTitle: room.title,
    storyText,
    analysis,
  });

  try {
    const response = await fetch(process.env.MUSICGEN_API_URL ?? DEFAULT_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "audio/*",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          top_k: 250,
          temperature: 1.1,
          max_new_tokens: 512,
        },
      }),
    });

    if (!response.ok) {
      let detail = "Unable to generate music.";

      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          detail = errorBody.error as string;
        } else if (typeof errorBody?.detail === "string") {
          detail = errorBody.detail;
        }
      } catch (error) {
        console.error("Failed to parse music generation error", error);
      }

      const status = response.status === 404 ? 502 : response.status;
      return buildError(detail, status === 200 ? 502 : status);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return buildError("Music service returned an empty response.", 502);
    }

    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") ?? "audio/wav";
    const audio = `data:${contentType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      audio,
      contentType,
      prompt,
      excerpt,
      mood: {
        id: analysis.profile.id,
        label: analysis.profile.label,
        vibe: analysis.profile.vibe,
        tempo: analysis.profile.tempo,
        instrumentation: analysis.profile.instrumentation,
        description: analysis.profile.description,
      },
      stats: {
        positivity: analysis.positivity,
        energy: analysis.energy,
        keywords: analysis.keywords,
      },
    });
  } catch (error) {
    console.error("Music generation request failed", error);
    return buildError("Music service is unavailable right now.", 502);
  }
}
