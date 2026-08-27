# Family Menu App

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
   (this also runs `prisma generate` automatically via the `postinstall` script)

2. Copy the env file and fill in `DATABASE_URL` with your Prisma Postgres connection string
   (see "Database" below — as of 2026-08-25 this app runs on Postgres, not local SQLite):
   ```
   cp .env.example .env
   ```

3. Push the schema to your database (creates/updates all tables from `prisma/schema.prisma`).
   This project uses `prisma db push` rather than tracked migrations — see "Database" below
   for why, and re-run this any time the schema changes:
   ```
   npm run db:push
   ```

4. Seed the meal library (safe to re-run any time — it resets meal/substitution data first):
   ```
   npm run seed
   ```

5. Seed a few placeholder school-lunch-calendar entries (see "School lunches" below for why
   these are placeholders, not the real Field Elementary menu):
   ```
   npm run seed:school-lunch
   ```

6. Start the dev server:
   ```
   npm run dev
   ```

7. Optional but recommended before your first real family test: go to `/family` and enter
   your kids' real names (and anything fun you want in their profiles) — the picker uses
   whatever's there, falling back to "Kid 1"/"Kid 2" if the list is empty.

## Project structure

- `MVP-SPEC.md` — the locked-in scope for this build (read this first)
- `prisma/schema.prisma` — data model: meals, ingredients, substitute groups, weekly plan slots, family members, school lunch calendar
- `prisma/seed.ts` — starter meal data: 17 dinners, 7 breakfasts, 8 lunches, 10 substitute groups (16 of these are real recipes pulled from Walmart's recipe library, see below)
- `prisma/seed-school-lunch.ts` — placeholder cafeteria-menu entries for the upcoming week (`npm run seed:school-lunch`)
- `lib/consolidateShoppingList.ts` — resolves picks + substitutions into a shopping list
- `app/page.tsx` — home screen: jump into this week's plan, manage family profiles, see recent weeks
- `app/family/` — family profiles: kid names + fun facts, parents profile
- `app/plan/new/` — the family picker: `WeekPicker` orchestrates `DinnerPicker` → `BreakfastPicker` → `LunchPicker`
- `app/plan/[id]/review/` — parent review screen: picks (by meal type), editable shopping list, lock-in, Walmart export
- `public/meal-photos/` — kid-friendly SVG illustrations for every meal (see that folder's README)

## Database

This app runs on Postgres via Vercel's [Prisma Postgres](https://vercel.com/marketplace/prisma)
marketplace database, connected through Prisma 7's driver-adapter model (`@prisma/adapter-pg` — the
standard node-postgres driver adapter, since Prisma Postgres hands out a plain `postgres://`
connection string — see `lib/prisma.ts` and `prisma/seed.ts`). It was originally built against a
local SQLite file for convenience during early development, then switched over on 2026-08-25 so it
could run on Vercel — a serverless function can't rely on a file on disk the way a long-running local
dev server can, since there's no shared, persistent filesystem across invocations. (The switch was
briefly coded against Neon's serverless driver instead — corrected on 2026-08-26 once the actual
attached database turned out to be Vercel's own Prisma Postgres product, not Neon.)

Attaching the database in Vercel sets three environment variables — `DATABASE_URL`, `POSTGRES_URL`,
and `PRISMA_DATABASE_URL` — all pointing at the same database. This app only reads `DATABASE_URL`.

**Schema sync uses `npm run db:push` (`prisma db push`), not tracked migrations.** For a
single-developer personal project without a migration history to protect, `db push` is simpler and
safer to hand-maintain than committing migration SQL that's never been run against a live database.
If this ever grows into something with multiple contributors or environments where you want a
reviewable migration history, switch to `npm run prisma:migrate` (`prisma migrate dev`) instead —
the schema and Prisma config already support it, you'd just start generating migration files from
here on.

**Local dev and production point at the same database** by default (whatever `DATABASE_URL` you put
in your `.env`). For a personal single-household app that's a reasonable simplification — but if you
ever want to test schema changes without touching real family data, you can create a second Prisma
Postgres database (in Vercel's Storage tab, or at [console.prisma.io](https://console.prisma.io)) and
point your local `.env` at that one's connection string instead of production's.

## Status

**Confirmed running locally** (2026-08-24) on Next.js 16 / Tailwind v4 / Prisma 7 — all three shipped breaking changes since this was first written; see the migration notes at the bottom of this file if you're setting this up somewhere new.

Done:
- **Full weekly picker** — dinners (5 slots: 2 kid picks using real names from `/family`, 2 parent picks, 1 wildcard, with substitution chips), breakfasts (pick any 3, repeats allowed), lunches (5 weekdays, each "Eat at School" or a home-made pick) — one connected flow via `WeekPicker`.
- **Family profiles** (`/family`) — enter real kid names (used throughout the picker instead of "Kid 1"/"Kid 2"), plus optional fun facts per kid (favorite meal to eat, favorite meal to help cook, after-dinner chore, favorite salad dressing) and a combined Parents Profile screen.
- **School lunch calendar** — `SchoolLunchDay` model + lunch-picker integration; shows that day's cafeteria menu when "Eat at School" is available. **Currently seeded with clearly-labeled placeholder data** — a live import of Field Elementary's (Houston ISD) real menu wasn't achievable with the tools available (see MVP-SPEC.md for details); swap in real entries by hand or revisit automating it later.
- **Parent override** — every slot on the review screen (dinners, breakfasts, lunches) has a "Change this pick" control offering the right meal library for that slot type, plus an "Eat at School" toggle for lunches.
- **Meal photos** — 13 of the original meals now show a real photo pulled from Walmart's recipe library (see below); the remaining 3 (Fruit Loops Cereal, Pop Tarts, PB&J Sandwich) plus any future additions keep the hand-drawn SVG illustrations in the app's own color palette — see `public/meal-photos/README.md`.
- **Shopping list is now correct** — dinners, breakfasts, and lunches (excluding "eat at school" days) all resolve into the list based on what was actually picked, including chosen substitutions.
- **Walmart export framework** — once a week is locked in, the review screen shows a "Ready for Walmart" panel that copies the shopping list as clean plain text, ready to hand to a separate live browser session (see MVP-SPEC.md's Walmart section for why that stays a separate, human-supervised step).
- **Design pass** — home screen, shared nav, playful copy and emoji throughout, subtle background texture and motion, meant to feel like a fun family activity rather than a chore.
- **16 recipes imported from Walmart's recipe library across two rounds** — a live, human-supervised browsing session pulled in real recipes with real Walmart-hosted photos and ingredient lists: round one added 6 (2 breakfast, 2 lunch, 2 dinner) filling out the thinner lunch/breakfast libraries; round two added 10 more dinners per a specific request — a slider/burger option, non-spicy chicken drumsticks, 3 single-skillet meals, a crockpot casserole, plus tacos/pizza/baked-ziti/fish-stick variety. The same round also found real Walmart photos for 13 of the 16 original hand-illustrated meals. See MVP-SPEC.md's "Recipe imports from Walmart's recipe library" section — this can be repeated any time you want more recipes, just ask.
- `npm run seed` is safe to re-run any time (it resets meal/substitution data first); `npm run seed:school-lunch` upserts by date so it won't clobber real data later.

Still not built (see MVP-SPEC.md "Flagged for later" for the full list):
- Repeat-meal scoring (flagging a dinner picked 2+ weeks in a row).
- Preference-based conflict flagging ("Tommy doesn't like sushi") — the `FamilyMember` fun-fact fields exist but aren't wired into any picker logic yet.
- Preference-based recipe filtering/recommendation.
- Birthday Dinner slot.
- A real (non-placeholder) school lunch calendar import.

Architecture decision (see `MVP-SPEC.md`): this app stays a Walmart-agnostic shopping-list generator. Getting the list into a Walmart cart is a separate, on-demand, human-supervised browser-automation step (weekly at most) — not a feature built into this codebase; the app's job ends at the "Ready for Walmart" copy button.

## Prisma 7 / Tailwind v4 / Next 16 migration notes

If you ever rebuild `node_modules` from scratch and hit errors again, these are the three fixes already in place — nothing you need to redo, just context for why the code looks the way it does:
- **Prisma 7** moved the datasource connection out of `schema.prisma` into `prisma.config.ts`, and dropped the old built-in query engine in favor of an explicit driver adapter (`@prisma/adapter-pg` here, the standard node-postgres driver, talking to Vercel's Prisma Postgres database — see "Database" above for why it's Postgres and not SQLite). See `prisma.config.ts`, `lib/prisma.ts`, and `prisma/seed.ts`. `npm install` now runs `prisma generate` automatically via the `postinstall` script, so you shouldn't need to run it by hand.
- **Tailwind v4** replaced the old `@tailwind` directives and `tailwindcss`+`autoprefixer` PostCSS setup with `@import "tailwindcss"` and the `@tailwindcss/postcss` plugin. `tailwind.config.ts` still works via the `@config` directive in `app/globals.css` — no need to convert to CSS-based theming.
- **Next.js 16** made route `params` a `Promise` — see `app/plan/[id]/review/page.tsx`.
