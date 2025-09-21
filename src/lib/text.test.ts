import { describe, expect, it } from "vitest";
import { rhymeHeuristic, sanitize, wordCount } from "@/lib/text";

describe("sanitize", () => {
  it("removes control characters and collapses whitespace", () => {
    const input = "\u0000 Hello\tworld!  \u001F";
    const result = sanitize(input);

    expect(result).toBe("Hello world!");
  });
});

describe("wordCount", () => {
  it("normalizes whitespace before counting words", () => {
    const input = " Multiple    spaced\nwords here \t";

    expect(wordCount(input)).toBe(4);
  });

  it("returns zero for empty input", () => {
    expect(wordCount("   ")).toBe(0);
  });
});

describe("rhymeHeuristic", () => {
  it("detects strong rhymes and returns the matching fragment", () => {
    const result = rhymeHeuristic("Twinkle star", "Play the guitar");

    expect(result.score).toBe(1);
    expect(result.fragment).toBe("ar");
  });

  it("returns a zero score when a word cannot be extracted", () => {
    const result = rhymeHeuristic("stars", "???");

    expect(result.score).toBe(0);
    expect(result.fragment).toBeNull();
  });
});
