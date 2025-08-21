/*
  Warnings:

  - You are about to drop the `fee_agreements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_evaluations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isActive` on the `contract_templates` table. All the data in the column will be lost.
  - You are about to drop the column `organizerId` on the `meetings` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `contract_templates` table without a default value. This is not possible if the table is not empty.
  - Made the column `variables` on table `contract_templates` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `specialties` to the `law_firms` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "fee_agreements";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "service_evaluations";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "patent_families" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patent_citations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "citingPatentId" INTEGER NOT NULL,
    "citedPatentId" INTEGER NOT NULL,
    "citationType" TEXT NOT NULL DEFAULT 'prior_art',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patent_citations_citingPatentId_fkey" FOREIGN KEY ("citingPatentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patent_citations_citedPatentId_fkey" FOREIGN KEY ("citedPatentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contract_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_contract_templates" ("content", "createdAt", "description", "id", "name", "type", "updatedAt", "variables", "version") SELECT "content", "createdAt", "description", "id", "name", "type", "updatedAt", "variables", "version" FROM "contract_templates";
DROP TABLE "contract_templates";
ALTER TABLE "new_contract_templates" RENAME TO "contract_templates";
CREATE TABLE "new_law_firms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "website" TEXT,
    "description" TEXT,
    "specialties" TEXT NOT NULL,
    "serviceLevel" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "rating" REAL NOT NULL DEFAULT 0,
    "contractCount" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_law_firms" ("address", "contactPerson", "createdAt", "description", "email", "id", "name", "phone", "rating", "updatedAt") SELECT "address", "contactPerson", "createdAt", "description", "email", "id", "name", "phone", coalesce("rating", 0) AS "rating", "updatedAt" FROM "law_firms";
DROP TABLE "law_firms";
ALTER TABLE "new_law_firms" RENAME TO "law_firms";
CREATE TABLE "new_meetings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "platform" TEXT,
    "joinUrl" TEXT,
    "meetingId" TEXT,
    "hostUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_meetings" ("createdAt", "description", "endTime", "hostUrl", "id", "joinUrl", "meetingId", "platform", "startTime", "status", "title", "updatedAt") SELECT "createdAt", "description", "endTime", "hostUrl", "id", "joinUrl", "meetingId", "platform", "startTime", "status", "title", "updatedAt" FROM "meetings";
DROP TABLE "meetings";
ALTER TABLE "new_meetings" RENAME TO "meetings";
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
    "documents" TEXT,
    "familyId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "patents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "patent_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "patents_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "patent_families" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_patents" ("abstract", "applicants", "applicationDate", "categoryId", "claims", "createdAt", "description", "documents", "drawings", "expirationDate", "grantDate", "id", "inventors", "keywords", "patentNumber", "priority", "publicationDate", "status", "technicalField", "title", "type", "updatedAt", "userId") SELECT "abstract", "applicants", "applicationDate", "categoryId", "claims", "createdAt", "description", "documents", "drawings", "expirationDate", "grantDate", "id", "inventors", "keywords", "patentNumber", "priority", "publicationDate", "status", "technicalField", "title", "type", "updatedAt", "userId" FROM "patents";
DROP TABLE "patents";
ALTER TABLE "new_patents" RENAME TO "patents";
CREATE UNIQUE INDEX "patents_patentNumber_key" ON "patents"("patentNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "patent_citations_citingPatentId_citedPatentId_key" ON "patent_citations"("citingPatentId", "citedPatentId");
