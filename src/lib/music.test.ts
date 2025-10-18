import { describe, expect, it } from "vitest";

import { analyzeStoryMood, buildMusicPrompt } from "@/lib/music";

const POSITIVE_TEXT = `Sunlight dances on the river as the crew cheers another victory.
We sprint through the market with radiant smiles and electric joy.`;

const MELANCHOLIC_TEXT = `Cold rain haunts the alley where lonely footsteps echo.
Shadows linger and the whispering wind carries tired prayers.`;

describe("analyzeStoryMood", () => {
  it("detects a radiant mood for upbeat text", () => {
    const analysis = analyzeStoryMood(POSITIVE_TEXT);

    expect(analysis.profile.id).toBe("radiant-anthem");
    expect(analysis.positivity).toBeGreaterThan(0);
    expect(analysis.energy).toBeGreaterThan(0);
    expect(analysis.keywords.length).toBeGreaterThan(0);
  });

  it("detects a midnight mood for somber text", () => {
    const analysis = analyzeStoryMood(MELANCHOLIC_TEXT);

    expect(analysis.profile.id).toBe("midnight-embers");
    expect(analysis.positivity).toBeLessThan(0);
    expect(analysis.energy).toBeLessThanOrEqual(0);
  });
});

describe("buildMusicPrompt", () => {
  it("includes room title, mood details, and excerpt", () => {
    const analysis = analyzeStoryMood(POSITIVE_TEXT);
    const { prompt, excerpt } = buildMusicPrompt({
      roomTitle: "Festival Frenzy",
      storyText: POSITIVE_TEXT,
      analysis,
    });

    expect(prompt).toContain("Festival Frenzy");
    expect(prompt.toLowerCase()).toContain(analysis.profile.label.toLowerCase());
    expect(excerpt.length).toBeGreaterThan(0);
  });
});
