-- CreateTable
CREATE TABLE "patent_evaluations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patentId" INTEGER NOT NULL,
    "evaluatorId" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "criteria" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patent_evaluations_patentId_fkey" FOREIGN KEY ("patentId") REFERENCES "patents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patent_evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
