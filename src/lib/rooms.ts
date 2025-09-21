import { nanoid } from "nanoid";

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
  turnId: string;
  createdAt: string;
}

export interface RoomSnapshot {
  id: string;
  code: string;
  title: string;
  description?: string;
  createdAt: string;
  hostId: string;
  participants: RoomParticipant[];
  turns: RoomTurn[];
  rules: RoomRule[];
  prompts: string[];
  highlights: RoomHighlight[];
}

const demoRooms: Record<string, RoomSnapshot> = {
  improv: {
    id: "improv",
    code: "IMPROV",
    title: "LingvoJam Friday Night",
    description: "Fast-paced rhyme-and-response round robin.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    hostId: "host-1",
    participants: [
      { id: "host-1", name: "Avery", avatar: "A", score: 42, isHost: true },
      { id: "guest-1", name: "Blake", avatar: "B", score: 36 },
      { id: "guest-2", name: "Charlie", avatar: "C", score: 28 },
    ],
    prompts: [
      'Wordplay warmup: riff on "midnight sparks"',
      'Respond with a line that rhymes with "velvet"',
      "Invent a rule for round three",
    ],
    rules: [
      { type: "maxWords", value: 40 },
      { type: "maxSentences", value: 2 },
      { type: "forbidden", value: ["boring", "skip"] },
      { type: "rhyme", value: "velvet" },
    ],
    turns: [
      {
        id: "turn-1",
        round: 1,
        prompt: 'Wordplay warmup: riff on "midnight sparks"',
        content: "Midnight sparks sketch stories in the smog",
        authorId: "host-1",
        status: "published",
        createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        publishedAt: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
        votes: [
          { voterId: "guest-1", value: 1 },
          { voterId: "guest-2", value: 1 },
        ],
      },
      {
        id: "turn-2",
        round: 1,
        prompt: 'Wordplay warmup: riff on "midnight sparks"',
        content: "Thunderclap cadences chasing down the fog",
        authorId: "guest-1",
        status: "published",
        createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        publishedAt: new Date(Date.now() - 1000 * 60 * 49).toISOString(),
        votes: [
          { voterId: "host-1", value: 1 },
          { voterId: "guest-2", value: 1 },
        ],
      },
      {
        id: "turn-3",
        round: 2,
        prompt: 'Respond with a line that rhymes with "velvet"',
        content: "Silver-threaded syllables melt velvet",
        authorId: "guest-2",
        status: "published",
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        publishedAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
        votes: [
          { voterId: "host-1", value: 1 },
          { voterId: "guest-1", value: 1 },
        ],
      },
      {
        id: "turn-4",
        round: 3,
        prompt: "Invent a rule for round three",
        content: "New decree: verbs must pirouette in present tense",
        authorId: "host-1",
        status: "validated",
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        votes: [],
      },
    ],
    highlights: [
      {
        id: "highlight-1",
        roomId: "improv",
        turnId: "turn-2",
        title: "Thunderclap Cadence",
        excerpt: "Thunderclap cadences chasing down the fog",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
  },
  solo: {
    id: "solo",
    code: "SOLO01",
    title: "Solo Flow Studio",
    description: "Practice pad for single-player experimentation.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    hostId: "solo-1",
    participants: [{ id: "solo-1", name: "River", avatar: "R", score: 18, isHost: true }],
    prompts: [
      "Write a metaphor about sunrise",
      "Flip it into a question",
      "Answer using only two sentences",
    ],
    rules: [
      { type: "maxWords", value: 60 },
      { type: "maxSentences", value: 2 },
    ],
    turns: [
      {
        id: "solo-turn-1",
        round: 1,
        prompt: "Write a metaphor about sunrise",
        content: "Sunrise is a vinyl record restarting a worn chorus",
        authorId: "solo-1",
        status: "published",
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        publishedAt: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
        votes: [],
      },
    ],
    highlights: [
      {
        id: "highlight-2",
        roomId: "solo",
        turnId: "solo-turn-1",
        title: "Sunrise Spinning",
        excerpt: "Sunrise is a vinyl record restarting a worn chorus",
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
    ],
  },
};

export function getRoomSnapshot(roomId: string): RoomSnapshot | null {
  return demoRooms[roomId] ?? null;
}

export function listHighlights(): RoomHighlight[] {
  return Object.values(demoRooms).flatMap((room) => room.highlights);
}

export function upsertDemoTurn(
  roomId: string,
  turn: Partial<RoomTurn> & { authorId: string; prompt: string },
): RoomTurn {
  const room = demoRooms[roomId];
  if (!room) {
    throw new Error(`Unknown room ${roomId}`);
  }

  const newTurn: RoomTurn = {
    id: turn.id ?? nanoid(),
    round: turn.round ?? room.turns.length + 1,
    content: turn.content ?? "",
    status: turn.status ?? "proposed",
    createdAt: new Date().toISOString(),
    votes: turn.votes ?? [],
    publishedAt: turn.publishedAt,
    prompt: turn.prompt,
    authorId: turn.authorId,
  };

  room.turns = [...room.turns.filter((existing) => existing.id !== newTurn.id), newTurn];
  return newTurn;
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

export type RoomRecap = {
  room: RoomSnapshot;
  totalVotes: number;
  winningTurn?: RoomTurn;
  scoreByParticipant: Array<{ participant: RoomParticipant; score: number }>;
};

export function buildRoomRecap(roomId: string): RoomRecap | null {
  const room = getRoomSnapshot(roomId);
  if (!room) {
    return null;
  }

  const scoreMap = new Map<string, number>();
  room.participants.forEach((participant) => {
    scoreMap.set(participant.id, participant.score);
  });

  let winningTurn: RoomTurn | undefined;
  let winningScore = -Infinity;
  let totalVotes = 0;

  room.turns.forEach((turn) => {
    const turnScore = turn.votes.reduce((acc, vote) => acc + vote.value, 0);
    totalVotes += turn.votes.length;

    if (turnScore > winningScore) {
      winningScore = turnScore;
      winningTurn = turn;
    }
  });

  const scoreByParticipant = room.participants.map((participant) => ({
    participant,
    score: scoreMap.get(participant.id) ?? 0,
  }));

  return {
    room,
    totalVotes,
    winningTurn,
    scoreByParticipant,
  };
}
