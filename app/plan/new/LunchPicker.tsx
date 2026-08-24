"use client";

import { useState } from "react";
import { MealPhoto } from "@/app/components/MealPhoto";
import type { Meal } from "./DinnerPicker";

export type LunchPickOut = {
  weekday: number; // 0=Mon..4=Fri
  pickedBy: string; // weekday label, e.g. "Monday"
  eatingAtSchool: boolean;
  mealId: string | null; // null when eatingAtSchool
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type DayPick = { eatingAtSchool: boolean; mealId: string | null } | null;

export function LunchPicker({
  meals,
  schoolLunchMenus,
  onDone,
  onBack,
}: {
  meals: Meal[];
  schoolLunchMenus: Record<number, string | undefined>; // weekday index -> cafeteria menu text, if known
  onDone: (picks: LunchPickOut[]) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<DayPick[]>(Array(WEEKDAYS.length).fill(null));

  const current = picks[step];
  const allPicked = picks.every((p) => p !== null);
  const cafeteriaMenu = schoolLunchMenus[step];

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

  function handleSubmit() {
    const out: LunchPickOut[] = picks.map((p, i) => ({
      weekday: i,
      pickedBy: WEEKDAYS[i],
      eatingAtSchool: p!.eatingAtSchool,
      mealId: p!.mealId,
    }));
    onDone(out);
  }

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {picks.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i <= step ? "bg-kitchen-sage" : "bg-kitchen-ink/10"}`}
          />
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-1">{WEEKDAYS[step]}&apos;s Lunch 🥪</h2>
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
              {meals.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => chooseMeal(meal)}
                  className="rounded-card border-2 border-kitchen-ink/10 bg-white overflow-hidden text-left hover:border-kitchen-sage transition-colors"
                >
                  <MealPhoto src={meal.photoUrl} alt={meal.name} className="h-24 w-full" />
                  <div className="font-display font-semibold p-4">{meal.name}</div>
                </button>
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

      <div className="flex justify-between mt-6">
        <button
          onClick={() => (step === 0 ? onBack() : setStep((s) => s - 1))}
          className="px-4 py-2 rounded-full"
        >
          Back
        </button>

        {step < WEEKDAYS.length - 1 ? (
          <button
            disabled={!current}
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-2 rounded-full bg-kitchen-sage text-white disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            disabled={!allPicked}
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
