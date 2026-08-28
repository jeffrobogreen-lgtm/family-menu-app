"use client";

import { useMemo, useState } from "react";
import { MealPhoto } from "@/app/components/MealPhoto";
import { FavoriteStar } from "@/app/components/FavoriteStar";
import type { Meal } from "./DinnerPicker";

export type LunchPickOut = {
  kidName: string;
  weekday: number; // 0=Mon..4=Fri
  eatingAtSchool: boolean;
  mealId: string | null; // null when eatingAtSchool
};

export type FruitMeal = { id: string; name: string };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type DayPick = { eatingAtSchool: boolean; mealId: string | null } | null;

// Steps are laid out kid-major: all 5 weekdays for kid 0, then all 5 for kid 1, etc.,
// followed by one final "fresh fruit for the week" step shared across the whole family.
export function LunchPicker({
  meals,
  schoolLunchMenus,
  kidNames,
  fruitMeals,
  onDone,
  onBack,
}: {
  meals: Meal[];
  schoolLunchMenus: Record<number, string | undefined>; // weekday index -> cafeteria menu text, if known
  kidNames: string[];
  fruitMeals: FruitMeal[];
  onDone: (picks: LunchPickOut[], fruitMealIds: string[]) => void;
  onBack: () => void;
}) {
  // Fall back to a single generic "Kid" profile if no family members are set up yet,
  // so the picker never renders zero steps.
  const kids = kidNames.length > 0 ? kidNames : ["Kid"];
  const totalDaySteps = kids.length * WEEKDAYS.length;
  const totalSteps = totalDaySteps + 1; // + fresh fruit step

  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<DayPick[]>(Array(totalDaySteps).fill(null));
  const [fruitPicks, setFruitPicks] = useState<Set<string>>(new Set());

  // See DinnerPicker.tsx for why this is local, optimistic state.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(meals.filter((m) => m.isFavorite).map((m) => m.id)),
  );

  const sortedMeals = useMemo(
    () => [...meals].sort((a, b) => Number(favoriteIds.has(b.id)) - Number(favoriteIds.has(a.id))),
    [meals, favoriteIds],
  );

  function toggleFavorite(mealId: string, next: boolean) {
    setFavoriteIds((prev) => {
      const nextSet = new Set(prev);
      if (next) nextSet.add(mealId);
      else nextSet.delete(mealId);
      return nextSet;
    });
  }

  const onFruitStep = step >= totalDaySteps;
  const kidIndex = onFruitStep ? -1 : Math.floor(step / WEEKDAYS.length);
  const weekdayIndex = onFruitStep ? -1 : step % WEEKDAYS.length;
  const kidName = onFruitStep ? "" : kids[kidIndex];

  const current = onFruitStep ? null : picks[step];
  const allDaysPicked = picks.every((p) => p !== null);
  const cafeteriaMenu = onFruitStep ? undefined : schoolLunchMenus[weekdayIndex];

  function chooseSchool() {
    setPicks((prev) => {
      const next = [...prev];
      next[step] = { eatingAtSchool: true, mealId: null };
      return next;
    });
  }

  function chooseMeal(meal: Meal) {
    setPicks((prev) => {
      const next = [...prev];
      next[step] = { eatingAtSchool: false, mealId: meal.id };
      return next;
    });
  }

  function clearPick() {
    setPicks((prev) => {
      const next = [...prev];
      next[step] = null;
      return next;
    });
  }

  function toggleFruit(fruitId: string) {
    setFruitPicks((prev) => {
      const next = new Set(prev);
      if (next.has(fruitId)) {
        next.delete(fruitId);
      } else {
        next.add(fruitId);
      }
      return next;
    });
  }

  function handleSubmit() {
    const out: LunchPickOut[] = picks.map((p, i) => ({
      kidName: kids[Math.floor(i / WEEKDAYS.length)],
      weekday: i % WEEKDAYS.length,
      eatingAtSchool: p!.eatingAtSchool,
      mealId: p!.mealId,
    }));
    onDone(out, Array.from(fruitPicks));
  }

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
            aria-current={i === step}
            className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? "bg-kitchen-sage" : "bg-kitchen-ink/10"} hover:opacity-80`}
          />
        ))}
      </div>

      {onFruitStep ? (
        <>
          <h2 className="font-display text-xl font-semibold mb-1">Fresh Fruit This Week 🍓</h2>
          <p className="text-sm text-kitchen-ink/60 mb-4">
            Check off whatever fruit you need for lunches this week.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {fruitMeals.map((fruit) => {
              const selected = fruitPicks.has(fruit.id);
              return (
                <button
                  key={fruit.id}
                  onClick={() => toggleFruit(fruit.id)}
                  className={`rounded-card border-2 bg-white p-4 text-left transition-colors flex items-center gap-3 ${
                    selected ? "border-kitchen-sage" : "border-kitchen-ink/10 hover:border-kitchen-sage"
                  }`}
                >
                  <span
                    className={`h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs text-white ${
                      selected ? "bg-kitchen-sage border-kitchen-sage" : "border-kitchen-ink/20"
                    }`}
                  >
                    {selected ? "✓" : ""}
                  </span>
                  <span className="font-display font-semibold">{fruit.name}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h2 className="font-display text-xl font-semibold mb-1">
            {kidName}&apos;s {WEEKDAYS[weekdayIndex]} Lunch 🥪
          </h2>
          <p className="text-sm text-kitchen-ink/60 mb-4">
            Eat at school, or pack a favorite from home?
          </p>

          {!current ? (
            <div className="space-y-4">
              <button
                onClick={chooseSchool}
                className="w-full rounded-card border-2 border-kitchen-ink/10 bg-white p-4 text-left hover:border-kitchen-sage transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">🍽️</span>
                <div>
                  <div className="font-display font-semibold">Eat at School</div>
                  {cafeteriaMenu ? (
                    <div className="text-sm text-kitchen-ink/60">{cafeteriaMenu}</div>
                  ) : (
                    <div className="text-sm text-kitchen-ink/40 italic">
                      Cafeteria menu not imported yet
                    </div>
                  )}
                </div>
              </button>

              <div>
                <div className="text-sm text-kitchen-ink/60 mb-2">...or pack from home:</div>
                <div className="grid grid-cols-2 gap-3">
                  {sortedMeals.map((meal) => (
                    <div key={meal.id} className="relative">
                      <button
                        onClick={() => chooseMeal(meal)}
                        className="w-full rounded-card border-2 border-kitchen-ink/10 bg-white overflow-hidden text-left hover:border-kitchen-sage transition-colors"
                      >
                        <MealPhoto src={meal.photoUrl} alt={meal.name} className="h-24 w-full" />
                        <div className="font-display font-semibold p-4 pr-8">{meal.name}</div>
                      </button>
                      <FavoriteStar
                        mealId={meal.id}
                        isFavorite={favoriteIds.has(meal.id)}
                        onToggle={toggleFavorite}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-card border-2 border-kitchen-sage bg-white p-5">
              {current.eatingAtSchool ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <div className="font-display text-lg font-semibold">Eating at School</div>
                    {cafeteriaMenu && <div className="text-sm text-kitchen-ink/60">{cafeteriaMenu}</div>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <MealPhoto
                    src={meals.find((m) => m.id === current.mealId)?.photoUrl}
                    alt={meals.find((m) => m.id === current.mealId)?.name ?? "Meal"}
                    className="h-14 w-14 rounded-lg flex-shrink-0"
                  />
                  <div className="font-display text-lg font-semibold">
                    {meals.find((m) => m.id === current.mealId)?.name}
                  </div>
                </div>
              )}
              <button onClick={clearPick} className="mt-3 text-sm text-kitchen-ink/60 underline">
                Change this pick
              </button>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={() => (step === 0 ? onBack() : setStep((s) => s - 1))}
          className="px-4 py-2 rounded-full"
        >
          Back
        </button>

        {step < totalSteps - 1 ? (
          <button
            disabled={!onFruitStep && !current}
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-2 rounded-full bg-kitchen-sage text-white disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            disabled={!allDaysPicked}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-full bg-kitchen-tomato text-white disabled:opacity-30"
          >
            Done — Review Week 🎉
          </button>
        )}
      </div>
    </div>
  );
}
