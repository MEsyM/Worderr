import { NextRequest } from "next/server";
import { chromium } from "playwright-core";

import { roomRuleLabel } from "@/lib/rooms";
import { buildRoomRecap } from "@/lib/server/rooms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function buildTextRecap(id: string) {
  const recap = await buildRoomRecap(id);
  if (!recap) {
    return null;
  }

  const lines: string[] = [];
  lines.push(`# ${recap.room.title}`);
  lines.push(`Room code: ${recap.room.code}`);
  lines.push("");
  lines.push("Rules:");
  recap.room.rules.forEach((rule) => lines.push(`- ${roomRuleLabel(rule)}`));
  lines.push("");
  if (recap.winningTurn) {
    lines.push(`Highlight: ${recap.winningTurn.content}`);
    lines.push(`Prompt: ${recap.winningTurn.prompt}`);
  } else {
    lines.push("No turns published yet.");
  }
  lines.push("");
  lines.push("Scores:");
  recap.scoreByParticipant.forEach(({ participant, score }) => {
    lines.push(`- ${participant.name}: ${score} pts`);
  });

  return lines.join("\n");
}

async function buildHtmlRecap(id: string) {
  const recap = await buildRoomRecap(id);
  if (!recap) {
    return null;
  }

  const ruleList = recap.room.rules.map((rule) => `<li>${roomRuleLabel(rule)}</li>`).join("");
  const scores = recap.scoreByParticipant
    .map((entry) => `<li><strong>${entry.participant.name}</strong> – ${entry.score} pts</li>`)
    .join("");

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${recap.room.title} recap</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 40px; color: #111827; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          h2 { font-size: 18px; margin-top: 24px; }
          p, li { font-size: 14px; line-height: 1.5; }
          .highlight { border: 1px solid #8b5cf6; background: #ede9fe; padding: 16px; border-radius: 12px; }
          .meta { color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>${recap.room.title}</h1>
        <p class="meta">Room code ${recap.room.code} · ${recap.room.participants.length} players · ${recap.totalVotes} votes</p>
        <h2>Rules</h2>
        <ul>${ruleList}</ul>
        <h2>Highlight</h2>
        ${
          recap.winningTurn
            ? `<div class="highlight"><p>${recap.winningTurn.content}</p><p class="meta">Prompt: ${recap.winningTurn.prompt}</p></div>`
            : "<p>No turns published.</p>"
        }
        <h2>Scores</h2>
        <ul>${scores}</ul>
      </body>
    </html>`;
}

export async function GET(request: NextRequest, context: RouteParams) {
  const params = await context.params;
  const format = request.nextUrl.searchParams.get("format") ?? "pdf";
  const textRecap = await buildTextRecap(params.id);

  if (!textRecap) {
    return new Response("Room not found", { status: 404 });
  }

  if (format === "txt") {
    return new Response(textRecap, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const html = await buildHtmlRecap(params.id);
  if (!html) {
    return new Response("Room not found", { status: 404 });
  }

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
    });

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${params.id}-recap.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to render PDF recap", error);
    return new Response(textRecap, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      status: 200,
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
