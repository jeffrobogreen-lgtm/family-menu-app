import { prisma } from "@/lib/prisma";

type SlotWithMeal = {
  meal:
    | {
        ingredients: {
          id: string;
          name: string;
          quantity: number;
          unit: string;
          optional: boolean;
        }[];
      }
    | null;
  chosenSubstitutes: string | null;
};

// Resolves one slot's meal into the ingredient lines that should count toward the
// shopping list: applies whatever substitute was chosen (falling back to the meal's
// default), and skips optional add-ons that were never added.
function resolveSlotIngredients(slot: SlotWithMeal) {
  if (!slot.meal) return [];

  const chosen: Record<string, string> = slot.chosenSubstitutes
    ? JSON.parse(slot.chosenSubstitutes)
    : {};

  const lines: { name: string; quantity: number; unit: string }[] = [];

  for (const ingredient of slot.meal.ingredients) {
    const chosenName = chosen[ingredient.id];

    // Optional items (e.g. "add toast?") only count if something was actually chosen for them.
    if (ingredient.optional && chosenName === undefined) continue;

    lines.push({
      name: chosenName ?? ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
  }

  return lines;
}

type Line = { name: string; quantity: number; unit: string };

function addLine(totals: Map<string, Line>, line: Line) {
  const key = `${line.name.toLowerCase()}::${line.unit.toLowerCase()}`;
  const existing = totals.get(key);
  if (existing) {
    existing.quantity += line.quantity;
  } else {
    totals.set(key, { ...line });
  }
}

export async function consolidateShoppingList(weeklyPlanId: string) {
  const plan = await prisma.weeklyPlan.findUniqueOrThrow({
    where: { id: weeklyPlanId },
    include: {
      slots: {
        include: { meal: { include: { ingredients: true } } },
      },
    },
  });

  // Dinners, breakfasts, and lunches are all just PlanSlots now — each resolves the
  // same way (default ingredients, or whatever substitute was chosen). A lunch slot
  // marked "eating at school" has no meal attached, so resolveSlotIngredients already
  // returns nothing for it via the `!slot.meal` check — nothing extra needed here.
  const totals = new Map<string, Line>();

  for (const slot of plan.slots) {
    for (const line of resolveSlotIngredients(slot)) {
      addLine(totals, line);
    }
  }

  // Replace previously auto-generated lines with the fresh totals, but leave any
  // line a parent has already hand-edited alone.
  await prisma.shoppingListItem.deleteMany({
    where: { weeklyPlanId, edited: false },
  });

  await prisma.shoppingListItem.createMany({
    data: Array.from(totals.values()).map((line) => ({
      weeklyPlanId,
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
    })),
  });
}
