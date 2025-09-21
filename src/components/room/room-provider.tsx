"use client";

import * as React from "react";
import { nanoid } from "nanoid";

import {
  getRoomSnapshot,
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
  | { type: "SUBMIT_TURN"; turn: RoomTurn }
  | { type: "CAST_VOTE"; turnId: string; voterId: string; value: number }
  | { type: "RESET_SUGGESTION" };

function buildRecapFromState(
  snapshot: RoomSnapshot,
  participants: RoomParticipant[],
  turns: RoomTurn[],
): RoomRecap {
  let winningTurn: RoomTurn | undefined;
  let winningScore = -Infinity;
  let totalVotes = 0;

  turns.forEach((turn) => {
    const turnScore = turn.votes.reduce((acc, vote) => acc + vote.value, 0);
    totalVotes += turn.votes.length;
    if (turnScore > winningScore) {
      winningScore = turnScore;
      winningTurn = turn;
    }
  });

  return {
    room: snapshot,
    totalVotes,
    winningTurn,
    scoreByParticipant: participants.map((participant) => ({
      participant,
      score: participant.score,
    })),
  };
}

function createInitialState(snapshot: RoomSnapshot): RoomState {
  const publishedTurns = snapshot.turns.filter((turn) => turn.status === "published");
  const currentPlayerIndex = publishedTurns.length % snapshot.participants.length;
  const currentPromptIndex = publishedTurns.length % snapshot.prompts.length;

  return {
    snapshot,
    participants: snapshot.participants.map((participant) => ({ ...participant })),
    turns: [...snapshot.turns].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
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

function updateParticipantScore(
  participants: RoomParticipant[],
  participantId: string,
  delta: number,
) {
  return participants.map((participant) =>
    participant.id === participantId
      ? { ...participant, score: Math.max(0, participant.score + delta) }
      : participant,
  );
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
      const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.participants.length;
      const completedCycle = nextPlayerIndex === 0;
      const nextPromptIndex = completedCycle
        ? (state.currentPromptIndex + 1) % state.snapshot.prompts.length
        : state.currentPromptIndex;

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentPromptIndex: nextPromptIndex,
        pendingAdvance: false,
        suggestion: action.suggestion,
      };
    }
    case "SUBMIT_TURN": {
      const existing = state.turns.filter((turn) => turn.id !== action.turn.id);
      const updatedTurns = [...existing, action.turn];
      const sortedTurns = updatedTurns.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      return {
        ...state,
        turns: sortedTurns,
        participants: updateParticipantScore(state.participants, action.turn.authorId, 2),
        suggestion: undefined,
      };
    }
    case "CAST_VOTE": {
      let voteDelta = 0;
      const turns = state.turns.map((turn) => {
        if (turn.id !== action.turnId) {
          return turn;
        }

        const previousVote = turn.votes.find((vote) => vote.voterId === action.voterId)?.value ?? 0;
        voteDelta = action.value - previousVote;

        const filteredVotes = turn.votes.filter((vote) => vote.voterId !== action.voterId);
        const updatedVotes =
          action.value === 0
            ? filteredVotes
            : [...filteredVotes, { voterId: action.voterId, value: action.value }];

        return {
          ...turn,
          votes: updatedVotes,
        };
      });

      const targetTurn = turns.find((turn) => turn.id === action.turnId);
      const participants =
        targetTurn && voteDelta !== 0
          ? updateParticipantScore(state.participants, targetTurn.authorId, voteDelta)
          : state.participants;

      return {
        ...state,
        turns,
        participants,
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
  submitTurn: (input: { content: string; authorId: string }) => RoomTurn | null;
  castVote: (turnId: string, voterId: string, value: number) => void;
  startTimer: (duration?: number) => void;
  stopTimer: () => void;
  advancePlayer: () => void;
  dismissSuggestion: () => void;
  describeRule: (rule: RoomRule) => string;
}

const RoomContext = React.createContext<RoomContextValue | null>(null);

export function RoomProvider({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const snapshot = React.useMemo(() => getRoomSnapshot(roomId), [roomId]);

  if (!snapshot) {
    throw new Error(`Room ${roomId} not found`);
  }

  const [state, dispatch] = React.useReducer(reducer, snapshot, createInitialState);

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
    const currentPlayer = state.participants[state.currentPlayerIndex];
    const currentPrompt =
      state.snapshot.prompts[state.currentPromptIndex] ?? state.snapshot.prompts[0];
    const recap = buildRecapFromState(state.snapshot, state.participants, state.turns);

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
      submitTurn: ({ content, authorId }) => {
        const now = new Date().toISOString();
        const turn: RoomTurn = {
          id: nanoid(),
          authorId,
          content,
          round: state.turns.length + 1,
          prompt: currentPrompt,
          status: "published",
          createdAt: now,
          publishedAt: now,
          votes: [],
        };

        dispatch({ type: "SUBMIT_TURN", turn });
        dispatch({ type: "STOP_TIMER" });
        const suggestion = state.participants.length <= 1 ? getSoloSuggestion() : undefined;
        dispatch({ type: "ADVANCE_PLAYER", suggestion });
        dispatch({ type: "START_TIMER", duration: 30 });
        return turn;
      },
      castVote: (turnId, voterId, value) => {
        dispatch({ type: "CAST_VOTE", turnId, voterId, value });
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
