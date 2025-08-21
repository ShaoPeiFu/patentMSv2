/*
  Warnings:

  - You are about to drop the `tech_nodes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tech_relations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deadlineDate` to the `deadlines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deadlineType` to the `deadlines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patentNumber` to the `deadlines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patentTitle` to the `deadlines` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tech_nodes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tech_relations";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "smart_reminders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deadlineId" INTEGER NOT NULL,
    "patentId" INTEGER NOT NULL,
    "reminderType" TEXT NOT NULL DEFAULT 'notification',
    "reminderLevel" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "smart_reminders_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "deadlines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "smart_reminders_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deadlineId" INTEGER NOT NULL,
    "patentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '#409EFF',
    "type" TEXT NOT NULL DEFAULT 'deadline',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calendar_events_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "deadlines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calendar_events_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patentId" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "riskFactors" TEXT,
    "mitigationActions" TEXT,
    "assessmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAssessmentDate" DATETIME NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_assessments_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "batch_operations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operationType" TEXT NOT NULL,
    "targetDeadlines" TEXT NOT NULL,
    "parameters" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_deadlines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patentId" INTEGER NOT NULL,
    "patentNumber" TEXT NOT NULL,
    "patentTitle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "deadlineDate" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "deadlineType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "reminderLevel" TEXT NOT NULL DEFAULT 'info',
    "daysUntilDeadline" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "deadlines_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_deadlines" ("createdAt", "description", "dueDate", "id", "patentId", "priority", "status", "title", "type", "updatedAt") SELECT "createdAt", "description", "dueDate", "id", "patentId", "priority", "status", "title", "type", "updatedAt" FROM "deadlines";
DROP TABLE "deadlines";
ALTER TABLE "new_deadlines" RENAME TO "deadlines";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
