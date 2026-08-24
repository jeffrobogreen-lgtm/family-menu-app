# Family Menu App — MVP Spec

## Weekly structure

**5 dinners/week**, filled via:
- 2 kid picks (one per kid)
- 2 parent picks (one per parent)
- 1 wildcard slot
- **Parent override** — a parent can replace any pick (including a kid's) before the week locks in
- **Parent suggestion** — a parent can drop in a manual, off-menu idea instead of choosing from the library

**3 breakfast picks/week**, chosen one at a time from the breakfast library, and **repeatable** — pop tarts or protein pancakes can be picked more than once in the same week. No "avoid repeats" logic applies to breakfasts (that logic is dinner-only, see "Repeat-meal scoring" under Flagged for later).

**5 lunch picks/week (Mon–Fri)**, one per school day. Each day is either "Eat at School" (pulls that day's cafeteria menu from `SchoolLunchDay` if it's been imported, shown for reference only — no ingredients go on the shopping list for that day) or a pick from the home-made lunch library (adds ingredients to the shopping list like any other meal). See "School lunch calendar import" below for the current state of pulling in the real cafeteria menu.

## Ingredient substitutions

- Curated, not open-ended. Each swappable ingredient carries a short, pre-approved list of stand-ins (e.g. broccoli → green beans, corn, carrots).
- The swap happens at pick-time in the picker UI — tap a substitute chip instead of the default.
- Shopping-list generation resolves to whichever substitute was actually chosen for that meal-instance, never the meal's default ingredient.

## Walmart integration — decided architecture (2026-08-24)

This app is a **Walmart companion**, not a Walmart client. There is no Walmart consumer API to build against (their developer APIs are for marketplace sellers, not a shopper's own account/cart/order-history), so the app itself stays entirely Walmart-agnostic — it never stores Walmart credentials, never calls a Walmart API, and never runs unattended against walmart.com.

The bridge to Walmart is a separate, **on-demand, human-supervised** step, done at most weekly (typically once, after the week's plan is locked in):
- The parent asks Claude (in a live session, Chrome extension connected) to send the current shopping list to their Walmart cart.
- Claude drives the parent's own already-logged-in Walmart browser tab — searches each shopping-list item and clicks "add to cart." This never involves entering a password; the parent authenticates themselves, same as any normal Walmart visit.
- Claude never clicks checkout/place-order and never touches payment details. Reviewing the cart and completing the actual purchase is always a manual step the parent does themselves, in the real Walmart app or site.
- This is intentionally not wired up as a standing/background job — it happens in a session the parent initiates and watches, which is also friendlier to Walmart's terms of service than unattended automation would be.

Given that, the app's own job is unchanged: produce a correct, editable shopping list from the week's picks. Nothing about the picker or review screen needs to know Walmart exists.

**Built so far**: once a week is locked in, the review screen shows a "Ready for Walmart" panel (`app/plan/[id]/review/WalmartExport.tsx`) that formats the final shopping list as clean plain text (one `qty unit name` line per item) and copies it to the clipboard. That's the "framework" — the app's half of the handoff. The actual cart-filling step described above (a live, human-supervised browser session reading down that list) is still done separately, not built into the app, by design.

Confirmed direction (not yet scheduled): yes, we do want to read Walmart order history eventually — both to seed real product names/brands/quantities into the meal library, and as one possible source for growing the meal library large enough that the recipe-filtering idea below is worth having. Still deliberately deferred until the core app is running and these other features are better understood.

## Recipe imports from Walmart's recipe library (2026-08-24)

Walmart runs a real, browsable recipe library at walmart.com/i/recipe-library — recipes from Walmart itself and partner brands (McCormick, SideChef, Jimmy Dean, Hellmann's, etc.), each with a real photo, ingredient list, and prep/cook time, filterable by meal type and traits like "Kid friendly" and "Quick and easy." There's no public API for it (the walmart.io developer portal is a separate business/API-partner program, not something worth setting up for a personal app — same reasoning as the cart-filling architecture above), and the page itself is JavaScript-rendered, so it can't be scraped by a plain fetch.

What works instead — and what we did for this round — is the same pattern as the Walmart cart-filling step: a live, on-demand, human-supervised Claude-in-Chrome session browses the recipe library, hand-picks recipes that fit (kid-friendly, quick, filling gaps in thin categories, adding variety), and pulls the name, a simplified ingredient list, and a direct link to Walmart's own hosted photo into `prisma/seed.ts`. This isn't wired into the app as a live/automatic feature — it's a manual enrichment pass, repeatable on request whenever the library needs a refresh, exactly like the cart-filling handoff never runs unattended.

**First pass (2026-08-24)** added 6 recipes this way: 2 breakfast (Cream Cheese Fruit Tortilla Pinwheels, Sausage and Egg Breakfast Burrito Bar), 2 lunch (Easy 2-Step Classic Ramen, Teriyaki Chicken Sliders), 2 dinner (Margherita English Muffin Pizzas, Juicy Garlic Burger with Mushrooms & Onions). Photos are direct links to Walmart's own CDN (not downloaded/re-hosted) — if Walmart ever changes or removes one, `MealPhoto`'s existing fallback just shows the plain placeholder tile, nothing breaks. Ingredient lists were simplified from Walmart's exact-SKU listings down to match this app's existing style.

**Second pass (2026-08-24)** did two more things in the same browsing session:

1. **Real photos for the original 16 meals.** The same recipe-library search was used to find a real Walmart photo that correlates to each of the original hand-illustrated meals (the ones seeded before Walmart imports started) — 13 of 16 got a real photo swapped in for their SVG illustration. The 3 that kept their SVG (Fruit Loops Cereal, Pop Tarts, PB&J Sandwich) simply had no good real-photo match in the library — searches only turned up creative spins (cereal French toast, a Doritos PB&J) rather than a plain shot of the actual thing, and a mismatched photo would be worse than the illustration. Each meal in `prisma/seed.ts` has a comment noting which Walmart recipe its photo came from, or why it kept its SVG.

2. **10 more dinners**, specifically requested: a hamburger/slider option (Cheesy Beef Slider Burgers), chicken drumsticks with no spice (Baked Lemon Herb Parmesan Chicken Drumsticks), three single-skillet meals (Creamy Herb Chicken Potato Skillet, One-Pan Beef and Pasta Skillet, Smoked Sausage Bean Potato Skillet), a crockpot option (Slow Cooker Chicken and Rice Casserole), plus variety picks (Ground Beef Corn Tacos, Pepperoni and Mozzarella Pizza, Hearty Baked Ziti with Meat Ragu, Crispy Cod Fish Sticks) to round out the dinner rotation. Same sourcing approach as the first pass — real Walmart-hosted photos, ingredient lists simplified to this app's style.

Running total: 16 recipes imported from Walmart's recipe library across both passes (6 + 10), plus 13 of the original meals now carrying real Walmart photos instead of illustrations.

## School lunch calendar import — current status (2026-08-24)

Live-importing Field Elementary's (Houston ISD) real cafeteria menu was attempted and did not succeed: the district's menu is published through JavaScript-rendered systems (Nutrislice / SchoolCafé), which can't be scraped by a plain page fetch, and no static/PDF calendar was found either. `prisma/seed-school-lunch.ts` seeds a few clearly-labeled **placeholder** `SchoolLunchDay` entries (obviously fake menu text) so the "Eat at School" option in the lunch picker has something real to display and the feature can be exercised end-to-end. A real import — either a weekly manual copy-paste, or a browser-automation session that can execute JavaScript — is still open.

## Flagged for later (schema supports it now, feature comes later)

- **Birthday Dinner slot** — "anything goes," no tags/variety constraints, replaces the normal 5-slot structure for that week. `Meal.isBirthdaySpecial` exists in the schema now so this doesn't require a data-model rewrite when we build it.

- **Repeat-meal scoring** (refines the "avoid repeat dinners" idea from roadmap step 7 into something concrete): if the same dinner is picked in 2+ consecutive weeks, flag it in the picker and/or parent review with a lightweight indicator, and surface an alternative recommendation instead of silently allowing it. This is a query over data we already have — `PlanSlot.mealId` across `WeeklyPlan`s ordered by `weekStart` — so no new model is needed, just a scoring/lookback layer read at picker- and review-time. The open design question is what "2 weeks in a row" should mean exactly (consecutive weeks only, or also "3 of the last 4"), and whether the threshold should be configurable per-household.

- **Family member profiles — built (2026-08-24)**: a real `FamilyMember` model now exists (kids get real names used throughout the picker instead of "Kid 1"/"Kid 2"; parents share one combined "Parents Profile" screen but still get individual rows so both parents' info can be recorded separately). Manage them at `/family`. Each member has freeform "fun fact" fields — favorite meal to eat, favorite meal to help cook, after-dinner chore, favorite salad dressing — captured for now just for the family to enjoy filling out together, not yet wired into any logic.

- **Preference-based conflict flagging (not yet built)**: the "Tommy loves chicken strips but not sushi, Gracie loves sushi — flag it at parent review" idea needs a structured like/dislike signal per family member against meals (and/or tags — e.g. "seafood", "spicy"), not just the freeform fun-fact text captured today. That's a further schema change (a member ↔ meal or member ↔ tag preference relation) layered on top of the `FamilyMember` model that now exists, worth designing deliberately once it's clear what "conflict" should mean in practice.

- **Preference-based recipe filtering/recommendation**: once family-member preferences exist, use them to pre-filter and rank a larger recipe/meal library so the picker (or a future "browse recipes" view) surfaces only things the relevant family members are likely to enjoy — directly addressing "I have to wade through hundreds of recipes to find ones the whole family will like." Likely a simple filter setup (a handful of preference flags set during profile build — e.g. proteins to avoid, spice tolerance, "kid-friendly only") rather than an open-ended search, refined later by what actually gets picked vs. skipped. Depends on both family profiles (above) and having a meal library big enough to need filtering in the first place (see Walmart order-history import above).

## Explicitly out of scope

- Multi-household / multi-family accounts — single household only
