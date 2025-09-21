import { rhymeHeuristic, type RhymeDetails, sanitize, wordCount } from "@/lib/text";

export interface TurnValidationOptions {
  maxWords: number;
  maxSentences: number;
  forbiddenWords?: string[];
  requireRhymeWith?: string | null;
  rhymeThreshold?: number;
}

export interface TurnValidationResult {
  isValid: boolean;
  sanitized: string;
  wordTotal: number;
  sentenceTotal: number;
  rhyme?: RhymeDetails;
  errors: string[];
}

export const DEFAULT_TURN_VALIDATION: TurnValidationOptions = {
  maxWords: 120,
  maxSentences: 8,
  forbiddenWords: [],
  requireRhymeWith: null,
  rhymeThreshold: 0.4,
};

function countSentences(input: string): number {
  if (!input) {
    return 0;
  }

  return input
    .split(/[.!?]+/)
    .map((segment) => segment.trim())
    .filter(Boolean).length;
}

function containsForbiddenWord(input: string, forbidden: string[]): string | null {
  if (!input || forbidden.length === 0) {
    return null;
  }

  const tokens = input.toLowerCase().split(" ");
  const blacklist = new Set(forbidden.map((word) => word.toLowerCase()));

  for (const token of tokens) {
    if (blacklist.has(token)) {
      return token;
    }
  }

  return null;
}

export function validateTurn(
  content: string,
  options: TurnValidationOptions = DEFAULT_TURN_VALIDATION,
): TurnValidationResult {
  const merged: TurnValidationOptions = {
    ...DEFAULT_TURN_VALIDATION,
    ...options,
    forbiddenWords: options.forbiddenWords ?? DEFAULT_TURN_VALIDATION.forbiddenWords,
  };

  const sanitized = sanitize(content);
  const words = wordCount(sanitized);
  const sentences = countSentences(sanitized);
  const errors: string[] = [];

  if (words > merged.maxWords) {
    errors.push(`Turn exceeds the maximum of ${merged.maxWords} words.`);
  }

  if (sentences > merged.maxSentences) {
    errors.push(`Turn exceeds the maximum of ${merged.maxSentences} sentences.`);
  }

  const forbidden = containsForbiddenWord(sanitized.toLowerCase(), merged.forbiddenWords ?? []);
  if (forbidden) {
    errors.push(`Turn contains a forbidden word: ${forbidden}.`);
  }

  let rhyme: RhymeDetails | undefined;
  if (merged.requireRhymeWith) {
    rhyme = rhymeHeuristic(merged.requireRhymeWith, sanitized);
    if (rhyme.score < (merged.rhymeThreshold ?? DEFAULT_TURN_VALIDATION.rhymeThreshold!)) {
      errors.push("Turn does not appear to rhyme with the previous line.");
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    wordTotal: words,
    sentenceTotal: sentences,
    rhyme,
    errors,
  };
}
