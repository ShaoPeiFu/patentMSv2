-- CreateTable
CREATE TABLE "fee_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#409EFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patentId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "categoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fees_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fees_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fee_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_fees" ("amount", "createdAt", "currency", "description", "dueDate", "id", "patentId", "status", "type", "updatedAt") SELECT "amount", "createdAt", "currency", "description", "dueDate", "id", "patentId", "status", "type", "updatedAt" FROM "fees";
DROP TABLE "fees";
ALTER TABLE "new_fees" RENAME TO "fees";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_name_key" ON "fee_categories"("name");
