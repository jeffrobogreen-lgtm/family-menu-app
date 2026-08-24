"use client";

import { useState } from "react";

// Renders a meal's photo if it has one and the file actually loads; falls back to a
// plain placeholder tile otherwise. This means dropping a real image file into
// public/meal-photos/ (matching the filename already set in prisma/seed.ts) is the
// only step needed to make photos show up — no code changes required.
export function MealPhoto({
  src,
  alt,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-kitchen-bg text-kitchen-ink/25 ${className}`}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2" stroke="currentColor" strokeWidth={1.5}>
          <path d="M7 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M8 11v10M16 3c-1.5 0-3 1.5-3 4.5S14.5 12 16 12s3-1.5 3-4.5S17.5 3 16 3ZM16 12v9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static files, no remote-image config needed
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}
