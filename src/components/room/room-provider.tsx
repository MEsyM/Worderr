"use client";

import * as React from "react";

import {
  buildRecapFromSnapshot,
  calculateParticipantScores,
  getSoloSuggestion,
  roomRuleLabel,
  type RoomParticipant,
  type RoomRecap,
  type RoomRule,
  type RoomSnapshot,
  type RoomTurn,
} from "@/lib/rooms";

interface TimerState {
  duration: number;
  remaining: number;
  isRunning: boolean;
  startedAt?: string;
}

interface RoomState {
  snapshot: RoomSnapshot;
  participants: RoomParticipant[];
  turns: RoomTurn[];
  currentPlayerIndex: number;
  currentPromptIndex: number;
  timer: TimerState;
  suggestion?: string;
  pendingAdvance: boolean;
}

type RoomAction =
  | { type: "START_TIMER"; duration?: number }
  | { type: "TICK" }
  | { type: "STOP_TIMER" }
  | { type: "ADVANCE_PLAYER"; suggestion?: string }
  | { type: "UPSERT_TURN"; turn: RoomTurn }
  | { type: "RESET_SUGGESTION" };

function createInitialState(snapshot: RoomSnapshot): RoomState {
  const sortedTurns = [...snapshot.turns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const participants = calculateParticipantScores(snapshot.participants, sortedTurns);
  const publishedTurns = sortedTurns.filter((turn) => turn.status === "published");
  const currentPlayerIndex =
    participants.length > 0 ? publishedTurns.length % participants.length : 0;
  const currentPromptIndex =
    snapshot.prompts.length > 0 ? publishedTurns.length % snapshot.prompts.length : 0;

  return {
    snapshot,
    participants,
    turns: sortedTurns,
    currentPlayerIndex,
    currentPromptIndex,
    timer: {
      duration: 30,
      remaining: 30,
      isRunning: false,
    },
    pendingAdvance: false,
  };
}

function reducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "START_TIMER": {
      const duration = action.duration ?? state.timer.duration;
      return {
        ...state,
        timer: {
          duration,
          remaining: duration,
          isRunning: true,
          startedAt: new Date().toISOString(),
        },
        pendingAdvance: false,
      };
    }
    case "TICK": {
      if (!state.timer.isRunning) {
        return state;
      }

      const nextRemaining = state.timer.remaining - 1;
      if (nextRemaining <= 0) {
        return {
          ...state,
          timer: {
            ...state.timer,
            remaining: 0,
            isRunning: false,
          },
          pendingAdvance: true,
        };
      }

      return {
        ...state,
        timer: {
          ...state.timer,
          remaining: nextRemaining,
        },
      };
    }
    case "STOP_TIMER": {
      if (!state.timer.isRunning) {
        return state;
      }
      return {
        ...state,
        timer: {
          ...state.timer,
          isRunning: false,
        },
      };
    }
    case "ADVANCE_PLAYER": {
      if (state.participants.length === 0) {
        return state;
      }
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.participants.length;
      const completedCycle = nextPlayerIndex === 0;
      const promptCount = Math.max(state.snapshot.prompts.length, 1);
      const nextPromptIndex = completedCycle
        ? (state.currentPromptIndex + 1) % promptCount
        : state.currentPromptIndex;

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentPromptIndex: nextPromptIndex,
        pendingAdvance: false,
        suggestion: action.suggestion,
      };
    }
    case "UPSERT_TURN": {
      const turns = [...state.turns.filter((turn) => turn.id !== action.turn.id), action.turn].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt),
      );
      const participants = calculateParticipantScores(state.snapshot.participants, turns);

      return {
        ...state,
        turns,
        participants,
        suggestion: undefined,
      };
    }
    case "RESET_SUGGESTION": {
      return {
        ...state,
        suggestion: undefined,
      };
    }
    default:
      return state;
  }
}

interface RoomContextValue {
  room: RoomSnapshot;
  participants: RoomParticipant[];
  turns: RoomTurn[];
  rules: RoomRule[];
  currentPlayer: RoomParticipant;
  currentPrompt: string;
  timer: TimerState;
  suggestion?: string;
  recap: RoomRecap;
  submitTurn: (input: { content: string; authorId: string }) => Promise<RoomTurn | null>;
  castVote: (turnId: string, voterId: string, value: number) => Promise<void>;
  startTimer: (duration?: number) => void;
  stopTimer: () => void;
  advancePlayer: () => void;
  dismissSuggestion: () => void;
  describeRule: (rule: RoomRule) => string;
}

const RoomContext = React.createContext<RoomContextValue | null>(null);

interface RoomProviderProps {
  room: RoomSnapshot;
  children: React.ReactNode;
}

export function RoomProvider({ room, children }: RoomProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, room, createInitialState);

  React.useEffect(() => {
    dispatch({ type: "START_TIMER", duration: 30 });
  }, []);

  React.useEffect(() => {
    if (!state.timer.isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [state.timer.isRunning]);

  React.useEffect(() => {
    if (!state.pendingAdvance) {
      return;
    }

    const suggestion = state.participants.length <= 1 ? getSoloSuggestion() : undefined;
    dispatch({ type: "ADVANCE_PLAYER", suggestion });
    dispatch({ type: "START_TIMER", duration: 30 });
  }, [state.pendingAdvance, state.participants.length]);

  const value = React.useMemo<RoomContextValue>(() => {
    const currentPlayer = state.participants[state.currentPlayerIndex] ?? state.participants[0];
    const currentPrompt =
      state.snapshot.prompts[state.currentPromptIndex] ?? state.snapshot.prompts[0] ?? "";
    const recap = buildRecapFromSnapshot({
      ...state.snapshot,
      participants: state.participants,
      turns: state.turns,
    });

    return {
      room: state.snapshot,
      participants: state.participants,
      turns: state.turns,
      rules: state.snapshot.rules,
      currentPlayer,
      currentPrompt,
      timer: state.timer,
      suggestion: state.suggestion,
      recap,
      submitTurn: async ({ content, authorId: _authorId }) => {
        void _authorId;
        try {
          const response = await fetch(`/api/rooms/${state.snapshot.id}/turns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, prompt: currentPrompt }),
          });

          if (!response.ok) {
            throw new Error("Failed to submit turn");
          }

          const data = (await response.json()) as { turn: RoomTurn };
          dispatch({ type: "UPSERT_TURN", turn: data.turn });
          dispatch({ type: "STOP_TIMER" });
          const suggestion = state.participants.length <= 1 ? getSoloSuggestion() : undefined;
          dispatch({ type: "ADVANCE_PLAYER", suggestion });
          dispatch({ type: "START_TIMER", duration: 30 });
          return data.turn;
        } catch (error) {
          console.error("submitTurn failed", error);
          return null;
        }
      },
      castVote: async (turnId, _voterId, value) => {
        try {
          const response = await fetch(`/api/rooms/${state.snapshot.id}/turns/${turnId}/vote`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
          });

          if (!response.ok) {
            throw new Error("Failed to cast vote");
          }

          const data = (await response.json()) as { turn: RoomTurn };
          dispatch({ type: "UPSERT_TURN", turn: data.turn });
        } catch (error) {
          console.error("castVote failed", error);
        }
      },
      startTimer: (duration?: number) => dispatch({ type: "START_TIMER", duration }),
      stopTimer: () => dispatch({ type: "STOP_TIMER" }),
      advancePlayer: () => {
        dispatch({ type: "STOP_TIMER" });
        const suggestion = state.participants.length <= 1 ? getSoloSuggestion() : undefined;
        dispatch({ type: "ADVANCE_PLAYER", suggestion });
        dispatch({ type: "START_TIMER", duration: 30 });
      },
      dismissSuggestion: () => dispatch({ type: "RESET_SUGGESTION" }),
      describeRule: (rule: RoomRule) => roomRuleLabel(rule),
    };
  }, [state]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = React.useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
