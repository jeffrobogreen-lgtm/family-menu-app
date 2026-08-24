"use client";

import { useMemo, useState } from "react";
import { MealPhoto } from "@/app/components/MealPhoto";

type SubstituteOption = { id: string; name: string };

type Ingredient = {
  id: string;
  name: string;
  role: string | null;
  swappable: boolean;
  optional: boolean;
  substituteGroup: { options: SubstituteOption[] } | null;
};

export type Meal = {
  id: string;
  name: string;
  photoUrl: string | null;
  tags: string;
  ingredients: Ingredient[];
};

type Slot = {
  key: string;
  label: string;
  slotType: "KID_PICK" | "PARENT_PICK" | "WILDCARD";
  pickedBy: string;
};

type Selection = {
  mealId: string;
  chosenSubstitutes: Record<string, string>;
};

export type DinnerPickOut = {
  slotType: "KID_PICK" | "PARENT_PICK" | "WILDCARD";
  pickedBy: string;
  mealId: string;
  chosenSubstitutes: Record<string, string>;
};

export function DinnerPicker({
  meals,
  kidNames,
  onDone,
}: {
  meals: Meal[];
  kidNames: string[]; // real names when available, falls back to "Kid 1"/"Kid 2"
  onDone: (picks: DinnerPickOut[]) => void;
}) {
  const SLOTS = useMemo<Slot[]>(() => {
    const kid1 = kidNames[0]?.trim() || "Kid 1";
    const kid2 = kidNames[1]?.trim() || "Kid 2";
    return [
      { key: "kid1", label: `${kid1}'s Pick`, slotType: "KID_PICK", pickedBy: kid1 },
      { key: "kid2", label: `${kid2}'s Pick`, slotType: "KID_PICK", pickedBy: kid2 },
      { key: "parent1", label: "Parent Pick", slotType: "PARENT_PICK", pickedBy: "Parent" },
      { key: "parent2", label: "Parent Pick", slotType: "PARENT_PICK", pickedBy: "Parent" },
      { key: "wildcard", label: "Wildcard", slotType: "WILDCARD", pickedBy: "Wildcard" },
    ];
  }, [kidNames]);

  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, Selection>>({});

  const slot = SLOTS[step];
  const currentSelection = selections[slot.key];
  const selectedMeal = meals.find((m) => m.id === currentSelection?.mealId);
  const allSlotsPicked = SLOTS.every((s) => selections[s.key]);

  function pickMeal(meal: Meal) {
    setSelections((prev) => ({
      ...prev,
      [slot.key]: { mealId: meal.id, chosenSubstitutes: {} },
    }));
  }

  function clearPick() {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[slot.key];
      return next;
    });
  }

  function pickSubstitute(ingredientId: string, optionName: string) {
    setSelections((prev) => {
      const current = prev[slot.key];
      if (!current) return prev;
      return {
        ...prev,
        [slot.key]: {
          ...current,
          chosenSubstitutes: { ...current.chosenSubstitutes, [ingredientId]: optionName },
        },
      };
    });
  }

  function toggleOptional(ingredientId: string, optionName: string) {
    setSelections((prev) => {
      const current = prev[slot.key];
      if (!current) return prev;
      const next = { ...current.chosenSubstitutes };
      if (next[ingredientId] === optionName) {
        delete next[ingredientId]; // tapping the same option again removes it
      } else {
        next[ingredientId] = optionName;
      }
      return { ...prev, [slot.key]: { ...current, chosenSubstitutes: next } };
    });
  }

  function handleSubmit() {
    const picks: DinnerPickOut[] = SLOTS.map((s) => ({
      slotType: s.slotType,
      pickedBy: s.pickedBy,
      mealId: selections[s.key].mealId,
      chosenSubstitutes: selections[s.key].chosenSubstitutes,
    }));
    onDone(picks);
  }

  return (
    <div>
      {/* progress: one segment per slot, filled as picks are made */}
      <div className="flex gap-1 mb-6">
        {SLOTS.map((s, i) => (
          <div
            key={s.key}
            className={`h-2 flex-1 rounded-full ${i <= step ? "bg-kitchen-tomato" : "bg-kitchen-ink/10"}`}
          />
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">{slot.label}</h2>

      {!currentSelection ? (
        <div className="grid grid-cols-2 gap-3">
          {meals.map((meal) => (
            <button
              key={meal.id}
              onClick={() => pickMeal(meal)}
              className="rounded-card border-2 border-kitchen-ink/10 bg-white overflow-hidden text-left hover:border-kitchen-tomato transition-colors"
            >
              <MealPhoto src={meal.photoUrl} alt={meal.name} className="h-24 w-full" />
              <div className="font-display font-semibold p-4">{meal.name}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-card border-2 border-kitchen-tomato bg-white p-5">
          <div className="flex items-center gap-3 mb-3">
            <MealPhoto
              src={selectedMeal?.photoUrl}
              alt={selectedMeal?.name ?? "Meal"}
              className="h-14 w-14 rounded-lg flex-shrink-0"
            />
            <div className="font-display text-lg font-semibold">{selectedMeal?.name}</div>
          </div>

          {selectedMeal?.ingredients
            .filter((ing) => ing.swappable)
            .map((ing) => (
              <div key={ing.id} className="mb-4">
                <div className="text-sm text-kitchen-ink/60 mb-1">
                  {ing.optional
                    ? `Add ${ing.role?.replace("_", " ") ?? "extra"}?`
                    : `Swap the ${ing.role?.replace("_", " ") ?? "side"}`}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!ing.optional && (
                    <Chip
                      label={ing.name}
                      active={!currentSelection.chosenSubstitutes[ing.id]}
                      onClick={() => pickSubstitute(ing.id, ing.name)}
                    />
                  )}
                  {ing.substituteGroup?.options
                    .filter((opt) => opt.name !== ing.name)
                    .map((opt) => (
                      <Chip
                        key={opt.id}
                        label={opt.name}
                        active={currentSelection.chosenSubstitutes[ing.id] === opt.name}
                        onClick={() =>
                          ing.optional
                            ? toggleOptional(ing.id, opt.name)
                            : pickSubstitute(ing.id, opt.name)
                        }
                      />
                    ))}
                </div>
              </div>
            ))}

          <button onClick={clearPick} className="text-sm text-kitchen-ink/60 underline">
            Choose a different meal
          </button>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="px-4 py-2 rounded-full disabled:opacity-30"
        >
          Back
        </button>

        {step < SLOTS.length - 1 ? (
          <button
            disabled={!currentSelection}
            onClick={() => setStep((s) => s + 1)}
            className="px-6 py-2 rounded-full bg-kitchen-tomato text-white disabled:opacity-30"
          >
            Next
          </button>
        ) : (
          <button
            disabled={!allSlotsPicked}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-full bg-kitchen-sage text-white disabled:opacity-30"
          >
            Next: Breakfasts →
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
        active
          ? "bg-kitchen-mustard border-kitchen-mustard text-kitchen-ink"
          : "border-kitchen-ink/15 text-kitchen-ink/70"
      }`}
    >
      {label}
    </button>
  );
}
