-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "memberType" TEXT NOT NULL,
    "favoriteMealToEat" TEXT,
    "favoriteMealToCook" TEXT,
    "afterDinnerChore" TEXT,
    "favoriteSaladDressing" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SchoolLunchDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "menu" TEXT NOT NULL,
    "source" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlanSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weeklyPlanId" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "pickedBy" TEXT,
    "mealId" TEXT,
    "overriddenByParent" BOOLEAN NOT NULL DEFAULT false,
    "chosenSubstitutes" TEXT,
    "weekday" INTEGER,
    "eatingAtSchool" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PlanSlot_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanSlot_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PlanSlot" ("chosenSubstitutes", "id", "mealId", "overriddenByParent", "pickedBy", "slotType", "weeklyPlanId") SELECT "chosenSubstitutes", "id", "mealId", "overriddenByParent", "pickedBy", "slotType", "weeklyPlanId" FROM "PlanSlot";
DROP TABLE "PlanSlot";
ALTER TABLE "new_PlanSlot" RENAME TO "PlanSlot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SchoolLunchDay_date_key" ON "SchoolLunchDay"("date");
