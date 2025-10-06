// Landing page placeholder introducing the LingvoJam platform.
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    title: "Real-time rooms",
    description:
      "Collaborate live with a shared timer, voting mechanics, and a feed that spotlights every riff the moment it drops.",
  },
  {
    title: "Creative guardrails",
    description:
      "Room hosts define rules with badges—word caps, rhyme targets, and forbidden vocab keep the story sharp.",
  },
  {
    title: "Recap ready",
    description:
      "Export the night’s narrative in PDF or plain text. The RecapView bundles highlights, scores, and prompts for easy sharing.",
  },
];

export default function Home() {
  return (
    <div className="space-y-16 py-12">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-primary/10 via-background to-background px-8 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            Improv meets multiplayer
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Wordplay, rhythm, and real-time collaboration for storytellers
          </h1>
          <p className="mt-5 text-balance text-base text-muted-foreground sm:text-lg">
            LingvoJam blends improv prompts, AI assists, and live voting so your crew can co-write a
            narrative jam in under a minute per turn.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/new">Launch a new game</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/rooms">Rooms</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/highlights">See community highlights</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed">
                {pillar.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
