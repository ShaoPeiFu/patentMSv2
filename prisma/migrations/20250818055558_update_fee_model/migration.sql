/*
  Warnings:

  - Added the required column `feeType` to the `fees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patentNumber` to the `fees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patentTitle` to the `fees` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fees" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patentId" INTEGER NOT NULL,
    "patentNumber" TEXT NOT NULL,
    "patentTitle" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "receiptNumber" TEXT,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "categoryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fees_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fees_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fee_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 从现有表复制数据，并为新字段提供默认值
INSERT INTO "new_fees" (
    "id", "patentId", "patentNumber", "patentTitle", "type", "feeType", 
    "amount", "currency", "dueDate", "paidDate", "status", "description", 
    "receiptNumber", "paymentMethod", "notes", "categoryId", "createdAt", "updatedAt"
) 
SELECT 
    "id", "patentId", 
    COALESCE((SELECT "patentNumber" FROM "patents" WHERE "patents"."id" = "fees"."patentId"), '未知') as "patentNumber",
    COALESCE((SELECT "title" FROM "patents" WHERE "patents"."id" = "fees"."patentId"), '未知') as "patentTitle",
    "type", "type" as "feeType",  -- 使用type字段的值作为feeType的默认值
    "amount", "currency", "dueDate", NULL as "paidDate", "status", "description",
    NULL as "receiptNumber", NULL as "paymentMethod", NULL as "notes", "categoryId", "createdAt", "updatedAt"
FROM "fees";

DROP TABLE "fees";
ALTER TABLE "new_fees" RENAME TO "fees";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
