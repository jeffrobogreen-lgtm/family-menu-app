"use client";

import { useState } from "react";
import { createWeeklyPlan } from "@/app/actions/planActions";
import { DinnerPicker, type DinnerPickOut, type Meal } from "./DinnerPicker";
import { BreakfastPicker, type BreakfastPickOut } from "./BreakfastPicker";
import { LunchPicker, type LunchPickOut } from "./LunchPicker";

type Phase = "dinners" | "breakfasts" | "lunches";

const PHASES: { key: Phase; label: string; emoji: string }[] = [
  { key: "dinners", label: "Dinners", emoji: "🍝" },
  { key: "breakfasts", label: "Breakfasts", emoji: "🥞" },
  { key: "lunches", label: "Lunches", emoji: "🥪" },
];

export function WeekPicker({
  dinnerMeals,
  breakfastMeals,
  lunchMeals,
  kidNames,
  schoolLunchMenus,
}: {
  dinnerMeals: Meal[];
  breakfastMeals: Meal[];
  lunchMeals: Meal[];
  kidNames: string[];
  schoolLunchMenus: Record<number, string | undefined>;
}) {
  const [phase, setPhase] = useState<Phase>("dinners");
  const [dinnerPicks, setDinnerPicks] = useState<DinnerPickOut[] | null>(null);
  const [breakfastPicks, setBreakfastPicks] = useState<BreakfastPickOut[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleDinnersDone(picks: DinnerPickOut[]) {
    setDinnerPicks(picks);
    setPhase("breakfasts");
  }

  function handleBreakfastsDone(picks: BreakfastPickOut[]) {
    setBreakfastPicks(picks);
    setPhase("lunches");
  }

  async function handleLunchesDone(lunchPicks: LunchPickOut[]) {
    setSubmitting(true);
    // createWeeklyPlan ends with redirect() — Next.js's server-action machinery
    // intercepts that and navigates the client automatically, so we just await it.
    await createWeeklyPlan(new Date().toISOString(), dinnerPicks!, breakfastPicks!, lunchPicks);
  }

  return (
    <div>
      <PhaseIndicator current={phase} />

      {submitting ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 animate-bounce">🛒</div>
          <div className="font-display text-lg font-semibold">Building your shopping list...</div>
        </div>
      ) : phase === "dinners" ? (
        <DinnerPicker meals={dinnerMeals} kidNames={kidNames} onDone={handleDinnersDone} />
      ) : phase === "breakfasts" ? (
        <BreakfastPicker
          meals={breakfastMeals}
          onDone={handleBreakfastsDone}
          onBack={() => setPhase("dinners")}
        />
      ) : (
        <LunchPicker
          meals={lunchMeals}
          schoolLunchMenus={schoolLunchMenus}
          onDone={handleLunchesDone}
          onBack={() => setPhase("breakfasts")}
        />
      )}
    </div>
  );
}

function PhaseIndicator({ current }: { current: Phase }) {
  const currentIndex = PHASES.findIndex((p) => p.key === current);
  return (
    <div className="flex justify-center gap-6 mb-8">
      {PHASES.map((p, i) => (
        <div key={p.key} className="flex flex-col items-center gap-1">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center text-lg transition-colors ${
              i === currentIndex
                ? "bg-kitchen-tomato text-white"
                : i < currentIndex
                  ? "bg-kitchen-sage text-white"
                  : "bg-kitchen-ink/10 text-kitchen-ink/40"
            }`}
          >
            {i < currentIndex ? "✓" : p.emoji}
          </div>
          <span
            className={`text-xs font-medium ${
              i === currentIndex ? "text-kitchen-ink" : "text-kitchen-ink/40"
            }`}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
