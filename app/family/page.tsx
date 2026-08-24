import { prisma } from "@/lib/prisma";
import { FamilyEditor } from "./FamilyEditor";

export default async function FamilyPage() {
  const members = await prisma.familyMember.findMany({ orderBy: { sortOrder: "asc" } });
  const kids = members.filter((m) => m.memberType === "KID");
  const parents = members.filter((m) => m.memberType === "PARENT");

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-1">Family Profiles 👪</h1>
      <p className="text-kitchen-ink/70 mb-6">
        Real names show up in the weekly picker instead of &quot;Kid 1&quot; and &quot;Kid 2.&quot;
        The fun stuff below is just for the two of you to enjoy for now — a future version
        will use it to flag picks and suggest meals everyone will actually eat.
      </p>
      <FamilyEditor kids={kids} parents={parents} />
    </main>
  );
}
