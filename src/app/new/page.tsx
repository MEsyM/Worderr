import { Metadata } from "next";

import { RoomForm } from "@/components/room/room-form";

export const metadata: Metadata = {
  title: "Create a room",
  description: "Shape a new LingvoJam session with custom rules and timers.",
};

export default function NewRoomPage() {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Spin up a new jam</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Define prompts, tailor the guardrails, and invite your crew in seconds.
        </p>
      </div>
      <RoomForm />
    </div>
  );
}
