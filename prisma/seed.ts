import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7's Rust-free client needs an explicit driver adapter, same as lib/prisma.ts —
// Postgres via Vercel's "Prisma Postgres" product (@prisma/adapter-pg, corrected 2026-08-26
// from an earlier, wrong assumption that this was a Neon database — see schema.prisma's
// datasource comment).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Wipe existing data first so `npm run seed` is safe to re-run (e.g. after adding
  // photoUrls or editing meal data) without creating duplicate meals/groups. Note this
  // does clear any WeeklyPlans created while testing — expected for a seed script, but
  // worth knowing before re-running it against a week you actually want to keep.
  await prisma.shoppingListItem.deleteMany();
  await prisma.planSlot.deleteMany();
  await prisma.weeklyPlan.deleteMany();
  await prisma.mealIngredient.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.substituteOption.deleteMany();
  await prisma.substituteGroup.deleteMany();

  // --- Reusable substitution groups ---

  // Updated 2026-08-27: every dinner's vegetable and starch side now draws from these
  // same two shared groups (see "all sides/vegetables selectable for any dinner" below),
  // instead of only the handful of meals that happened to be wired up to a group before.
  // Also added "corn" and "carrots" to vegetable_side — MVP-SPEC's own substitution
  // example ("broccoli → green beans, corn, carrots") named them, but they'd never
  // actually been added as real options until now.
  const vegetableSide = await prisma.substituteGroup.create({
    data: {
      name: "vegetable_side",
      options: {
        create: [
          { name: "green beans" },
          { name: "broccoli" },
          { name: "salad" },
          { name: "edamame" },
          { name: "corn" },
          { name: "carrots" },
          { name: "bell peppers" },
        ],
      },
    },
  });

  // Merged starch_potato + starch_rice into one starch_side group so any dinner's starch
  // side can be swapped for any of these, not just whichever half (potato-ish vs. rice-ish)
  // it originally shipped with. Also added "french fries" as a selectable side.
  const starchSide = await prisma.substituteGroup.create({
    data: {
      name: "starch_side",
      options: {
        create: [
          { name: "mashed potatoes" },
          { name: "baked potato" },
          { name: "mac and cheese" },
          { name: "fried rice" },
          { name: "sticky rice" },
          { name: "french fries" },
        ],
      },
    },
  });

  // Pizza topping choices — see the "Pizza" dinner below, which now starts as plain
  // cheese with these as optional add-on toppings instead of always including pepperoni.
  const pizzaTopping = await prisma.substituteGroup.create({
    data: {
      name: "pizza_topping",
      options: {
        create: [
          { name: "pepperoni" },
          { name: "ham" },
          { name: "sausage" },
          { name: "pineapple" },
          { name: "other" },
        ],
      },
    },
  });

  const sandwichSwap = await prisma.substituteGroup.create({
    data: {
      name: "sandwich_swap",
      options: {
        create: [{ name: "grilled cheese" }, { name: "PB and honey" }],
      },
    },
  });

  const soupSwap = await prisma.substituteGroup.create({
    data: {
      name: "soup_swap",
      options: {
        create: [{ name: "noodle soup" }, { name: "creamy tomato soup" }],
      },
    },
  });

  const cerealSwap = await prisma.substituteGroup.create({
    data: {
      name: "cereal_swap",
      options: {
        create: [
          { name: "Fruit Loops" },
          { name: "Cinnamon Toast Crunch" },
          { name: "Oh's" },
        ],
      },
    },
  });

  const proteinPancakeSwap = await prisma.substituteGroup.create({
    data: {
      name: "protein_pancake_swap",
      options: {
        create: [
          { name: "frozen protein pancakes" },
          { name: "frozen protein waffles" },
          { name: "french toast sticks" },
        ],
      },
    },
  });

  const breakfastMeatSwap = await prisma.substituteGroup.create({
    data: {
      name: "breakfast_meat_swap",
      options: {
        create: [{ name: "sausage" }, { name: "bacon" }],
      },
    },
  });

  const breakfastBreadAddon = await prisma.substituteGroup.create({
    data: {
      name: "breakfast_bread_addon",
      options: {
        create: [{ name: "toast" }, { name: "croissant" }],
      },
    },
  });

  // --- Dinners ---

  await prisma.meal.create({
    data: {
      name: "Chicken Strips, Mashed Potatoes & Green Beans",
      mealType: "DINNER",
      tags: "kid-favorite",
      // Real photo from Walmart's recipe library ("Fried Chicken Strips"), added 2026-08-24 —
      // see MVP-SPEC.md's "Recipe imports from Walmart's recipe library" section.
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-3d5d/k2-_ee8a486c-25d1-41db-8f53-111a3e4d4923.v1.jpg",
      ingredients: {
        create: [
          { name: "chicken strips", quantity: 1, unit: "lb", role: "protein", swappable: false },
          {
            name: "mashed potatoes",
            quantity: 2,
            unit: "cup",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
          {
            name: "green beans",
            quantity: 2,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Teriyaki Chicken & Fried Rice with Edamame",
      mealType: "DINNER",
      tags: "kid-favorite",
      // Real photo from Walmart's recipe library ("Teriyaki Chicken and Rice Skillet").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-f5a0/k2-_9f9fc151-8807-4036-93ff-4bd6399299b5.v1.jpg",
      ingredients: {
        create: [
          { name: "teriyaki chicken", quantity: 1, unit: "lb", role: "protein", swappable: false },
          {
            name: "fried rice",
            quantity: 2,
            unit: "cup",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
          {
            name: "edamame",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Grilled Cheese & Noodle Soup",
      mealType: "DINNER",
      tags: "quick",
      // Real photo from Walmart's recipe library ("Roasted tomato soup and grilled cheese",
      // Tasty) — closest real match to this combo (tomato, not noodle, soup — still the same
      // "dip your grilled cheese in soup" idea).
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-c54d/k2-_ddd16cd4-bce6-445f-9396-b9539bbf3438.v1.jpg",
      ingredients: {
        create: [
          {
            name: "grilled cheese",
            quantity: 1,
            unit: "each",
            role: "sandwich",
            swappable: true,
            substituteGroupId: sandwichSwap.id,
          },
          {
            name: "noodle soup",
            quantity: 2,
            unit: "cup",
            role: "soup",
            swappable: true,
            substituteGroupId: soupSwap.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Steak, Broccoli & Baked Potato",
      mealType: "DINNER",
      tags: "",
      // Real photo from Walmart's recipe library ("Steak and Potato Foil Bake").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-3fc5/k2-_179925af-2d9b-473a-b068-00b8bd450c24.v1.jpg",
      ingredients: {
        create: [
          { name: "steak", quantity: 1, unit: "lb", role: "protein", swappable: false },
          {
            name: "broccoli",
            quantity: 2,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id, // same group as meal 1 — "sub previous vegetable options"
          },
          {
            name: "baked potato",
            quantity: 1,
            unit: "each",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Ham & Pea Noodles with Salad",
      mealType: "DINNER",
      tags: "",
      // Real photo from Walmart's recipe library ("Ham Noodle Casserole").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-5567/k2-_e2e69f58-6ff7-4dc5-85c5-169bbf753d67.v1.jpg",
      ingredients: {
        create: [
          { name: "ham and pea noodles", quantity: 2, unit: "cup", role: "main", swappable: false },
          {
            name: "salad",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
          },
        ],
      },
    },
  });

  // --- Breakfasts ---

  await prisma.meal.create({
    data: {
      name: "Fruit Loops Cereal",
      mealType: "BREAKFAST",
      tags: "",
      repeatable: true,
      // Kept the SVG illustration — searched Walmart's recipe library (2026-08-24) and
      // found no real photo that's actually a bowl of this cereal (just cereal-adjacent
      // recipes like French toast or wreaths), so a mismatched photo would be worse than
      // the illustration.
      photoUrl: "/meal-photos/fruit-loops.svg",
      ingredients: {
        create: [
          {
            name: "Fruit Loops",
            quantity: 1,
            unit: "box",
            role: "cereal",
            swappable: true,
            substituteGroupId: cerealSwap.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Pop Tarts",
      mealType: "BREAKFAST",
      tags: "",
      repeatable: true,
      // Kept the SVG illustration — same reasoning as Fruit Loops above, no real photo of
      // an actual toaster pastry turned up in the recipe library search.
      photoUrl: "/meal-photos/pop-tarts.svg",
      ingredients: {
        create: [
          { name: "Pop Tarts", quantity: 1, unit: "box", role: "pastry", swappable: false },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Croissants (Store-Bought)",
      mealType: "BREAKFAST",
      tags: "",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Buttery Croissant Rolls").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-3b99/k2-_ae235294-f1ee-471a-9b92-6e78309ccf58.v1.jpg",
      ingredients: {
        create: [
          { name: "large croissants", quantity: 1, unit: "pack", role: "pastry", swappable: false },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Frozen Protein Pancakes",
      mealType: "BREAKFAST",
      tags: "",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Blueberry Protein Pancakes").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-7d4b/k2-_5f61d70c-43d6-4d9a-b483-36e753597de0.v1.jpg",
      ingredients: {
        create: [
          {
            name: "frozen protein pancakes",
            quantity: 1,
            unit: "box",
            role: "pancake",
            swappable: true,
            substituteGroupId: proteinPancakeSwap.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Eggs & Sausage",
      mealType: "BREAKFAST",
      tags: "",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Sausage and Egg Skillet").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-1336/k2-_e70a1269-de53-49ee-8674-58ac6176df22.v1.jpg",
      ingredients: {
        create: [
          { name: "eggs", quantity: 6, unit: "each", role: "protein", swappable: false },
          {
            name: "sausage",
            quantity: 1,
            unit: "lb",
            role: "protein",
            swappable: true,
            substituteGroupId: breakfastMeatSwap.id,
          },
          {
            name: "toast",
            quantity: 1,
            unit: "each",
            role: "bread_addon",
            swappable: true,
            optional: true,
            substituteGroupId: breakfastBreadAddon.id,
          },
        ],
      },
    },
  });

  // --- Lunches (home-made library — separate from the school cafeteria calendar,
  // see SchoolLunchDay / prisma/seed-school-lunch.ts) ---

  const lunchSandwichSwap = await prisma.substituteGroup.create({
    data: {
      name: "lunch_sandwich_swap",
      options: {
        create: [{ name: "PB and jelly" }, { name: "turkey and cheese" }, { name: "ham and cheese" }],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "PB&J Sandwich",
      mealType: "LUNCH",
      tags: "kid-favorite,quick",
      repeatable: true,
      // Kept the SVG illustration — Walmart's recipe library only turned up creative PB&J
      // spins (wraps, French toast, fritters, a Doritos sandwich) rather than a plain
      // sandwich photo, so the illustration is still the better match here.
      photoUrl: "/meal-photos/pbj-sandwich.svg",
      ingredients: {
        create: [
          {
            name: "PB and jelly",
            quantity: 1,
            unit: "each",
            role: "sandwich",
            swappable: true,
            substituteGroupId: lunchSandwichSwap.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Turkey & Cheese Roll-Ups",
      mealType: "LUNCH",
      tags: "quick",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Turkey and cucumber roll-ups").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-a174/k2-_abf56f13-b2b9-4ff1-a168-0c92c307b3c2.v1.jpg",
      ingredients: {
        create: [
          { name: "turkey slices", quantity: 4, unit: "each", role: "protein", swappable: false },
          { name: "cheese slices", quantity: 2, unit: "each", role: "protein", swappable: false },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Cheese Quesadilla",
      mealType: "LUNCH",
      tags: "kid-favorite",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Crab and Cheese Quesadilla" — used just
      // for the plain folded-and-wedged look, not the crab).
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-3aab/k2-_89f7f3b1-de84-4195-9572-d06f58bc25a5.v1.jpg",
      ingredients: {
        create: [
          { name: "flour tortillas", quantity: 2, unit: "each", role: "main", swappable: false },
          { name: "shredded cheese", quantity: 0.5, unit: "cup", role: "main", swappable: false },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Mac and Cheese Cup",
      mealType: "LUNCH",
      tags: "kid-favorite,quick",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Microwave Mac and Cheese Pasta").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-5c53/k2-_6243c7e7-eb56-45b6-8b5c-d009eba98b17.v1.jpg",
      ingredients: {
        create: [
          { name: "mac and cheese cup", quantity: 1, unit: "each", role: "main", swappable: false },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Mini Chicken Nuggets",
      mealType: "LUNCH",
      tags: "kid-favorite",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Air fried chicken nuggets with sweet
      // and sour sauce").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-a600/k2-_8be5258a-721d-43d2-a822-5e840c2de90a.v1.jpg",
      ingredients: {
        create: [
          { name: "mini chicken nuggets", quantity: 8, unit: "each", role: "protein", swappable: false },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Ham & Cheese Sandwich",
      mealType: "LUNCH",
      tags: "quick",
      repeatable: true,
      // Real photo from Walmart's recipe library ("Ham and Apple Grilled Cheese Sandwich").
      photoUrl: "https://i5.walmartimages.com/dfw/7e496735-7122/k2-_6046f38c-c036-4f9e-885d-cdb95b93824b.v1.jpg",
      ingredients: {
        create: [
          {
            name: "ham and cheese",
            quantity: 1,
            unit: "each",
            role: "sandwich",
            swappable: true,
            substituteGroupId: lunchSandwichSwap.id,
          },
        ],
      },
    },
  });

  // --- Recipes sourced from Walmart's own recipe library (walmart.com/i/recipe-library),
  // added 2026-08-24 to answer "can we pull in real recipes/photos from a Walmart-supported
  // site" — see MVP-SPEC.md's "Recipe imports from Walmart's recipe library" section for the
  // full story. Ingredient lists are simplified from Walmart's (which list exact SKUs) down
  // to the same style as the rest of this file. photoUrl values are direct links to Walmart's
  // own hosted photo for each recipe (not downloaded/re-hosted) — if a link ever goes stale,
  // MealPhoto's existing fallback just shows the plain placeholder tile, nothing breaks.

  await prisma.meal.create({
    data: {
      name: "Cream Cheese Fruit Tortilla Pinwheels",
      mealType: "BREAKFAST",
      tags: "kid-favorite,quick",
      repeatable: true,
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-24fe/k2-_1afb8417-0e59-4ea4-8f35-d3a8ecd6b24d.v1.jpg",
      ingredients: {
        create: [
          { name: "large flour tortillas", quantity: 2, unit: "each", role: "wrap", swappable: false },
          { name: "cream cheese, softened", quantity: 4, unit: "oz", role: "filling", swappable: false },
          { name: "powdered sugar", quantity: 2, unit: "tbsp", role: "filling", swappable: false },
          {
            name: "diced fresh pineapple and mango",
            quantity: 0.5,
            unit: "cup",
            role: "fruit",
            swappable: false,
          },
          {
            name: "shredded coconut",
            quantity: 2,
            unit: "tbsp",
            role: "topping",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Sausage and Egg Breakfast Burrito Bar",
      mealType: "BREAKFAST",
      tags: "quick",
      repeatable: true,
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-2c63/k2-_bae804b5-c7e3-4abb-ba63-e1f4c8a5d118.v1.jpg",
      ingredients: {
        create: [
          {
            name: "sausage",
            quantity: 1,
            unit: "lb",
            role: "protein",
            swappable: true,
            substituteGroupId: breakfastMeatSwap.id, // reuses the sausage/bacon swap group
          },
          { name: "eggs", quantity: 8, unit: "each", role: "protein", swappable: false },
          { name: "flour tortillas", quantity: 8, unit: "each", role: "wrap", swappable: false },
          {
            name: "shredded cheese",
            quantity: 0.5,
            unit: "cup",
            role: "topping",
            swappable: false,
            optional: true,
          },
          {
            name: "salsa",
            quantity: 0.25,
            unit: "cup",
            role: "topping",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Easy 2-Step Classic Ramen",
      mealType: "LUNCH",
      tags: "quick",
      repeatable: true,
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-28c9/k2-_0959ac1b-1a97-4fb9-8d5e-9fbee38fa520.v1.jpg",
      ingredients: {
        create: [
          { name: "ramen noodles", quantity: 6, unit: "oz", role: "main", swappable: false },
          { name: "chicken broth", quantity: 4, unit: "cup", role: "main", swappable: false },
          {
            name: "soft-boiled eggs",
            quantity: 2,
            unit: "each",
            role: "topping",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Teriyaki Chicken Sliders",
      mealType: "LUNCH",
      tags: "quick",
      repeatable: true,
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-b4d2/k2-_72fc7ed5-9fa1-4856-b1d7-6bfb5337ebe1.v1.jpg",
      ingredients: {
        create: [
          {
            name: "shredded rotisserie chicken",
            quantity: 1,
            unit: "lb",
            role: "protein",
            swappable: false,
          },
          { name: "teriyaki sauce", quantity: 0.5, unit: "cup", role: "sauce", swappable: false },
          { name: "potato slider buns", quantity: 8, unit: "each", role: "bread", swappable: false },
          {
            name: "sliced green onion",
            quantity: 2,
            unit: "each",
            role: "topping",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Margherita English Muffin Pizzas",
      mealType: "DINNER",
      tags: "kid-favorite,quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-224b/k2-_81a6d87a-574c-4579-be19-f1acbdd69760.v1.jpg",
      ingredients: {
        create: [
          {
            name: "whole wheat English muffins",
            quantity: 4,
            unit: "each",
            role: "base",
            swappable: false,
          },
          { name: "pizza sauce", quantity: 1, unit: "cup", role: "sauce", swappable: false },
          {
            name: "shredded mozzarella cheese",
            quantity: 2,
            unit: "oz",
            role: "cheese",
            swappable: false,
          },
          {
            name: "fresh basil",
            quantity: 0.5,
            unit: "cup",
            role: "topping",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Juicy Garlic Burger with Mushrooms & Onions",
      mealType: "DINNER",
      tags: "quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-9607/k2-_3eb330f0-847b-418d-9c89-9f2073c6d48f.v1.jpg",
      ingredients: {
        create: [
          { name: "ground beef", quantity: 1, unit: "lb", role: "protein", swappable: false },
          { name: "hamburger buns", quantity: 4, unit: "each", role: "bread", swappable: false },
          {
            name: "sauteed mushrooms and onions",
            quantity: 1.5,
            unit: "cup",
            role: "topping",
            swappable: false,
            optional: true,
          },
          {
            name: "garlic aioli",
            quantity: 0.33,
            unit: "cup",
            role: "sauce",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  // --- Second round of Walmart recipe-library dinners (added 2026-08-24), specifically
  // requested: a hamburger/slider option, chicken drumsticks (nothing spicy), a few
  // single-skillet meals, and a crockpot option — filled out to 10 with more variety
  // (tacos, pizza, pasta bake, fish sticks) so dinner rotation doesn't feel thin.

  await prisma.meal.create({
    data: {
      name: "Abb-Burger", // renamed from "Cheesy Beef Slider Burgers" on 2026-08-27
      mealType: "DINNER",
      tags: "kid-favorite,quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-1ebe/k2-_2e967c47-7572-4f0a-b4f0-f77728574b7d.v1.jpg",
      // Corrected 2026-08-28 — this is meant to be baked sheet-pan-slider style (the whole
      // beef layer baked as one sheet-pan-sized patty under a full tray of Hawaiian rolls,
      // finished with a butter/sesame glaze), not individually-formed burger patties on
      // regular slider buns. Also added starch/veggie sides — every dinner should have one
      // per the "all sides and vegetables selectable" change from the last round; this one
      // had been missed since it didn't have a side in its original recipe.
      ingredients: {
        create: [
          { name: "ground beef", quantity: 2, unit: "lb", role: "protein", swappable: false },
          { name: "Hawaiian rolls", quantity: 12, unit: "each", role: "bread", swappable: false },
          {
            name: "sliced cheddar cheese",
            quantity: 0.5,
            unit: "lb",
            role: "cheese",
            swappable: false,
          },
          {
            name: "onion, thinly sliced and sauteed",
            quantity: 1,
            unit: "each",
            role: "topping",
            swappable: false,
            optional: true,
          },
          {
            name: "melted butter and sesame seed topping",
            quantity: 2,
            unit: "tbsp",
            role: "topping",
            swappable: false,
          },
          {
            name: "pickles, ketchup, and mustard",
            quantity: 0.25,
            unit: "cup",
            role: "topping",
            swappable: false,
            optional: true,
          },
          {
            name: "french fries",
            quantity: 2,
            unit: "cup",
            role: "starch_side",
            swappable: true,
            optional: true,
            substituteGroupId: starchSide.id,
          },
          {
            name: "corn",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            optional: true,
            substituteGroupId: vegetableSide.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Baked Lemon Herb Parmesan Chicken Drumsticks",
      mealType: "DINNER",
      tags: "",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-e5b6/k2-_ce804d3b-9eb5-49bb-8a13-cc378ff2dac9.v1.jpg",
      ingredients: {
        create: [
          { name: "chicken drumsticks", quantity: 2, unit: "lb", role: "protein", swappable: false },
          { name: "lemon juice", quantity: 2, unit: "tbsp", role: "seasoning", swappable: false },
          {
            name: "parmesan cheese and Italian herbs",
            quantity: 0.5,
            unit: "cup",
            role: "seasoning",
            swappable: false,
          },
          {
            name: "roasted potatoes",
            quantity: 2,
            unit: "cup",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Creamy Herb Chicken Potato Skillet",
      mealType: "DINNER",
      tags: "quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-d201/k2-_5d98a168-543a-4f19-98fd-b77e4fb176f6.v1.jpg",
      ingredients: {
        create: [
          { name: "chicken breast, cubed", quantity: 1, unit: "lb", role: "protein", swappable: false },
          {
            name: "baby potatoes, halved",
            quantity: 1.5,
            unit: "lb",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
          { name: "cream sauce with herbs", quantity: 1, unit: "cup", role: "sauce", swappable: false },
          {
            name: "green beans",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "One-Pan Beef and Pasta Skillet",
      mealType: "DINNER",
      tags: "quick,kid-favorite",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-fcd5/k2-_2eb671e3-3b2b-4dbe-a363-d6c36b223206.v1.jpg",
      ingredients: {
        create: [
          { name: "ground beef", quantity: 1, unit: "lb", role: "protein", swappable: false },
          { name: "elbow macaroni", quantity: 2, unit: "cup", role: "main", swappable: false },
          { name: "marinara sauce", quantity: 2, unit: "cup", role: "sauce", swappable: false },
          {
            name: "shredded mozzarella cheese",
            quantity: 1,
            unit: "cup",
            role: "cheese",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Smoked Sausage Bean Potato Skillet",
      mealType: "DINNER",
      tags: "quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-e31a/k2-_80cd1baa-e529-4f05-b828-3ccfab5d2e75.v1.jpg",
      ingredients: {
        create: [
          { name: "smoked sausage, sliced", quantity: 1, unit: "lb", role: "protein", swappable: false },
          {
            name: "baby potatoes, halved",
            quantity: 1.5,
            unit: "lb",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
          { name: "canned beans, drained", quantity: 1, unit: "can", role: "main", swappable: false },
          {
            name: "bell peppers",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Slow Cooker Chicken and Rice Casserole",
      mealType: "DINNER",
      tags: "",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-a810/k2-_0eed350c-35f1-4358-9ae7-2c11bdad1a4a.v1.jpg",
      ingredients: {
        create: [
          { name: "chicken breast", quantity: 1.5, unit: "lb", role: "protein", swappable: false },
          {
            name: "long-grain rice, uncooked",
            quantity: 1.5,
            unit: "cup",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
          },
          { name: "cream of chicken soup", quantity: 2, unit: "can", role: "sauce", swappable: false },
          { name: "chicken broth", quantity: 2, unit: "cup", role: "main", swappable: false },
          {
            name: "frozen mixed vegetables",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Ground Beef Corn Tacos",
      mealType: "DINNER",
      tags: "kid-favorite,quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-d5a0/k2-_b1dd7e72-715b-4c45-9709-db2b0a4af3f2.v1.jpg",
      ingredients: {
        create: [
          { name: "ground beef", quantity: 1, unit: "lb", role: "protein", swappable: false },
          { name: "taco seasoning (mild)", quantity: 1, unit: "packet", role: "seasoning", swappable: false },
          { name: "hard taco shells", quantity: 8, unit: "each", role: "bread", swappable: false },
          {
            name: "corn",
            quantity: 1,
            unit: "cup",
            role: "vegetable_side",
            swappable: true,
            substituteGroupId: vegetableSide.id,
          },
          {
            name: "shredded cheese and lettuce",
            quantity: 1,
            unit: "cup",
            role: "topping",
            swappable: false,
            optional: true,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      // Renamed from "Pepperoni and Mozzarella Pizza" and reworked on 2026-08-27 to start
      // as plain cheese, with toppings as an optional add-on (see pizza_topping group
      // above) instead of always including pepperoni. Photo still shows a pepperoni pizza
      // from the original Walmart import — the closest real photo available without a new
      // live browsing pass; harmless mismatch since MealPhoto's SVG fallback would look
      // worse than a real (if topping-mismatched) photo.
      name: "Pizza",
      mealType: "DINNER",
      tags: "kid-favorite",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-88ce/k2-_d5878341-0e38-4964-b4dd-efbb3ec616a3.v1.jpg",
      ingredients: {
        create: [
          { name: "pizza dough", quantity: 1, unit: "each", role: "base", swappable: false },
          { name: "pizza sauce", quantity: 0.75, unit: "cup", role: "sauce", swappable: false },
          { name: "shredded mozzarella cheese", quantity: 2, unit: "cup", role: "cheese", swappable: false },
          {
            name: "topping",
            quantity: 1,
            unit: "cup",
            role: "topping",
            swappable: true,
            optional: true, // not included by default — pizza starts as plain cheese
            substituteGroupId: pizzaTopping.id,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Hearty Baked Ziti with Meat Ragu",
      mealType: "DINNER",
      tags: "",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-ae1b/k2-_33f33f03-4a89-4525-9304-f357bf59cd39.v1.jpg",
      ingredients: {
        create: [
          { name: "ziti pasta", quantity: 1, unit: "lb", role: "main", swappable: false },
          { name: "ground beef", quantity: 1, unit: "lb", role: "protein", swappable: false },
          { name: "marinara sauce", quantity: 3, unit: "cup", role: "sauce", swappable: false },
          {
            name: "shredded mozzarella and parmesan cheese",
            quantity: 1.5,
            unit: "cup",
            role: "cheese",
            swappable: false,
          },
        ],
      },
    },
  });

  await prisma.meal.create({
    data: {
      name: "Crispy Cod Fish Sticks",
      mealType: "DINNER",
      tags: "kid-favorite,quick",
      photoUrl:
        "https://i5.walmartimages.com/dfw/7e496735-cffe/k2-_16899bfd-50c3-43f2-9e8d-e0b6b93cf2e3.v1.jpg",
      ingredients: {
        create: [
          { name: "cod fillets, cut into sticks", quantity: 1, unit: "lb", role: "protein", swappable: false },
          { name: "panko breadcrumbs", quantity: 1, unit: "cup", role: "coating", swappable: false },
          {
            name: "tartar sauce",
            quantity: 0.5,
            unit: "cup",
            role: "sauce",
            swappable: false,
            optional: true,
          },
          {
            name: "french fries",
            quantity: 2,
            unit: "cup",
            role: "starch_side",
            swappable: true,
            substituteGroupId: starchSide.id,
            optional: true,
          },
        ],
      },
    },
  });

  // --- Added 2026-08-27 ---

  await prisma.meal.create({
    data: {
      name: "Pita Pizzas",
      mealType: "LUNCH",
      tags: "kid-favorite,quick",
      ingredients: {
        create: [
          { name: "pita bread", quantity: 2, unit: "each", role: "base", swappable: false },
          { name: "mozzarella cheese", quantity: 0.5, unit: "cup", role: "cheese", swappable: false },
          { name: "pizza sauce (Rao's)", quantity: 0.25, unit: "cup", role: "sauce", swappable: false },
        ],
      },
    },
  });

  // Single-ingredient "meals" backing the weekly fresh-fruit checklist under Lunches —
  // see MealType.FRUIT and SlotType.FRUIT in schema.prisma for why these are modeled as
  // Meals rather than a one-off list: it means consolidateShoppingList needs no changes
  // to pick these up once checked.
  const fruits: { name: string; quantity: number; unit: string }[] = [
    { name: "strawberries", quantity: 1, unit: "lb" },
    { name: "watermelon", quantity: 1, unit: "each" },
    { name: "grapes", quantity: 1, unit: "lb" },
    { name: "apples", quantity: 1, unit: "lb" },
    { name: "bananas", quantity: 1, unit: "bunch" },
    { name: "kiwis", quantity: 1, unit: "lb" },
  ];
  for (const fruit of fruits) {
    await prisma.meal.create({
      data: {
        name: fruit.name.charAt(0).toUpperCase() + fruit.name.slice(1),
        mealType: "FRUIT",
        tags: "",
        ingredients: {
          create: [{ name: fruit.name, quantity: fruit.quantity, unit: fruit.unit, swappable: false }],
        },
      },
    });
  }

  console.log(
    "Seed complete: 18 dinners, 7 breakfasts, 9 lunches, 6 fruit options, 12 substitute groups (16 recipes sourced from Walmart's recipe library across two rounds).",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
