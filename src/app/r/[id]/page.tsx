import { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoomProvider } from "@/components/room/room-provider";
import { RoomExperience } from "@/components/room/room-experience";
import { auth } from "@/lib/auth";
import { getRoomSnapshot } from "@/lib/server/rooms";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getRoomSnapshot(id);
  if (!snapshot) {
    return {
      title: "Room not found",
    };
  }

  return {
    title: snapshot.title,
    description: snapshot.description,
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;
  const snapshot = await getRoomSnapshot(id);

  if (!snapshot) {
    notFound();
  }

  const session = await auth();
  const viewer = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }
    : null;
  const providerKey = `${snapshot.id}:${snapshot.participants.length}:${snapshot.turns.length}`;

  return (
    <RoomProvider key={providerKey} room={snapshot} viewerId={viewer?.id}>
      <RoomExperience viewer={viewer ?? undefined} />
    </RoomProvider>
  );
}
