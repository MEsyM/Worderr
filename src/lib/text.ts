export interface RhymeDetails {
  /**
   * Score between 0 and 1 describing how strongly two strings appear to rhyme.
   */
  score: number;
  /**
   * The fragment from the candidate string that matched the reference.
   */
  fragment: string | null;
}

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const MULTIPLE_SPACES = /\s+/g;
const RHYME_WORD_REGEX = /[a-zA-Z']+/g;

/**
 * Normalizes arbitrary user input so it can be shared safely between the client and server.
 */
export function sanitize(input: string): string {
  return input.normalize("NFKC").replace(CONTROL_CHARS, " ").replace(MULTIPLE_SPACES, " ").trim();
}

/**
 * Counts the number of words in a given string.
 */
export function wordCount(input: string): number {
  const normalized = sanitize(input);
  if (!normalized) {
    return 0;
  }

  return normalized.split(" ").length;
}

function extractLastWord(input: string): string | null {
  const matches = input.toLowerCase().match(RHYME_WORD_REGEX);
  if (!matches || matches.length === 0) {
    return null;
  }

  return matches[matches.length - 1];
}

function extractRhymeFragment(word: string): string {
  const vowels = /[aeiouy]/;
  for (let i = word.length - 1; i >= 0; i -= 1) {
    if (vowels.test(word[i])) {
      return word.slice(i);
    }
  }

  return word.slice(-2);
}

/**
 * Provides a lightweight rhyming heuristic for two strings. The score ranges from 0 to 1,
 * where higher numbers indicate a stronger rhyme.
 */
export function rhymeHeuristic(reference: string, candidate: string): RhymeDetails {
  const referenceWord = extractLastWord(sanitize(reference));
  const candidateWord = extractLastWord(sanitize(candidate));

  if (!referenceWord || !candidateWord) {
    return { score: 0, fragment: null };
  }

  const referenceFragment = extractRhymeFragment(referenceWord);
  const candidateFragment = extractRhymeFragment(candidateWord);

  let overlap = 0;
  const maxLength = Math.max(referenceFragment.length, candidateFragment.length);

  for (let i = 0; i < Math.min(referenceFragment.length, candidateFragment.length); i += 1) {
    if (
      referenceFragment[referenceFragment.length - 1 - i] ===
      candidateFragment[candidateFragment.length - 1 - i]
    ) {
      overlap += 1;
    } else {
      break;
    }
  }

  return {
    score: maxLength === 0 ? 0 : overlap / maxLength,
    fragment: overlap === 0 ? null : candidateFragment.slice(candidateFragment.length - overlap),
  };
}
