"use client";

import { useState } from "react";

type Item = { name: string; quantity: number; unit: string };

// The "framework to pull in the Walmart functionality" — per the agreed architecture,
// this app stays Walmart-agnostic and never touches your account, cart, or checkout.
// This just formats the locked-in list into clean plain text you can copy, so that a
// separate, on-demand, human-supervised browser session (at most weekly) can read
// straight down it and add each line to your Walmart cart for you to review and pay
// for yourself. See MVP-SPEC.md's "Walmart integration" section for the full plan.
export function WalmartExport({ items }: { items: Item[] }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const listText = items.map((item) => `${item.quantity} ${item.unit} ${item.name}`).join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(listText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setOpen(true); // clipboard blocked — fall back to showing the text to copy by hand
    }
  }

  return (
    <div className="mt-6 rounded-card bg-white border-2 border-kitchen-ink/10 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🛒</span>
        <h3 className="font-display font-semibold">Ready for Walmart</h3>
      </div>
      <p className="text-sm text-kitchen-ink/60 mb-3">
        Copy the list, then hand it to a Walmart shopping session whenever you&apos;re ready —
        it&apos;ll search and add each item to your cart for you to review and check out
        yourself. This app never touches your account or your card.
      </p>
      <div className="flex gap-3">
        <button
          onClick={copy}
          className="px-4 py-2 rounded-full bg-kitchen-sage text-white text-sm font-semibold"
        >
          {copied ? "Copied! ✓" : "Copy List for Walmart"}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm text-kitchen-ink/60 underline"
        >
          {open ? "Hide list" : "Show list"}
        </button>
      </div>
      {open && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-kitchen-bg p-3 text-sm text-kitchen-ink/80">
          {listText}
        </pre>
      )}
    </div>
  );
}
