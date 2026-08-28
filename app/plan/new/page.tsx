import { prisma } from "@/lib/prisma";
import { WeekPicker } from "./WeekPicker";

const MEAL_INCLUDE = {
  ingredients: {
    include: { substituteGroup: { include: { options: true } } },
  },
} as const;

// Finds next Monday..Friday (or this week's, if today is a weekday) as calendar dates,
// so we can look up any imported SchoolLunchDay entries for the coming week.
function upcomingWeekdays(): Date[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = today.getDay(); // 0=Sun..6=Sat
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default async function NewPlanPage() {
  const weekdayDates = upcomingWeekdays();

  const [dinners, breakfasts, lunches, fruits, familyMembers, schoolLunchDays] = await Promise.all([
    prisma.meal.findMany({
      // Birthday Dinner is a future feature (MVP-SPEC) that replaces the normal 5-slot
      // week entirely — those meals shouldn't show up in the regular weekly rotation.
      where: { mealType: "DINNER", isBirthdaySpecial: false },
      include: MEAL_INCLUDE,
      orderBy: { name: "asc" },
    }),
    prisma.meal.findMany({
      where: { mealType: "BREAKFAST" },
      include: MEAL_INCLUDE,
      orderBy: { name: "asc" },
    }),
    prisma.meal.findMany({
      where: { mealType: "LUNCH" },
      include: MEAL_INCLUDE,
      orderBy: { name: "asc" },
    }),
    prisma.meal.findMany({
      // Single-ingredient "meals" backing the weekly fresh-fruit checklist under Lunches.
      where: { mealType: "FRUIT" },
      orderBy: { name: "asc" },
    }),
    prisma.familyMember.findMany({ where: { memberType: "KID" }, orderBy: { sortOrder: "asc" } }),
    prisma.schoolLunchDay.findMany({
      where: { date: { in: weekdayDates } },
    }),
  ]);

  const kidNames = familyMembers.map((k) => k.name).filter(Boolean);

  const schoolLunchMenus: Record<number, string | undefined> = {};
  for (const day of schoolLunchDays) {
    const idx = weekdayDates.findIndex((d) => d.getTime() === new Date(day.date).getTime());
    if (idx !== -1) schoolLunchMenus[idx] = day.menu;
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-1">Plan This Week&apos;s Menu 🎉</h1>
      <p className="text-kitchen-ink/70 mb-6">
        Dinners, then breakfasts, then lunches — pick as a family and we&apos;ll build the
        shopping list for you.
      </p>
      <WeekPicker
        dinnerMeals={dinners}
        breakfastMeals={breakfasts}
        lunchMeals={lunches}
        fruitMeals={fruits}
        kidNames={kidNames}
        schoolLunchMenus={schoolLunchMenus}
      />
    </main>
  );
}
