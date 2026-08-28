"use client";

import { useTransition } from "react";
import { setMealFavorite } from "@/app/actions/mealActions";

// A small star toggle overlaid on a meal card. Kept as a sibling button (not nested
// inside the card's own select button — buttons can't nest) positioned absolutely on
// top of it, with stopPropagation so tapping the star doesn't also pick the meal.
// Updates the parent's local favorite set immediately (optimistic) and fires the
// server action in the background; the picker's own meals prop is a page-load
// snapshot, so this local state is what actually drives the star and the sort order
// until the next full page load.
export function FavoriteStar({
  mealId,
  isFavorite,
  onToggle,
}: {
  mealId: string;
  isFavorite: boolean;
  onToggle: (mealId: string, next: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.stopPropagation();
        const next = !isFavorite;
        onToggle(mealId, next);
        startTransition(async () => {
          await setMealFavorite(mealId, next);
        });
      }}
      aria-label={isFavorite ? "Remove favorite" : "Mark as favorite"}
      className="absolute top-2 right-2 z-10 text-xl leading-none drop-shadow-sm disabled:opacity-50"
    >
      {isFavorite ? "⭐" : "☆"}
    </button>
  );
}
