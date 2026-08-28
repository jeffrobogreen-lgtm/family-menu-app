"use client";

import { useState } from "react";
import { createWeeklyPlan } from "@/app/actions/planActions";
import { DinnerPicker, type DinnerPickOut, type Meal } from "./DinnerPicker";
import { BreakfastPicker, type BreakfastPickOut } from "./BreakfastPicker";
import { LunchPicker, type LunchPickOut, type FruitMeal } from "./LunchPicker";

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
  fruitMeals,
  kidNames,
  schoolLunchMenus,
}: {
  dinnerMeals: Meal[];
  breakfastMeals: Meal[];
  lunchMeals: Meal[];
  fruitMeals: FruitMeal[];
  kidNames: string[];
  schoolLunchMenus: Record<number, string | undefined>;
}) {
  const [phase, setPhase] = useState<Phase>("dinners");
  const [dinnerPicks, setDinnerPicks] = useState<DinnerPickOut[] | null>(null);
  const [breakfastPicks, setBreakfastPicks] = useState<BreakfastPickOut[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleDinnersDone(picks: DinnerPickOut[]) {
    setDinnerPicks(picks);
    setPhase("breakfasts");
  }

  function handleBreakfastsDone(picks: BreakfastPickOut[]) {
    setBreakfastPicks(picks);
    setPhase("lunches");
  }

  async function handleLunchesDone(lunchPicks: LunchPickOut[], fruitMealIds: string[]) {
    // Free navigation between phases (see PhaseIndicator below) means someone could
    // reach "Done" on Lunches before Dinners or Breakfasts were ever finished — bounce
    // them back to whichever phase is still incomplete instead of submitting bad data.
    if (!dinnerPicks) {
      setNotice("Finish picking dinners before building the shopping list.");
      setPhase("dinners");
      return;
    }
    if (!breakfastPicks) {
      setNotice("Finish picking breakfasts before building the shopping list.");
      setPhase("breakfasts");
      return;
    }
    setNotice(null);
    setSubmitting(true);
    // createWeeklyPlan ends with redirect() — Next.js's server-action machinery
    // intercepts that and navigates the client automatically, so we just await it.
    await createWeeklyPlan(
      new Date().toISOString(),
      dinnerPicks,
      breakfastPicks,
      lunchPicks,
      fruitMealIds,
    );
  }

  return (
    <div>
      <PhaseIndicator current={phase} onSelect={setPhase} />

      {notice && (
        <div className="mb-6 rounded-card bg-kitchen-mustard/20 border-2 border-kitchen-mustard px-4 py-3 text-sm font-medium text-kitchen-ink">
          {notice}
        </div>
      )}

      {submitting ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 animate-bounce">🛒</div>
          <div className="font-display text-lg font-semibold">Building your shopping list...</div>
        </div>
      ) : (
        <>
          {/* All three pickers stay mounted the whole time (toggled with `hidden`,
              not conditional rendering) so that jumping between Dinners/Breakfasts/
              Lunches via the icons above — e.g. because a family member has to leave
              — never loses whatever's already been picked in the phase you're leaving. */}
          <div hidden={phase !== "dinners"}>
            <DinnerPicker meals={dinnerMeals} kidNames={kidNames} onDone={handleDinnersDone} />
          </div>
          <div hidden={phase !== "breakfasts"}>
            <BreakfastPicker
              meals={breakfastMeals}
              onDone={handleBreakfastsDone}
              onBack={() => setPhase("dinners")}
            />
          </div>
          <div hidden={phase !== "lunches"}>
            <LunchPicker
              meals={lunchMeals}
              schoolLunchMenus={schoolLunchMenus}
              kidNames={kidNames}
              fruitMeals={fruitMeals}
              onDone={handleLunchesDone}
              onBack={() => setPhase("breakfasts")}
            />
          </div>
        </>
      )}
    </div>
  );
}

function PhaseIndicator({
  current,
  onSelect,
}: {
  current: Phase;
  onSelect: (phase: Phase) => void;
}) {
  const currentIndex = PHASES.findIndex((p) => p.key === current);
  return (
    <div className="flex justify-center gap-6 mb-8">
      {PHASES.map((p, i) => (
        <button
          key={p.key}
          onClick={() => onSelect(p.key)}
          className="flex flex-col items-center gap-1"
          aria-current={p.key === current}
        >
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
        </button>
      ))}
    </div>
  );
}
