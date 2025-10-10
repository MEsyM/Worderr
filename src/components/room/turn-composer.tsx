"use client";

import * as React from "react";
import { Lightbulb, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoom } from "@/components/room/room-provider";
import { toast } from "@/components/ui/use-toast";
import {
  DEFAULT_TURN_VALIDATION,
  type TurnValidationOptions,
  validateTurn,
} from "@/lib/turn-validation";
import type { RoomRule } from "@/lib/rooms";

function buildValidationOptions(rules: RoomRule[]): TurnValidationOptions {
  let maxWords = DEFAULT_TURN_VALIDATION.maxWords;
  let maxSentences = DEFAULT_TURN_VALIDATION.maxSentences;
  const forbiddenWords = new Set<string>();
  let requireRhymeWith: string | null = null;

  rules.forEach((rule) => {
    if (rule.type === "maxWords") {
      maxWords = rule.value;
    } else if (rule.type === "maxSentences") {
      maxSentences = rule.value;
    } else if (rule.type === "forbidden") {
      rule.value.forEach((word) => forbiddenWords.add(word));
    } else if (rule.type === "rhyme") {
      requireRhymeWith = rule.value;
    }
  });

  return {
    maxWords,
    maxSentences,
    forbiddenWords: Array.from(forbiddenWords),
    requireRhymeWith,
  };
}

export function TurnComposer() {
  const { currentPrompt, submitTurn, rules, suggestion, dismissSuggestion, canSubmit } = useRoom();
  const validationOptions = React.useMemo(() => buildValidationOptions(rules), [rules]);
  const [draft, setDraft] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const wordTotal = React.useMemo(() => draft.trim().split(/\s+/).filter(Boolean).length, [draft]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!canSubmit) {
      toast({
        title: "Please wait",
        description: "It’s not your turn yet. Hang tight!",
      });
      return;
    }

    const result = validateTurn(draft, validationOptions);

    if (!result.isValid) {
      toast({
        title: "Turn needs a tweak",
        description: result.errors.join(" "),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await submitTurn({ content: result.sanitized });
      toast({
        title: "Turn submitted",
        description: "Your riff is live in the feed.",
      });
      setDraft("");
      dismissSuggestion();
    } catch (error) {
      console.error("submitTurn failed", error);
      toast({
        title: "Unable to submit turn",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestion = React.useCallback(() => {
    if (!suggestion) {
      return;
    }
    setDraft((existing) => (existing ? `${existing}\n${suggestion}` : suggestion));
    dismissSuggestion();
  }, [suggestion, dismissSuggestion]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compose your turn</CardTitle>
        <CardDescription>Prompt: {currentPrompt}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {suggestion && (
            <button
              type="button"
              onClick={applySuggestion}
              className="flex w-full items-start gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/10 px-4 py-3 text-left text-sm transition hover:border-primary hover:bg-primary/15"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
              <span>
                AI suggests: <span className="font-medium text-primary">{suggestion}</span>
              </span>
            </button>
          )}
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[160px] w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Spin a line, keep it punchy, honor the rules."
            disabled={!canSubmit}
          />
          <div className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {wordTotal} words · limit {validationOptions.maxWords}
            </span>
            {validationOptions.requireRhymeWith && (
              <span>Needs to rhyme with &ldquo;{validationOptions.requireRhymeWith}&rdquo;</span>
            )}
            {validationOptions.forbiddenWords && validationOptions.forbiddenWords.length > 0 && (
              <span>Forbidden: {validationOptions.forbiddenWords.join(", ")}</span>
            )}
          </div>
          {!canSubmit && (
            <p className="text-xs text-muted-foreground">
              You&rsquo;re waiting for your turn. The composer will unlock when it&rsquo;s your
              move.
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isSubmitting || draft.trim().length === 0 || !canSubmit}>
            <Send className="mr-2 h-4 w-4" /> Publish turn
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
