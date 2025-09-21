"use client";

import { Badge } from "@/components/ui/badge";
import { useRoom } from "@/components/room/room-provider";
import type { RoomRule } from "@/lib/rooms";

interface RuleBadgesProps {
  rules?: RoomRule[];
  describeRule?: (rule: RoomRule) => string;
  className?: string;
}

export function RuleBadges({ rules, describeRule, className }: RuleBadgesProps) {
  const context = useRoomOptional();
  const effectiveRules = rules ?? context?.rules ?? [];
  const describe = describeRule ?? context?.describeRule;

  if (effectiveRules.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {effectiveRules.map((rule) => (
        <Badge key={JSON.stringify(rule)} variant="muted" className="capitalize">
          {describe ? describe(rule) : formatRule(rule)}
        </Badge>
      ))}
    </div>
  );
}

function formatRule(rule: RoomRule) {
  switch (rule.type) {
    case "maxWords":
      return `${rule.value} word limit`;
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

function useRoomOptional() {
  try {
    return useRoom();
  } catch {
    return null;
  }
}
