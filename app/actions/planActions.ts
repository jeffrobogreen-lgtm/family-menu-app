"use server";

import { prisma } from "@/lib/prisma";
import { consolidateShoppingList } from "@/lib/consolidateShoppingList";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type DinnerPick = {
  slotType: "KID_PICK" | "PARENT_PICK" | "WILDCARD";
  pickedBy: string;
  mealId: string;
  chosenSubstitutes: Record<string, string>;
};

type BreakfastPick = {
  pickedBy: string; // e.g. "Breakfast 1"
  mealId: string;
};

type LunchPick = {
  weekday: number; // 0=Mon..4=Fri
  pickedBy: string; // e.g. "Monday"
  eatingAtSchool: boolean;
  mealId: string | null; // null when eatingAtSchool
};

export async function createWeeklyPlan(
  weekStart: string,
  dinners: DinnerPick[],
  breakfasts: BreakfastPick[],
  lunches: LunchPick[],
) {
  const plan = await prisma.weeklyPlan.create({
    data: {
      weekStart: new Date(weekStart),
      slots: {
        create: [
          ...dinners.map((pick) => ({
            slotType: pick.slotType,
            pickedBy: pick.pickedBy,
            mealId: pick.mealId,
            chosenSubstitutes: JSON.stringify(pick.chosenSubstitutes),
          })),
          ...breakfasts.map((pick) => ({
            slotType: "BREAKFAST" as const,
            pickedBy: pick.pickedBy,
            mealId: pick.mealId,
          })),
          ...lunches.map((pick) => ({
            slotType: "LUNCH" as const,
            pickedBy: pick.pickedBy,
            mealId: pick.eatingAtSchool ? null : pick.mealId,
            eatingAtSchool: pick.eatingAtSchool,
            weekday: pick.weekday,
          })),
        ],
      },
    },
  });

  await consolidateShoppingList(plan.id);

  redirect(`/plan/${plan.id}/review`);
}

// Lets a parent swap out an entire slot's meal from the review screen — the
// "parent override" capability from the spec. Regenerates the shopping list
// afterward since the ingredient set has changed. `eatingAtSchool` only applies
// to LUNCH slots — pass true (with newMealId null) to switch that day to cafeteria.
export async function overrideSlot(
  weeklyPlanId: string,
  slotId: string,
  newMealId: string | null,
  eatingAtSchool = false,
) {
  await prisma.planSlot.update({
    where: { id: slotId },
    data: { mealId: newMealId, overriddenByParent: true, chosenSubstitutes: null, eatingAtSchool },
  });

  await consolidateShoppingList(weeklyPlanId);
  revalidatePath(`/plan/${weeklyPlanId}/review`);
}

export async function updateShoppingListItem(itemId: string, quantity: number, unit: string) {
  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { quantity, unit, edited: true },
  });
}

export async function confirmWeeklyPlan(weeklyPlanId: string) {
  await prisma.weeklyPlan.update({
    where: { id: weeklyPlanId },
    data: { confirmedAt: new Date() },
  });
}
