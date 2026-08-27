import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// PLACEHOLDER DATA — a live import of Field Elementary's (Houston ISD) real cafeteria
// calendar was NOT achieved. Both of the school district's menu systems (Nutrislice and
// SchoolCafé) render their calendars with JavaScript, so they can't be scraped by a simple
// page fetch, and no static/PDF calendar was found via search either. This seed just shows
// what the imported data WOULD look like — a few example days with plausible cafeteria
// lunch menus — so the SchoolLunchDay feature (the "Eat at School" option in the lunch
// picker, showing that day's real menu instead of just a generic toggle) can be built,
// tested, and demoed end-to-end while a real import is figured out separately.
//
// To replace this with the real thing: find Field Elementary's menu at
// https://www.houstonisd.org/Page/... (Nutrislice or SchoolCafé link on the school's site),
// then either copy the week's menu text in by hand each week, or revisit automating it with
// a browser-automation tool that can run JavaScript (e.g. a Claude-in-Chrome session).
//
// This script ADDS/UPDATES rows (upsert by date) rather than wiping the table, so it's safe
// to run alongside prisma/seed.ts without clobbering real imported data later.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Finds next Monday..Friday (or this week's, if today is a weekday) — same logic as
// app/plan/new/page.tsx, so these placeholder examples line up with the week being planned.
function upcomingWeekdays(): Date[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = today.getDay();
  const daysUntilMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const PLACEHOLDER_MENUS = [
  "Cheese Pizza, Green Beans, Fruit Cup (example — not the real cafeteria menu)",
  "Chicken Tenders, Mashed Potatoes, Corn (example — not the real cafeteria menu)",
  "Turkey & Cheese Sub, Baby Carrots, Apple Slices (example — not the real cafeteria menu)",
  "Beef Nachos, Refried Beans, Salsa (example — not the real cafeteria menu)",
  "Popcorn Chicken, Mac and Cheese, Broccoli (example — not the real cafeteria menu)",
];

async function main() {
  const weekdayDates = upcomingWeekdays();

  for (let i = 0; i < weekdayDates.length; i++) {
    await prisma.schoolLunchDay.upsert({
      where: { date: weekdayDates[i] },
      update: { menu: PLACEHOLDER_MENUS[i], source: "PLACEHOLDER — Field Elementary (Houston ISD) import not yet available" },
      create: {
        date: weekdayDates[i],
        menu: PLACEHOLDER_MENUS[i],
        source: "PLACEHOLDER — Field Elementary (Houston ISD) import not yet available",
      },
    });
  }

  console.log(`Seeded ${weekdayDates.length} placeholder SchoolLunchDay entries for the upcoming week.`);
  console.log("Reminder: these are NOT the real Field Elementary menu — see comments at the top of this file.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
