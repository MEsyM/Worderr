import { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listHighlights } from "@/lib/server/rooms";

export const metadata: Metadata = {
  title: "Highlights",
  description: "Top turns and memorable prompts from across the LingvoJam community.",
};

export default async function HighlightsPage() {
  const highlights = await listHighlights();

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Highlights</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Curated turn excerpts, room codes, and prompts worth remixing for your next session.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2">
        {highlights.map((highlight) => (
          <Card key={highlight.id} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {highlight.title}
                <Badge variant="outline">{highlight.roomCode}</Badge>
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                {highlight.roomTitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="leading-relaxed text-muted-foreground">{highlight.excerpt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
