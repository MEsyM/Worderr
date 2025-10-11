import type { RoomCurrentTurn, RoomTurn } from "@/lib/rooms";

export interface RoomParticipantPayload {
  roomId: string;
  participants: number;
  userId?: string;
  displayName?: string;
}

export interface RoomStartedPayload {
  roomId: string;
  startedAt: string;
  hostId?: string | null;
}

export interface TurnEventPayload {
  roomId: string;
  turnId: string;
  round: number;
  prompt: string;
  content: string;
  authorId?: string | null;
}

export interface TurnPublishedPayload extends TurnEventPayload {
  publishedAt: string;
}

export interface TurnVotedPayload {
  roomId: string;
  turnId: string;
  voterId: string;
  value: number;
}

export interface TimerControlPayload {
  roomId: string;
  duration: number;
}

export interface TimerTickPayload {
  roomId: string;
  duration: number;
  remaining: number;
  isComplete: boolean;
}

export interface MembershipStatusUpdatePayload {
  membershipId: string;
  userId: string;
  warnings: number;
  isActive: boolean;
}

export interface TurnAdvancedPayload {
  roomId: string;
  turn?: RoomTurn;
  currentTurn?: RoomCurrentTurn;
  memberships: MembershipStatusUpdatePayload[];
}

export interface ServerToClientEvents {
  "room:joined": (payload: RoomParticipantPayload) => void;
  "room:started": (payload: RoomStartedPayload) => void;
  "turn:proposed": (payload: TurnEventPayload) => void;
  "turn:validated": (payload: TurnEventPayload) => void;
  "turn:published": (payload: TurnPublishedPayload) => void;
  "turn:voted": (payload: TurnVotedPayload) => void;
  "turn:advanced": (payload: TurnAdvancedPayload) => void;
  "timer:tick": (payload: TimerTickPayload) => void;
}

export interface ClientToServerEvents {
  "room:start": (payload: RoomStartedPayload) => void;
  "turn:propose": (payload: TurnEventPayload) => void;
  "turn:validate": (payload: TurnEventPayload) => void;
  "turn:publish": (payload: TurnPublishedPayload) => void;
  "turn:vote": (payload: TurnVotedPayload) => void;
  "timer:start": (payload: TimerControlPayload) => void;
  "timer:stop": () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  displayName?: string;
}
