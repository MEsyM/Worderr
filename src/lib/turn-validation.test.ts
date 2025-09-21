import { describe, expect, it } from "vitest";
import { validateTurn } from "@/lib/turn-validation";

describe("validateTurn", () => {
  it("returns a valid result with sanitized content when within limits", () => {
    const result = validateTurn(" Hello   world!  ");

    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe("Hello world!");
    expect(result.wordTotal).toBe(2);
    expect(result.sentenceTotal).toBe(1);
    expect(result.errors).toEqual([]);
  });

  it("flags turns exceeding the maximum word count", () => {
    const result = validateTurn("one two three four", { maxWords: 3, maxSentences: 5 });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Turn exceeds the maximum of 3 words.");
  });

  it("detects forbidden words case-insensitively", () => {
    const result = validateTurn("This has Spoiler content", {
      maxWords: 10,
      maxSentences: 5,
      forbiddenWords: ["spoiler"],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Turn contains a forbidden word: spoiler.");
  });

  it("requires a rhyme when configured", () => {
    const result = validateTurn("Nothing like the sun", {
      maxWords: 20,
      maxSentences: 5,
      requireRhymeWith: "Play the guitar",
      rhymeThreshold: 0.8,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Turn does not appear to rhyme with the previous line.");
    expect(result.rhyme?.score ?? 0).toBeLessThan(0.8);
  });
});
