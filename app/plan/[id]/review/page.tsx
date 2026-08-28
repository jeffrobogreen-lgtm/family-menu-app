import { prisma } from "@/lib/prisma";
import { ShoppingListEditor } from "./ShoppingListEditor";
import { OverrideControl } from "./OverrideControl";
import { WalmartExport } from "./WalmartExport";
import { MealPhoto } from "@/app/components/MealPhoto";
import { confirmWeeklyPlan } from "@/app/actions/planActions";
import { redirect } from "next/navigation";
import Link from "next/link";

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan, dinnerMeals, breakfastMeals, lunchMeals] = await Promise.all([
    // findUnique (not findUniqueOrThrow) — a bookmarked/open review URL can outlive its
    // WeeklyPlan (e.g. `npm run seed` wipes all WeeklyPlans on purpose so re-seeding
    // doesn't leave stale plans around). We want a friendly message for that, not a crash.
    prisma.weeklyPlan.findUnique({
      where: { id },
      include: {
        slots: { include: { meal: true } },
        shoppingList: { orderBy: { name: "asc" } },
      },
    }),
    // Candidates for the parent-override control below — same "no birthday meals in
    // normal rotation" rule as the picker in app/plan/new/page.tsx. Each slot type gets
    // its own candidate library so a dinner slot only offers dinners, etc.
    prisma.meal.findMany({
      where: { mealType: "DINNER", isBirthdaySpecial: false },
      orderBy: { name: "asc" },
    }),
    prisma.meal.findMany({ where: { mealType: "BREAKFAST" }, orderBy: { name: "asc" } }),
    prisma.meal.findMany({ where: { mealType: "LUNCH" }, orderBy: { name: "asc" } }),
  ]);

  if (!plan) {
    return (
      <main className="max-w-xl mx-auto px-4 py-8 text-center">
        <div className="text-4xl mb-3">🤔</div>
        <h1 className="font-display text-2xl font-bold mb-2">Can&apos;t find that week</h1>
        <p className="text-kitchen-ink/70 mb-6">
          This link points to a weekly plan that no longer exists — most likely because the
          meal library was re-seeded since it was created (that resets weekly plans on
          purpose so re-seeding doesn&apos;t leave stale data around).
        </p>
        <Link
          href="/plan/new"
          className="inline-block px-6 py-3 rounded-full bg-kitchen-tomato text-white font-display font-semibold"
        >
          Plan This Week&apos;s Menu →
        </Link>
      </main>
    );
  }

  // Captured as a plain string (not `plan.id` directly) so this server-action closure
  // doesn't reference `plan` itself — TypeScript can't carry the `if (!plan) return` null
  // check above into a nested function body, since `plan` could in principle be
  // reassigned before the closure runs. `planId` is a primitive, so there's nothing left
  // to narrow.
  const planId = plan.id;

  async function confirm() {
    "use server";
    await confirmWeeklyPlan(planId);
    redirect(`/plan/${planId}/review`);
  }

  const dinnerSlots = plan.slots.filter(
    (s) => s.slotType !== "BREAKFAST" && s.slotType !== "LUNCH" && s.slotType !== "FRUIT",
  );
  const breakfastSlots = plan.slots.filter((s) => s.slotType === "BREAKFAST");
  // Sorted kid-major (matching the picker's order) so each kid's five days stay grouped.
  const lunchSlots = plan.slots
    .filter((s) => s.slotType === "LUNCH")
    .sort((a, b) => {
      const byKid = (a.pickedBy ?? "").localeCompare(b.pickedBy ?? "");
      return byKid !== 0 ? byKid : (a.weekday ?? 0) - (b.weekday ?? 0);
    });
  const fruitSlots = plan.slots.filter((s) => s.slotType === "FRUIT");

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-1">This Week&apos;s Picks 🎉</h1>
      <p className="text-kitchen-ink/70 mb-6">
        {plan.confirmedAt
          ? "Locked in — enjoy the week!"
          : "Double-check the list below, then lock it in."}
      </p>

      <h2 className="font-display text-xl font-semibold mb-3">Dinners 🍝</h2>
      <ul className="space-y-2 mb-8">
        {dinnerSlots.map((slot) => (
          <li key={slot.id} className="rounded-card bg-white border-2 border-kitchen-ink/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-kitchen-ink/50">{slot.pickedBy}</span>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold">{slot.meal?.name}</span>
                <MealPhoto
                  src={slot.meal?.photoUrl}
                  alt={slot.meal?.name ?? "Meal"}
                  className="h-12 w-12 rounded-lg flex-shrink-0"
                />
              </div>
            </div>
            {!plan.confirmedAt && (
              <OverrideControl
                weeklyPlanId={plan.id}
                slotId={slot.id}
                currentMealId={slot.mealId}
                meals={dinnerMeals}
              />
            )}
          </li>
        ))}
      </ul>

      <h2 className="font-display text-xl font-semibold mb-3">Breakfasts 🥞</h2>
      <ul className="space-y-2 mb-8">
        {breakfastSlots.map((slot) => (
          <li key={slot.id} className="rounded-card bg-white border-2 border-kitchen-ink/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-kitchen-ink/50">{slot.pickedBy}</span>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold">{slot.meal?.name}</span>
                <MealPhoto
                  src={slot.meal?.photoUrl}
                  alt={slot.meal?.name ?? "Meal"}
                  className="h-12 w-12 rounded-lg flex-shrink-0"
                />
              </div>
            </div>
            {!plan.confirmedAt && (
              <OverrideControl
                weeklyPlanId={plan.id}
                slotId={slot.id}
                currentMealId={slot.mealId}
                meals={breakfastMeals}
              />
            )}
          </li>
        ))}
      </ul>

      <h2 className="font-display text-xl font-semibold mb-3">Lunches 🥪</h2>
      <ul className="space-y-2 mb-8">
        {lunchSlots.map((slot) => (
          <li key={slot.id} className="rounded-card bg-white border-2 border-kitchen-ink/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-kitchen-ink/50">
                {slot.weekday !== null && slot.weekday !== undefined
                  ? `${slot.pickedBy} — ${WEEKDAY_LABELS[slot.weekday]}`
                  : slot.pickedBy}
              </span>
              {slot.eatingAtSchool ? (
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold">Eat at School</span>
                  <span className="text-xl">🍽️</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold">{slot.meal?.name}</span>
                  <MealPhoto
                    src={slot.meal?.photoUrl}
                    alt={slot.meal?.name ?? "Meal"}
                    className="h-12 w-12 rounded-lg flex-shrink-0"
                  />
                </div>
              )}
            </div>
            {!plan.confirmedAt && (
              <OverrideControl
                weeklyPlanId={plan.id}
                slotId={slot.id}
                currentMealId={slot.mealId}
                meals={lunchMeals}
                showEatAtSchool
                currentlyEatingAtSchool={slot.eatingAtSchool}
              />
            )}
          </li>
        ))}
      </ul>

      {fruitSlots.length > 0 && (
        <>
          <h2 className="font-display text-xl font-semibold mb-3">Fresh Fruit This Week 🍓</h2>
          <ul className="flex flex-wrap gap-2 mb-8">
            {fruitSlots.map((slot) => (
              <li
                key={slot.id}
                className="rounded-full bg-white border-2 border-kitchen-ink/10 px-4 py-2 font-display font-semibold text-sm"
              >
                {slot.meal?.name}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="font-display text-xl font-semibold mb-3">Shopping List 🧾</h2>
      <ShoppingListEditor items={plan.shoppingList} locked={!!plan.confirmedAt} />

      {plan.confirmedAt && <WalmartExport items={plan.shoppingList} />}

      {!plan.confirmedAt && (
        <form action={confirm} className="mt-6">
          <button className="w-full px-6 py-3 rounded-full bg-kitchen-sage text-white font-display font-semibold">
            Looks Good — Lock In the Week 🎉
          </button>
        </form>
      )}
    </main>
  );
}
