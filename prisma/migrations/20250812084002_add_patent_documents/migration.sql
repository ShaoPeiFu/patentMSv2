/*
  Warnings:

  - You are about to drop the column `documents` on the `patents` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "patent_documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" INTEGER NOT NULL,
    CONSTRAINT "patent_documents_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patent_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "patentNumber" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "type" TEXT NOT NULL DEFAULT 'invention',
    "categoryId" INTEGER,
    "applicationDate" DATETIME NOT NULL,
    "publicationDate" DATETIME,
    "grantDate" DATETIME,
    "expirationDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "technicalField" TEXT,
    "keywords" TEXT,
    "applicants" TEXT,
    "inventors" TEXT,
    "abstract" TEXT,
    "claims" TEXT,
    "drawings" TEXT,
    "familyId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "patents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "patent_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "patents_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "patent_families" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_patents" ("abstract", "applicants", "applicationDate", "categoryId", "claims", "createdAt", "description", "drawings", "expirationDate", "familyId", "grantDate", "id", "inventors", "keywords", "patentNumber", "priority", "publicationDate", "status", "technicalField", "title", "type", "updatedAt", "userId") SELECT "abstract", "applicants", "applicationDate", "categoryId", "claims", "createdAt", "description", "drawings", "expirationDate", "familyId", "grantDate", "id", "inventors", "keywords", "patentNumber", "priority", "publicationDate", "status", "technicalField", "title", "type", "updatedAt", "userId" FROM "patents";
DROP TABLE "patents";
ALTER TABLE "new_patents" RENAME TO "patents";
CREATE UNIQUE INDEX "patents_patentNumber_key" ON "patents"("patentNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
