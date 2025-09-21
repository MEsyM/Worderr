import { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoomProvider } from "@/components/room/room-provider";
import { RoomExperience } from "@/components/room/room-experience";
import { getRoomSnapshot } from "@/lib/rooms";

interface RoomPageProps {
  params: { id: string };
}

export function generateMetadata({ params }: RoomPageProps): Metadata {
  const snapshot = getRoomSnapshot(params.id);
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

export default function RoomPage({ params }: RoomPageProps) {
  const snapshot = getRoomSnapshot(params.id);

  if (!snapshot) {
    notFound();
  }

  return (
    <RoomProvider roomId={snapshot.id}>
      <RoomExperience />
    </RoomProvider>
  );
}
