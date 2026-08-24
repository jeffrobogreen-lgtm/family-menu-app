"use client";

import { useState } from "react";
import { updateShoppingListItem } from "@/app/actions/planActions";

type Item = { id: string; name: string; quantity: number; unit: string; edited: boolean };

export function ShoppingListEditor({ items, locked }: { items: Item[]; locked: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <ShoppingListRow
          key={item.id}
          item={item}
          locked={locked}
          editing={editingId === item.id}
          onEditToggle={() => setEditingId(editingId === item.id ? null : item.id)}
        />
      ))}
    </ul>
  );
}

function ShoppingListRow({
  item,
  locked,
  editing,
  onEditToggle,
}: {
  item: Item;
  locked: boolean;
  editing: boolean;
  onEditToggle: () => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await updateShoppingListItem(item.id, quantity, unit);
    setSaving(false);
    onEditToggle();
  }

  if (editing) {
    return (
      <li className="rounded-card bg-white border-2 border-kitchen-mustard px-4 py-3 flex items-center gap-2">
        <span className="flex-1 font-medium">{item.name}</span>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          className="w-16 border rounded px-2 py-1 text-sm"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-16 border rounded px-2 py-1 text-sm"
        />
        <button onClick={save} disabled={saving} className="text-sm text-kitchen-sage font-semibold">
          {saving ? "..." : "Save"}
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-card bg-white border-2 border-kitchen-ink/10 px-4 py-3 flex justify-between items-center">
      <span>{item.name}</span>
      <button onClick={onEditToggle} disabled={locked} className="text-sm text-kitchen-ink/60 disabled:opacity-40">
        {item.quantity} {item.unit} {item.edited ? "✎" : ""} {!locked ? "· edit" : ""}
      </button>
    </li>
  );
}
