import { sanitize } from "@/lib/text";

const POSITIVE_WORDS = [
  "joy",
  "happy",
  "bright",
  "glow",
  "hope",
  "love",
  "smile",
  "victory",
  "sun",
  "radiant",
  "cheer",
  "delight",
  "celebrate",
  "sparkle",
];

const NEGATIVE_WORDS = [
  "dark",
  "storm",
  "shadow",
  "lonely",
  "cold",
  "sad",
  "tears",
  "fear",
  "bleak",
  "hollow",
  "broken",
  "haunt",
];

const ENERGETIC_WORDS = [
  "fire",
  "run",
  "rush",
  "wild",
  "electric",
  "pulse",
  "thunder",
  "race",
  "storm",
  "drum",
  "surge",
  "ignite",
];

const CALM_WORDS = [
  "calm",
  "quiet",
  "still",
  "gentle",
  "soft",
  "breeze",
  "drift",
  "float",
  "whisper",
  "hush",
  "mellow",
  "slow",
];

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "for",
  "nor",
  "on",
  "in",
  "at",
  "to",
  "with",
  "from",
  "of",
  "by",
  "we",
  "you",
  "they",
  "them",
  "her",
  "his",
  "their",
  "our",
  "ours",
  "your",
  "yours",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "be",
  "is",
  "are",
  "was",
  "were",
  "been",
  "am",
  "as",
  "i",
  "he",
  "she",
]);

export interface MoodProfile {
  id: string;
  label: string;
  vibe: string;
  tempo: string;
  instrumentation: string;
  description: string;
}

export interface MoodAnalysis {
  profile: MoodProfile;
  positivity: number;
  energy: number;
  keywords: string[];
}

const MOOD_PROFILES: Record<string, MoodProfile> = {
  "radiant-anthem": {
    id: "radiant-anthem",
    label: "Radiant anthem",
    vibe: "celebratory and triumphant",
    tempo: "upbeat 120 BPM electro-pop",
    instrumentation: "shimmering synths, driving drums, and bright guitars",
    description: "An energetic, uplifting arrangement built for big hooks and sparkling textures.",
  },
  "warm-daydream": {
    id: "warm-daydream",
    label: "Warm daydream",
    vibe: "comforting and nostalgic",
    tempo: "downtempo 90 BPM lo-fi groove",
    instrumentation: "dusty drums, mellow electric piano, and airy pads",
    description: "A relaxed, optimistic tune that leans into gentle melodies and cozy beats.",
  },
  "midnight-embers": {
    id: "midnight-embers",
    label: "Midnight embers",
    vibe: "introspective and bittersweet",
    tempo: "slow 75 BPM ambient waltz",
    instrumentation: "haunting piano, bowed strings, and distant vocal pads",
    description: "A moody, reflective palette that lingers on minor chords and soft textures.",
  },
  "storm-chaser": {
    id: "storm-chaser",
    label: "Storm chaser",
    vibe: "dramatic and restless",
    tempo: "intense 130 BPM cinematic pulse",
    instrumentation: "layered percussion, edgy synth bass, and soaring strings",
    description: "High-energy tension with dramatic builds and bold rhythmic movement.",
  },
  "curious-journey": {
    id: "curious-journey",
    label: "Curious journey",
    vibe: "adventurous and evolving",
    tempo: "mid-tempo 105 BPM indie electronica",
    instrumentation: "plucky guitars, syncopated drums, and shimmering pads",
    description: "A forward-moving track that blends optimism with a hint of mystery.",
  },
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zA-Z']+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractKeywords(tokens: string[], limit = 6): string[] {
  const counts = new Map<string, number>();
  tokens.forEach((token) => {
    if (token.length < 4 || STOP_WORDS.has(token)) {
      return;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

function score(tokens: string[], wordList: string[]): number {
  const set = new Set(wordList);
  return tokens.filter((token) => set.has(token)).length;
}

function selectProfile(positivity: number, energy: number): MoodProfile {
  if (positivity >= 0.02 && energy >= 0.01) {
    return MOOD_PROFILES["radiant-anthem"];
  }

  if (positivity >= 0.02 && energy < 0.01) {
    return MOOD_PROFILES["warm-daydream"];
  }

  if (positivity <= -0.02 && energy <= 0.01) {
    return MOOD_PROFILES["midnight-embers"];
  }

  if (positivity <= -0.02 && energy > 0.01) {
    return MOOD_PROFILES["storm-chaser"];
  }

  return MOOD_PROFILES["curious-journey"];
}

export function analyzeStoryMood(text: string): MoodAnalysis {
  const sanitized = sanitize(text);
  const tokens = tokenize(sanitized);
  const totalTokens = tokens.length || 1;

  const positivityScore = score(tokens, POSITIVE_WORDS) - score(tokens, NEGATIVE_WORDS);
  const energyScore = score(tokens, ENERGETIC_WORDS) - score(tokens, CALM_WORDS);

  const positivity = positivityScore / totalTokens;
  const energy = energyScore / totalTokens;
  const keywords = extractKeywords(tokens);

  const profile = selectProfile(positivity, energy);

  return { profile, positivity, energy, keywords };
}

function trimExcerpt(text: string, maxWords = 80): string {
  const sanitized = sanitize(text).replace(/\s+/g, " ");
  const words = sanitized.split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }
  return `${words.slice(-maxWords).join(" ")}...`;
}

interface BuildPromptOptions {
  roomTitle: string;
  storyText: string;
  analysis: MoodAnalysis;
}

export function buildMusicPrompt({ roomTitle, storyText, analysis }: BuildPromptOptions): {
  prompt: string;
  excerpt: string;
} {
  const excerpt = trimExcerpt(storyText);
  const keywordLine =
    analysis.keywords.length > 0 ? ` Key images: ${analysis.keywords.join(", ")}.` : "";

  const prompt = `Compose a ${analysis.profile.tempo} ${analysis.profile.label.toLowerCase()} instrumental score for the collaborative story "${roomTitle}". Focus on ${analysis.profile.instrumentation} and keep the vibe ${analysis.profile.vibe}. Draw inspiration from this excerpt: ${excerpt}.${keywordLine} Avoid explicit vocals; lean on humming or instrumental hooks.`;

  return { prompt, excerpt };
}
