-- AlterTable
ALTER TABLE "patents" ADD COLUMN "applicationNumber" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_approval_workflows" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "type" TEXT NOT NULL DEFAULT 'sequential',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT '通用',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "tags" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "approval_workflows_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_approval_workflows" ("createdAt", "createdBy", "description", "id", "name", "status", "steps", "updatedAt") SELECT "createdAt", "createdBy", "description", "id", "name", "status", "steps", "updatedAt" FROM "approval_workflows";
DROP TABLE "approval_workflows";
ALTER TABLE "new_approval_workflows" RENAME TO "approval_workflows";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
