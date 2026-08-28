"use client";

import { useMemo, useState } from "react";
import { MealPhoto } from "@/app/components/MealPhoto";
import { FavoriteStar } from "@/app/components/FavoriteStar";
import type { Meal } from "./DinnerPicker";

export type BreakfastPickOut = {
  pickedBy: string; // "Breakfast 1" / "Breakfast 2" / "Breakfast 3"
  mealId: string;
};

const PICK_COUNT = 3;

export function BreakfastPicker({
  meals,
  onDone,
  onBack,
}: {
  meals: Meal[];
  onDone: (picks: BreakfastPickOut[]) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<(string | null)[]>(Array(PICK_COUNT).fill(null));

  // See DinnerPicker.tsx for why this is local, optimistic state.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(meals.filter((m) => m.isFavorite).map((m) => m.id)),
  );

  const currentMealId = picks[step];
  const allPicked = picks.every((p) => p !== null);

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

  function pickMeal(meal: Meal) {
    setPicks((prev) => {
      const next = [...prev];
      next[step] = meal.id;
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

  function handleSubmit() {
    const out: BreakfastPickOut[] = picks.map((mealId, i) => ({
      pickedBy: `Breakfast ${i + 1}`,
      mealId: mealId!,
    }));
    onDone(out);
  }

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {picks.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Go to breakfast pick ${i + 1}`}
            aria-current={i === step}
            className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? "bg-kitchen-mustard" : "bg-kitchen-ink/10"} hover:opacity-80`}
          />
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-1">
        Breakfast Pick #{step + 1} of {PICK_COUNT} 🥞
      </h2>
      <p className="text-sm text-kitchen-ink/60 mb-4">
        Pick your favorites — repeats are totally fine, more of a good thing!
      </p>

      {!currentMealId ? (
        <div className="grid grid-cols-2 gap-3">
          {sortedMeals.map((meal) => (
            <div key={meal.id} className="relative">
              <button
                onClick={() => pickMeal(meal)}
                className="w-full rounded-card border-2 border-kitchen-ink/10 bg-white overflow-hidden text-left hover:border-kitchen-mustard transition-colors"
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
      ) : (
        <div className="rounded-card border-2 border-kitchen-mustard bg-white p-5">
          <div className="flex items-center gap-3">
            <MealPhoto
              src={meals.find((m) => m.id === currentMealId)?.photoUrl}
              alt={meals.find((m) => m.id === currentMealId)?.name ?? "Meal"}
              className="h-14 w-14 rounded-lg flex-shrink-0"
            />
            <div className="font-display text-lg font-semibold">
              {meals.find((m) => m.id === currentMealId)?.name}
            </div>
          </div>
          <button onClick={clearPick} className="mt-3 text-sm text-kitchen-ink/60 underline">
            Choose a different breakfast
          </button>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          onClick={() => (step === 0 ? onBack() : setStep((s) => s - 1))}
          className="px-4 py-2 rounded-full"
        >
          Back
        </button>

        {step < PICK_COUNT - 1 ? (
          <button
            disabled={!currentMealId}
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-2 rounded-full bg-kitchen-mustard text-kitchen-ink disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            disabled={!allPicked}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-full bg-kitchen-sage text-white disabled:opacity-30"
          >
            Next: Lunches →
          </button>
        )}
      </div>
    </div>
  );
}
