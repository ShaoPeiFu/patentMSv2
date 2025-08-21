/*
  Warnings:

  - You are about to drop the column `action` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `targetType` on the `activity_logs` table. All the data in the column will be lost.
  - Added the required column `title` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `activity_logs` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activity_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_activity_logs" ("details", "id", "ipAddress", "userAgent", "userId") SELECT "details", "id", "ipAddress", "userAgent", "userId" FROM "activity_logs";
DROP TABLE "activity_logs";
ALTER TABLE "new_activity_logs" RENAME TO "activity_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
