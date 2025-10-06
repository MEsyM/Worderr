export type RoomRule =
  | { type: "maxWords"; value: number }
  | { type: "maxSentences"; value: number }
  | { type: "forbidden"; value: string[] }
  | { type: "rhyme"; value: string };

export interface RoomParticipant {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  isHost?: boolean;
}

export type TurnStatus = "proposed" | "validated" | "published";

export interface RoomTurn {
  id: string;
  round: number;
  prompt: string;
  content: string;
  authorId: string;
  status: TurnStatus;
  createdAt: string;
  publishedAt?: string;
  votes: Array<{ voterId: string; value: number }>;
}

export interface RoomHighlight {
  id: string;
  title: string;
  excerpt: string;
  roomId: string;
  roomTitle: string;
  roomCode: string;
  turnId?: string;
  createdAt: string;
}

export interface RoomSnapshot {
  id: string;
  code: string;
  title: string;
  description?: string;
  createdAt: string;
  hostId?: string;
  participants: RoomParticipant[];
  turns: RoomTurn[];
  rules: RoomRule[];
  prompts: string[];
  highlights: RoomHighlight[];
}

export type RoomRecap = {
  room: RoomSnapshot;
  totalVotes: number;
  winningTurn?: RoomTurn;
  scoreByParticipant: Array<{ participant: RoomParticipant; score: number }>;
};

export function calculateParticipantScores(
  participants: RoomParticipant[],
  turns: RoomTurn[],
): RoomParticipant[] {
  const scoreMap = new Map<string, number>();
  participants.forEach((participant) => {
    scoreMap.set(participant.id, 0);
  });

  turns.forEach((turn) => {
    if (!turn.authorId) {
      return;
    }

    const existing = scoreMap.get(turn.authorId) ?? 0;
    const voteScore = turn.votes.reduce((acc, vote) => acc + vote.value, 0);
    scoreMap.set(turn.authorId, existing + 2 + voteScore);
  });

  return participants.map((participant) => ({
    ...participant,
    score: Math.max(0, scoreMap.get(participant.id) ?? participant.score ?? 0),
  }));
}

export function buildRecapFromSnapshot(snapshot: RoomSnapshot): RoomRecap {
  let winningTurn: RoomTurn | undefined;
  let winningScore = -Infinity;
  let totalVotes = 0;

  snapshot.turns.forEach((turn) => {
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
    scoreByParticipant: snapshot.participants.map((participant) => ({
      participant,
      score: participant.score,
    })),
  };
}

const soloSuggestionPhrases = [
  "Paint the moment using synesthetic imagery.",
  "Introduce an unexpected character mid-line.",
  "Flip perspective as if narrating from the moon.",
  "Work in a foreign-language idiom and translate it.",
  "Describe silence as a tangible object.",
];

export function getSoloSuggestion(): string {
  const index = Math.floor(Math.random() * soloSuggestionPhrases.length);
  return soloSuggestionPhrases[index];
}

export function roomRuleLabel(rule: RoomRule): string {
  switch (rule.type) {
    case "maxWords":
      return `${rule.value} word max`;
    case "maxSentences":
      return `${rule.value} sentence cap`;
    case "forbidden":
      return `Avoid: ${rule.value.join(", ")}`;
    case "rhyme":
      return `Rhyme with \"${rule.value}\"`;
    default:
      return "Special rule";
  }
}
