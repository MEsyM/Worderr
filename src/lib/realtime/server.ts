import type { Server as HTTPServer } from "http";
import { Server, type Namespace, type Socket } from "socket.io";

export interface ServerToClientEvents {
  "room:joined": (payload: RoomParticipantPayload) => void;
  "room:started": (payload: RoomStartedPayload) => void;
  "turn:proposed": (payload: TurnEventPayload) => void;
  "turn:validated": (payload: TurnEventPayload) => void;
  "turn:published": (payload: TurnPublishedPayload) => void;
  "turn:voted": (payload: TurnVotedPayload) => void;
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

type RoomTimerState = {
  interval?: NodeJS.Timeout;
  remaining: number;
  duration: number;
};

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null =
  null;
const timers = new Map<string, RoomTimerState>();

function buildNamespaceName(roomId: string): string {
  return `/rooms/${roomId}`;
}

function getTimerState(roomId: string): RoomTimerState {
  const existing = timers.get(roomId);
  if (existing) {
    return existing;
  }

  const state: RoomTimerState = {
    remaining: 0,
    duration: 0,
  };

  timers.set(roomId, state);
  return state;
}

function clearRoomTimer(
  namespace: Namespace<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomId: string,
): void {
  const state = timers.get(roomId);
  if (!state?.interval) {
    return;
  }

  clearInterval(state.interval);
  state.interval = undefined;
}

function startTimer(
  namespace: Namespace<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomId: string,
  duration: number,
): void {
  const state = getTimerState(roomId);
  clearRoomTimer(namespace, roomId);

  state.duration = duration;
  state.remaining = duration;

  namespace.emit("timer:tick", {
    roomId,
    duration,
    remaining: state.remaining,
    isComplete: duration === 0,
  });

  if (duration === 0) {
    return;
  }

  state.interval = setInterval(() => {
    state.remaining -= 1;

    if (state.remaining <= 0) {
      namespace.emit("timer:tick", {
        roomId,
        duration: state.duration,
        remaining: 0,
        isComplete: true,
      });
      clearRoomTimer(namespace, roomId);
      return;
    }

    namespace.emit("timer:tick", {
      roomId,
      duration: state.duration,
      remaining: state.remaining,
      isComplete: false,
    });
  }, 1000);
}

function onConnection(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
): void {
  const namespace = socket.nsp as Namespace<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;
  const roomId = namespace.name.split("/").pop() ?? "";

  const participantPayload: RoomParticipantPayload = {
    roomId,
    participants: namespace.sockets.size,
    userId: socket.data.userId,
    displayName: socket.data.displayName,
  };

  namespace.emit("room:joined", participantPayload);

  socket.on("room:start", (payload) => {
    namespace.emit("room:started", payload);
  });

  socket.on("turn:propose", (payload) => {
    namespace.emit("turn:proposed", payload);
  });

  socket.on("turn:validate", (payload) => {
    namespace.emit("turn:validated", payload);
  });

  socket.on("turn:publish", (payload) => {
    namespace.emit("turn:published", payload);
  });

  socket.on("turn:vote", (payload) => {
    namespace.emit("turn:voted", payload);
  });

  socket.on("timer:start", ({ duration }) => {
    startTimer(namespace, roomId, duration);
  });

  socket.on("timer:stop", () => {
    clearRoomTimer(namespace, roomId);
  });

  socket.on("disconnect", () => {
    const updatedPayload: RoomParticipantPayload = {
      roomId,
      participants: namespace.sockets.size,
      userId: socket.data.userId,
      displayName: socket.data.displayName,
    };
    namespace.emit("room:joined", updatedPayload);

    if (namespace.sockets.size === 0) {
      clearRoomTimer(namespace, roomId);
      timers.delete(roomId);
    }
  });
}

export function initializeRealtimeServer(
  httpServer: HTTPServer,
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  if (io) {
    return io;
  }

  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      path: "/api/socket.io",
      cors: { origin: "*" },
    },
  );

  io.of(/^\/rooms\/.+$/).on("connection", (socket) => {
    onConnection(
      socket as Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    );
  });

  return io;
}

export function getRealtimeServer(): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null {
  return io;
}

export function emitToRoom<T extends keyof ServerToClientEvents>(
  roomId: string,
  event: T,
  payload: Parameters<ServerToClientEvents[T]>[0],
): boolean {
  if (!io) {
    return false;
  }

  io.of(buildNamespaceName(roomId)).emit(event, payload);
  return true;
}

export function startRoomTimer(roomId: string, duration: number): boolean {
  if (!io) {
    return false;
  }

  const namespace = io.of(buildNamespaceName(roomId));
  startTimer(namespace, roomId, duration);
  return true;
}

export function stopRoomTimer(roomId: string): boolean {
  if (!io) {
    return false;
  }

  const namespace = io.of(buildNamespaceName(roomId));
  clearRoomTimer(namespace, roomId);
  return true;
}
