"use client";

import { useState, useTransition } from "react";
import { overrideSlot } from "@/app/actions/planActions";
import { MealPhoto } from "@/app/components/MealPhoto";

type Meal = { id: string; name: string; photoUrl: string | null };

// The "swap this whole meal" parent override from MVP-SPEC.md — lets a parent
// replace any slot's pick (including a kid's) with a different meal from the
// library before the week locks in. `meals` should already be the right library
// for this slot's type (dinner/breakfast/lunch — see review/page.tsx). For LUNCH
// slots, `showEatAtSchool` adds a cafeteria option alongside the home-made meals.
// Calls the existing overrideSlot server action, which regenerates the shopping
// list and revalidates this page.
export function OverrideControl({
  weeklyPlanId,
  slotId,
  currentMealId,
  meals,
  showEatAtSchool = false,
  currentlyEatingAtSchool = false,
}: {
  weeklyPlanId: string;
  slotId: string;
  currentMealId: string | null;
  meals: Meal[];
  showEatAtSchool?: boolean;
  currentlyEatingAtSchool?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function choose(mealId: string) {
    startTransition(async () => {
      await overrideSlot(weeklyPlanId, slotId, mealId, false);
      setOpen(false);
    });
  }

  function chooseSchool() {
    startTransition(async () => {
      await overrideSlot(weeklyPlanId, slotId, null, true);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-kitchen-ink/60 underline mt-1">
        Change this pick
      </button>
    );
  }

  const alternatives = meals.filter((m) => m.id !== currentMealId);

  return (
    <div className="mt-2 border-t border-kitchen-ink/10 pt-2">
      <div className="grid grid-cols-2 gap-2">
        {showEatAtSchool && !currentlyEatingAtSchool && (
          <button
            disabled={isPending}
            onClick={chooseSchool}
            className="flex items-center gap-2 rounded-card border-2 border-kitchen-ink/10 bg-white p-2 text-left hover:border-kitchen-sage transition-colors disabled:opacity-50"
          >
            <span className="text-xl">🍽️</span>
            <span className="text-sm font-medium">Eat at School</span>
          </button>
        )}
        {alternatives.map((meal) => (
          <button
            key={meal.id}
            disabled={isPending}
            onClick={() => choose(meal.id)}
            className="flex items-center gap-2 rounded-card border-2 border-kitchen-ink/10 bg-white p-2 text-left hover:border-kitchen-tomato transition-colors disabled:opacity-50"
          >
            <MealPhoto src={meal.photoUrl} alt={meal.name} className="h-8 w-8 rounded-md flex-shrink-0" />
            <span className="text-sm font-medium">{meal.name}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setOpen(false)}
        disabled={isPending}
        className="mt-2 text-sm text-kitchen-ink/50 underline"
      >
        {isPending ? "Saving..." : "Cancel"}
      </button>
    </div>
  );
}
