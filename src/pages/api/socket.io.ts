import type { NextApiRequest } from "next";
import type { NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";

import { initializeRealtimeServer } from "@/lib/realtime/server";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@/lib/realtime/events";
import type { Server as IOServer } from "socket.io";

type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(_req: NextApiRequest, res: NextApiResponseServerIO): void {
  if (!res.socket.server.io) {
    const httpServer = res.socket.server;
    res.socket.server.io = initializeRealtimeServer(httpServer);
  }

  res.end();
}
