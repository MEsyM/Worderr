"use client";

import * as React from "react";
import { io } from "socket.io-client";

import {
  buildRecapFromSnapshot,
  calculateParticipantScores,
  getSoloSuggestion,
  roomRuleLabel,
  type RoomCurrentTurn,
  type RoomParticipant,
  type RoomRecap,
  type RoomRule,
  type RoomSnapshot,
  type RoomTurn,
} from "@/lib/rooms";
import type { TurnAdvancedPayload } from "@/lib/realtime/events";

interface TimerState {
  duration: number;
  remaining: number;
  isRunning: boolean;
  startedAt?: string;
  dueAt?: string;
}

interface MembershipStatusUpdate {
  membershipId: string;
  userId: string;
  warnings: number;
  isActive: boolean;
}

interface SubmitTurnResponse {
  turn: RoomTurn;
  currentTurn?: RoomCurrentTurn;
  memberships: MembershipStatusUpdate[];
  timeoutEvents?: unknown;
}

interface SkipTurnResponse {
  currentTurn?: RoomCurrentTurn;
  memberships: MembershipStatusUpdate[];
  timeoutEvents?: unknown;
}

interface RoomContextValue {
  room: RoomSnapshot;
  viewerId?: string;
  participants: RoomParticipant[];
  turns: RoomTurn[];
  rules: RoomRule[];
  currentPlayer: RoomParticipant;
  currentTurn?: RoomCurrentTurn;
  currentPrompt: string;
  timer: TimerState;
  suggestion?: string;
  recap: RoomRecap;
  canSubmit: boolean;
  submitTurn: (input: { content: string }) => Promise<RoomTurn>;
  skipTurn: () => Promise<void>;
  castVote: (turnId: string, voterId: string, value: number) => Promise<void>;
  dismissSuggestion: () => void;
  describeRule: (rule: RoomRule) => string;
}

const RoomContext = React.createContext<RoomContextValue | null>(null);

interface RoomProviderProps {
  room: RoomSnapshot;
  viewerId?: string;
  children: React.ReactNode;
}

export function RoomProvider({ room, viewerId, children }: RoomProviderProps) {
  const [turns, setTurns] = React.useState(() =>
    [...room.turns].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  );
  const [participantMeta, setParticipantMeta] = React.useState(() => [...room.participants]);
  const [currentTurn, setCurrentTurn] = React.useState<RoomCurrentTurn | undefined>(
    room.currentTurn,
  );
  const [suggestion, setSuggestion] = React.useState<string | undefined>(() =>
    room.participants.length <= 1 ? getSoloSuggestion() : undefined,
  );

  const participants = React.useMemo(
    () => calculateParticipantScores(participantMeta, turns),
    [participantMeta, turns],
  );

  const timerSnapshot = React.useMemo(
    () => computeTimer(currentTurn, room.maxTurnSeconds),
    [currentTurn, room.maxTurnSeconds],
  );
  const [timer, setTimer] = React.useState<TimerState>(timerSnapshot);

  React.useEffect(() => {
    setTimer(timerSnapshot);
  }, [timerSnapshot]);

  const viewerDetails = React.useMemo(() => {
    if (!viewerId) {
      return undefined;
    }

    const match = room.participants.find((participant) => participant.id === viewerId);
    return {
      userId: viewerId,
      displayName: match?.name,
    };
  }, [room.participants, viewerId]);

  React.useEffect(() => {
    const socket = io(`/rooms/${room.id}`, {
      path: "/api/socket.io",
      auth: viewerDetails,
    });

    const handleTurnAdvanced = (payload: TurnAdvancedPayload) => {
      const { turn, memberships, currentTurn: nextTurn } = payload;

      if (turn) {
        setTurns((existing) =>
          [...existing.filter((entry) => entry.id !== turn.id), turn].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
      }

      if (memberships.length > 0) {
        setParticipantMeta((existing) => mergeMembershipUpdates(existing, memberships));
      }

      setCurrentTurn(nextTurn);
    };

    socket.on("turn:advanced", handleTurnAdvanced);

    return () => {
      socket.off("turn:advanced", handleTurnAdvanced);
      socket.disconnect();
    };
  }, [room.id, viewerDetails]);

  React.useEffect(() => {
    if (!timer.dueAt || !timer.isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimer((previous) => {
        if (!previous.dueAt) {
          return previous;
        }
        const nextRemaining = Math.max(
          0,
          Math.round((new Date(previous.dueAt).getTime() - Date.now()) / 1000),
        );
        return {
          ...previous,
          remaining: nextRemaining,
          isRunning: nextRemaining > 0,
        };
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timer.dueAt, timer.isRunning]);

  const currentPrompt = React.useMemo(() => {
    const publishedTurns = turns.filter((turn) => turn.status === "published");
    if (room.prompts.length === 0) {
      return "";
    }
    const index = publishedTurns.length % room.prompts.length;
    return room.prompts[index] ?? room.prompts[0] ?? "";
  }, [room.prompts, turns]);

  const currentPlayer = React.useMemo<RoomParticipant>(() => {
    if (currentTurn) {
      const match = participants.find((participant) => participant.id === currentTurn.userId);
      if (match) {
        return match;
      }
    }

    return (
      participants.find((participant) => participant.isActive) ??
      participants[0] ?? {
        id: "unknown",
        name: "No players",
        score: 0,
        warnings: 0,
        isActive: false,
      }
    );
  }, [currentTurn, participants]);

  const recap = React.useMemo(
    () =>
      buildRecapFromSnapshot({
        ...room,
        participants,
        turns,
      }),
    [participants, room, turns],
  );

  const canSubmit = React.useMemo(() => {
    if (!viewerId || !currentTurn) {
      return false;
    }
    const participant = participants.find((entry) => entry.id === viewerId);
    return Boolean(participant?.isActive && currentTurn.userId === viewerId);
  }, [currentTurn, participants, viewerId]);

  const submitTurn = React.useCallback<RoomContextValue["submitTurn"]>(
    async ({ content }) => {
      const response = await fetch(`/api/rooms/${room.id}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, prompt: currentPrompt }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to submit turn.");
      }

      const data = (await response.json()) as SubmitTurnResponse;
      setTurns((existing) =>
        [...existing.filter((turn) => turn.id !== data.turn.id), data.turn].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
      if (data.memberships) {
        setParticipantMeta((existing) => mergeMembershipUpdates(existing, data.memberships));
      }
      setCurrentTurn(data.currentTurn);
      if (participants.length <= 1) {
        setSuggestion(getSoloSuggestion());
      } else {
        setSuggestion(undefined);
      }
      return data.turn;
    },
    [currentPrompt, participants.length, room.id],
  );

  const skipTurn = React.useCallback(async () => {
    const response = await fetch(`/api/rooms/${room.id}/turns/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Unable to skip turn.");
    }

    const data = (await response.json()) as SkipTurnResponse;
    if (data.memberships) {
      setParticipantMeta((existing) => mergeMembershipUpdates(existing, data.memberships));
    }
    setCurrentTurn(data.currentTurn);
    if (participants.length <= 1) {
      setSuggestion(getSoloSuggestion());
    } else {
      setSuggestion(undefined);
    }
  }, [participants.length, room.id]);

  const castVote = React.useCallback<RoomContextValue["castVote"]>(
    async (turnId, _voterId, value) => {
      try {
        const response = await fetch(`/api/rooms/${room.id}/turns/${turnId}/vote`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { turn: RoomTurn };
        setTurns((existing) =>
          [...existing.filter((turn) => turn.id !== data.turn.id), data.turn].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
      } catch (error) {
        console.error("castVote failed", error);
      }
    },
    [room.id],
  );

  const value = React.useMemo<RoomContextValue>(
    () => ({
      room,
      viewerId,
      participants,
      turns,
      rules: room.rules,
      currentPlayer,
      currentTurn,
      currentPrompt,
      timer,
      suggestion,
      recap,
      canSubmit,
      submitTurn,
      skipTurn,
      castVote,
      dismissSuggestion: () => setSuggestion(undefined),
      describeRule: (rule: RoomRule) => roomRuleLabel(rule),
    }),
    [
      canSubmit,
      castVote,
      currentPlayer,
      currentPrompt,
      currentTurn,
      participants,
      recap,
      room,
      skipTurn,
      submitTurn,
      suggestion,
      timer,
      turns,
      viewerId,
    ],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = React.useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}

function computeTimer(
  currentTurn: RoomCurrentTurn | undefined,
  maxTurnSeconds: number,
): TimerState {
  const duration = Math.max(0, maxTurnSeconds);
  if (!currentTurn || duration === 0 || !currentTurn.dueAt) {
    return {
      duration,
      remaining: duration,
      isRunning: false,
      startedAt: currentTurn?.startedAt,
      dueAt: currentTurn?.dueAt,
    };
  }

  const remaining = Math.max(
    0,
    Math.round((new Date(currentTurn.dueAt).getTime() - Date.now()) / 1000),
  );

  return {
    duration,
    remaining,
    isRunning: remaining > 0,
    startedAt: currentTurn.startedAt,
    dueAt: currentTurn.dueAt,
  };
}

function mergeMembershipUpdates(
  participants: RoomParticipant[],
  updates: MembershipStatusUpdate[],
): RoomParticipant[] {
  if (updates.length === 0) {
    return participants;
  }

  const updateMap = new Map(updates.map((update) => [update.userId, update]));

  const merged = participants.map((participant) => {
    const update = updateMap.get(participant.id);
    if (!update) {
      return participant;
    }
    return {
      ...participant,
      warnings: update.warnings,
      isActive: update.isActive,
    };
  });

  updateMap.forEach((update, userId) => {
    const exists = merged.some((participant) => participant.id === userId);
    if (!exists) {
      merged.push({
        id: userId,
        name: "Player",
        score: 0,
        warnings: update.warnings,
        isActive: update.isActive,
      });
    }
  });

  return merged;
}
