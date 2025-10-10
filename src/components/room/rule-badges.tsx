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
    case "turnTimer":
      if (rule.value === 0) {
        return "No turn timer";
      }
      if (rule.value < 3600) {
        return `${Math.round(rule.value / 60)} min turns`;
      }
      if (rule.value < 86400) {
        return `${Math.round(rule.value / 3600)} hr turns`;
      }
      return `${Math.round(rule.value / 86400)} day turns`;
    case "maxWarnings":
      return `${rule.value} warning limit`;
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
