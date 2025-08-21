-- CreateTable
CREATE TABLE "tech_nodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "patentCount" INTEGER NOT NULL DEFAULT 0,
    "keywords" TEXT,
    "relatedTechnologies" TEXT,
    "status" TEXT NOT NULL DEFAULT 'emerging',
    "evolutionYear" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tech_relations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "description" TEXT,
    "commonKeywords" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tech_relations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "tech_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tech_relations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "tech_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
