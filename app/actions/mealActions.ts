"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Toggling a favorite is fire-and-forget from the picker's point of view (see
// FavoriteStar.tsx for the optimistic local-state update) — this just persists it.
// revalidatePath so the next fresh load of /plan/new (a new page.tsx server render)
// picks up the change too, not just the current client session.
export async function setMealFavorite(mealId: string, isFavorite: boolean) {
  await prisma.meal.update({
    where: { id: mealId },
    data: { isFavorite },
  });
  revalidatePath("/plan/new");
}
