"use client";

import { useState, useTransition } from "react";
import { addFamilyMember, updateFamilyMember, deleteFamilyMember } from "@/app/actions/familyActions";

type Member = {
  id: string;
  name: string;
  memberType: "KID" | "PARENT";
  favoriteMealToEat: string | null;
  favoriteMealToCook: string | null;
  afterDinnerChore: string | null;
  favoriteSaladDressing: string | null;
};

type FormValues = {
  name: string;
  favoriteMealToEat: string;
  favoriteMealToCook: string;
  afterDinnerChore: string;
  favoriteSaladDressing: string;
};

const EMPTY: FormValues = {
  name: "",
  favoriteMealToEat: "",
  favoriteMealToCook: "",
  afterDinnerChore: "",
  favoriteSaladDressing: "",
};

function toFormValues(member: Member): FormValues {
  return {
    name: member.name,
    favoriteMealToEat: member.favoriteMealToEat ?? "",
    favoriteMealToCook: member.favoriteMealToCook ?? "",
    afterDinnerChore: member.afterDinnerChore ?? "",
    favoriteSaladDressing: member.favoriteSaladDressing ?? "",
  };
}

export function FamilyEditor({ kids, parents }: { kids: Member[]; parents: Member[] }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Kids 🧒</h2>
        <div className="space-y-3">
          {kids.map((kid) => (
            <MemberCard key={kid.id} member={kid} />
          ))}
          <AddMemberCard memberType="KID" label="Add a Kid" />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-1">Parents Profile 💛</h2>
        <p className="text-sm text-kitchen-ink/60 mb-3">
          The weekly picker just shows &quot;Parent Pick&quot; either way — this is just for
          keeping both parents&apos; info in one place.
        </p>
        <div className="space-y-3">
          {parents.map((parent) => (
            <MemberCard key={parent.id} member={parent} />
          ))}
          {parents.length < 2 && (
            <AddMemberCard
              memberType="PARENT"
              label={parents.length === 0 ? "Add Parent 1" : "Add Parent 2"}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormValues>(toFormValues(member));

  function save() {
    startTransition(async () => {
      await updateFamilyMember(member.id, values);
      setEditing(false);
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteFamilyMember(member.id);
    });
  }

  if (!editing) {
    const facts = [
      member.favoriteMealToEat && `Loves eating: ${member.favoriteMealToEat}`,
      member.favoriteMealToCook && `Loves helping cook: ${member.favoriteMealToCook}`,
      member.afterDinnerChore && `After-dinner chore: ${member.afterDinnerChore}`,
      member.favoriteSaladDressing && `Favorite dressing: ${member.favoriteSaladDressing}`,
    ].filter(Boolean);

    return (
      <div className="rounded-card bg-white border-2 border-kitchen-ink/10 p-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold">{member.name || "(unnamed)"}</span>
          <button onClick={() => setEditing(true)} className="text-sm text-kitchen-ink/60 underline">
            Edit
          </button>
        </div>
        {facts.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {facts.map((fact) => (
              <li key={fact} className="text-sm text-kitchen-ink/60">
                {fact}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-kitchen-ink/40 italic">No fun facts added yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-card bg-white border-2 border-kitchen-mustard p-4">
      <MemberForm values={values} onChange={setValues} />
      <div className="flex justify-between mt-3">
        <button onClick={remove} disabled={isPending} className="text-sm text-kitchen-tomato underline">
          Remove
        </button>
        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} disabled={isPending} className="text-sm text-kitchen-ink/60 underline">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={isPending || !values.name.trim()}
            className="px-4 py-1.5 rounded-full bg-kitchen-sage text-white text-sm font-semibold disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMemberCard({ memberType, label }: { memberType: "KID" | "PARENT"; label: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormValues>(EMPTY);

  function save() {
    startTransition(async () => {
      await addFamilyMember({ memberType, ...values });
      setValues(EMPTY);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-card border-2 border-dashed border-kitchen-ink/20 p-4 text-center text-sm text-kitchen-ink/60 hover:border-kitchen-tomato transition-colors"
      >
        + {label}
      </button>
    );
  }

  return (
    <div className="rounded-card bg-white border-2 border-kitchen-mustard p-4">
      <MemberForm values={values} onChange={setValues} />
      <div className="flex justify-end gap-3 mt-3">
        <button onClick={() => setOpen(false)} disabled={isPending} className="text-sm text-kitchen-ink/60 underline">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={isPending || !values.name.trim()}
          className="px-4 py-1.5 rounded-full bg-kitchen-sage text-white text-sm font-semibold disabled:opacity-40"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function MemberForm({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (values: FormValues) => void;
}) {
  function set<K extends keyof FormValues>(key: K, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-2">
      <Field label="Name" value={values.name} onChange={(v) => set("name", v)} placeholder="e.g. Tommy" />
      <Field
        label="Favorite meal to eat"
        value={values.favoriteMealToEat}
        onChange={(v) => set("favoriteMealToEat", v)}
        placeholder="e.g. Chicken strips"
      />
      <Field
        label="Favorite meal to help cook"
        value={values.favoriteMealToCook}
        onChange={(v) => set("favoriteMealToCook", v)}
        placeholder="e.g. Pancakes"
      />
      <Field
        label="After-dinner chore"
        value={values.afterDinnerChore}
        onChange={(v) => set("afterDinnerChore", v)}
        placeholder="e.g. Clear the table"
      />
      <Field
        label="Favorite salad dressing"
        value={values.favoriteSaladDressing}
        onChange={(v) => set("favoriteSaladDressing", v)}
        placeholder="e.g. Ranch"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-kitchen-ink/50">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 w-full rounded-lg border-2 border-kitchen-ink/10 px-3 py-1.5 text-sm focus:border-kitchen-tomato outline-none"
      />
    </label>
  );
}
