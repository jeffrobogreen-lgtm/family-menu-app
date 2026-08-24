import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const recentPlans = await prisma.weeklyPlan.findMany({
    orderBy: { weekStart: "desc" },
    take: 5,
  });

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🍽️👨‍👩‍👧‍👦</div>
        <h1 className="font-display text-4xl font-bold mb-2">Family Menu Night</h1>
        <p className="text-kitchen-ink/70 max-w-sm mx-auto">
          Five minutes together, one week of dinners, breakfasts &amp; lunches sorted — and
          a shopping list that writes itself.
        </p>
      </div>

      <div className="grid gap-4 mb-10">
        <Link
          href="/plan/new"
          className="group rounded-card bg-kitchen-tomato text-white p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div>
            <div className="font-display text-xl font-bold mb-1">Plan This Week&apos;s Menu</div>
            <div className="text-white/80 text-sm">Dinners → breakfasts → lunches, family-style</div>
          </div>
          <span className="text-3xl transition-transform group-hover:translate-x-1">→</span>
        </Link>

        <Link
          href="/family"
          className="group rounded-card bg-white border-2 border-kitchen-ink/10 p-6 flex items-center justify-between hover:border-kitchen-mustard transition-colors"
        >
          <div>
            <div className="font-display text-xl font-bold mb-1">Family Profiles 👪</div>
            <div className="text-kitchen-ink/60 text-sm">Names, favorites &amp; fun facts</div>
          </div>
          <span className="text-3xl text-kitchen-ink/30 transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>

      {recentPlans.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold mb-3 text-kitchen-ink/80">
            Recent Weeks
          </h2>
          <ul className="space-y-2">
            {recentPlans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/plan/${plan.id}/review`}
                  className="flex items-center justify-between rounded-card bg-white border-2 border-kitchen-ink/10 px-4 py-3 hover:border-kitchen-sage transition-colors"
                >
                  <span className="font-medium">
                    Week of{" "}
                    {plan.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-sm text-kitchen-ink/50">
                    {plan.confirmedAt ? "Locked in ✓" : "In progress"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
