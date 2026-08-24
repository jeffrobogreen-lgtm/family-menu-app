# Meal photos

Every meal already has a fun, kid-friendly SVG illustration in this folder — hand-drawn
in the app's own color palette (tomato/mustard/sage), not photos. Nothing to do here to
get pictures showing up; they're already wired in via `prisma/seed.ts`.

Dinners:
- `chicken-strips.svg` — Chicken Strips, Mashed Potatoes & Green Beans
- `teriyaki-chicken.svg` — Teriyaki Chicken & Fried Rice with Edamame
- `grilled-cheese-soup.svg` — Grilled Cheese & Noodle Soup
- `steak-broccoli.svg` — Steak, Broccoli & Baked Potato
- `ham-pea-noodles.svg` — Ham & Pea Noodles with Salad

Breakfasts:
- `fruit-loops.svg` — Fruit Loops Cereal
- `pop-tarts.svg` — Pop Tarts
- `croissants.svg` — Croissants (Store-Bought)
- `protein-pancakes.svg` — Frozen Protein Pancakes
- `eggs-sausage.svg` — Eggs & Sausage

Lunches:
- `pbj-sandwich.svg` — PB&J Sandwich
- `turkey-cheese-roll-ups.svg` — Turkey & Cheese Roll-Ups
- `quesadilla.svg` — Cheese Quesadilla
- `mac-and-cheese-lunch.svg` — Mac and Cheese Cup
- `chicken-nuggets-lunch.svg` — Mini Chicken Nuggets
- `ham-cheese-sandwich.svg` — Ham & Cheese Sandwich

Want real photos instead? Just drop a `.jpg`/`.png` into this folder using one of the
filenames above (swapping the extension) and update that meal's `photoUrl` in
`prisma/seed.ts` to match, then re-run `npm run seed`. Any meal whose file goes missing
or fails to load just falls back to a plain placeholder tile — so it's safe to replace
these one at a time whenever you want. A square-ish image (roughly 1:1) looks best — the
picker crops to fill a square tile, and the review screen uses small square thumbnails.
