import type { Server as HTTPServer } from "http";
import { Server, type Namespace, type Socket } from "socket.io";

import type {
  ClientToServerEvents,
  InterServerEvents,
  RoomParticipantPayload,
  ServerToClientEvents,
  SocketData,
} from "@/lib/realtime/events";

type RoomTimerState = {
  interval?: NodeJS.Timeout;
  remaining: number;
  duration: number;
};

type PendingRealtimeAction =
  | {
      type: "emit";
      roomId: string;
      event: keyof ServerToClientEvents;
      payload: Parameters<ServerToClientEvents[keyof ServerToClientEvents]>[0];
    }
  | { type: "timer:start"; roomId: string; duration: number }
  | { type: "timer:stop"; roomId: string };

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null =
  null;
const timers = new Map<string, RoomTimerState>();
const pendingActions: PendingRealtimeAction[] = [];

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

function flushPendingActions(): void {
  if (!io || pendingActions.length === 0) {
    return;
  }

  while (pendingActions.length > 0) {
    const action = pendingActions.shift();
    if (!action) {
      continue;
    }

    switch (action.type) {
      case "emit":
        io.of(buildNamespaceName(action.roomId)).emit(action.event, action.payload);
        break;
      case "timer:start": {
        const namespace = io.of(buildNamespaceName(action.roomId));
        startTimer(namespace, action.roomId, action.duration);
        break;
      }
      case "timer:stop": {
        const namespace = io.of(buildNamespaceName(action.roomId));
        clearRoomTimer(namespace, action.roomId);
        break;
      }
      default:
        break;
    }
  }
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
  const auth = socket.handshake.auth ?? {};
  const userId = typeof auth.userId === "string" ? auth.userId : undefined;
  const displayName = typeof auth.displayName === "string" ? auth.displayName : undefined;

  if (userId) {
    socket.data.userId = userId;
  }

  if (displayName) {
    socket.data.displayName = displayName;
  }
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

  flushPendingActions();

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
    pendingActions.push({ type: "emit", roomId, event, payload });
    return false;
  }

  io.of(buildNamespaceName(roomId)).emit(event, payload);
  return true;
}

export function startRoomTimer(roomId: string, duration: number): boolean {
  if (!io) {
    pendingActions.push({ type: "timer:start", roomId, duration });
    return false;
  }

  const namespace = io.of(buildNamespaceName(roomId));
  startTimer(namespace, roomId, duration);
  return true;
}

export function stopRoomTimer(roomId: string): boolean {
  if (!io) {
    pendingActions.push({ type: "timer:stop", roomId });
    return false;
  }

  const namespace = io.of(buildNamespaceName(roomId));
  clearRoomTimer(namespace, roomId);
  return true;
}
