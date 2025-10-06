import { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoomProvider } from "@/components/room/room-provider";
import { RoomExperience } from "@/components/room/room-experience";
import { auth } from "@/lib/auth";
import { getRoomSnapshot } from "@/lib/server/rooms";

interface RoomPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const snapshot = await getRoomSnapshot(params.id);
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
  const snapshot = await getRoomSnapshot(params.id);

  if (!snapshot) {
    notFound();
  }

  const session = await auth();
  const viewerId = session?.user?.id ?? snapshot.participants[0]?.id;

  return (
    <RoomProvider room={snapshot}>
      <RoomExperience viewerId={viewerId ?? undefined} />
    </RoomProvider>
  );
}
