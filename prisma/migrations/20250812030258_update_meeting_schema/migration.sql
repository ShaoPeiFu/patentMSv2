/*
  Warnings:

  - You are about to drop the column `meetingId` on the `meetings` table. All the data in the column will be lost.
  - Added the required column `duration` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerId` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Made the column `endTime` on table `meetings` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_law_firms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "specialties" TEXT,
    "serviceLevel" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "rating" REAL NOT NULL DEFAULT 0,
    "contractCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_law_firms" ("address", "contactPerson", "contractCount", "createdAt", "description", "email", "id", "name", "phone", "rating", "serviceLevel", "specialties", "status", "totalRevenue", "updatedAt", "website") SELECT "address", "contactPerson", "contractCount", "createdAt", "description", "email", "id", "name", "phone", "rating", "serviceLevel", "specialties", "status", "totalRevenue", "updatedAt", "website" FROM "law_firms";
DROP TABLE "law_firms";
ALTER TABLE "new_law_firms" RENAME TO "law_firms";
CREATE TABLE "new_meeting_participants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "meetingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "status" TEXT NOT NULL DEFAULT 'invited',
    "response" TEXT NOT NULL DEFAULT 'no_response',
    "userName" TEXT,
    "joinedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "meeting_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_meeting_participants" ("createdAt", "id", "meetingId", "role", "status", "userId") SELECT "createdAt", "id", "meetingId", "role", "status", "userId" FROM "meeting_participants";
DROP TABLE "meeting_participants";
ALTER TABLE "new_meeting_participants" RENAME TO "meeting_participants";
CREATE UNIQUE INDEX "meeting_participants_meetingId_userId_key" ON "meeting_participants"("meetingId", "userId");
CREATE TABLE "new_meetings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'zoom',
    "joinUrl" TEXT,
    "hostUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "agenda" TEXT,
    "organizerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "meetings_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_meetings" ("createdAt", "description", "endTime", "hostUrl", "id", "joinUrl", "platform", "startTime", "status", "title", "updatedAt") SELECT "createdAt", "description", "endTime", "hostUrl", "id", "joinUrl", coalesce("platform", 'zoom') AS "platform", "startTime", "status", "title", "updatedAt" FROM "meetings";
DROP TABLE "meetings";
ALTER TABLE "new_meetings" RENAME TO "meetings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
