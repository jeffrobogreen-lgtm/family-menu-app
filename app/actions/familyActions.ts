"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type MemberInput = {
  name: string;
  memberType: "KID" | "PARENT";
  favoriteMealToEat?: string;
  favoriteMealToCook?: string;
  afterDinnerChore?: string;
  favoriteSaladDressing?: string;
};

// Family profiles (MVP-SPEC "Family member profiles") — kids get real names used
// throughout the picker; parents share one "Parents Profile" screen but still get
// individual rows here so both parents' info can be recorded separately.
export async function addFamilyMember(data: MemberInput) {
  const count = await prisma.familyMember.count({ where: { memberType: data.memberType } });
  await prisma.familyMember.create({
    data: { ...data, sortOrder: count },
  });
  revalidatePath("/family");
  revalidatePath("/plan/new");
}

export async function updateFamilyMember(
  id: string,
  data: Partial<Omit<MemberInput, "memberType">>,
) {
  await prisma.familyMember.update({ where: { id }, data });
  revalidatePath("/family");
  revalidatePath("/plan/new");
}

export async function deleteFamilyMember(id: string) {
  await prisma.familyMember.delete({ where: { id } });
  revalidatePath("/family");
  revalidatePath("/plan/new");
}
