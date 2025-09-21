// Landing page placeholder introducing the LingvoJam platform.
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-12 px-6 py-12">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Welcome to</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          LingvoJam Foundation
        </h1>
        <p className="mt-4 text-balance text-base text-muted-foreground sm:text-lg">
          Collaborative wordplay, rhythmic riffs, and improv storytelling—all built on a modern
          Next.js stack ready for real-time magic.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/new">Create a room</Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/highlights">Browse highlights</Link>
        </Button>
      </div>
    </div>
  );
}
