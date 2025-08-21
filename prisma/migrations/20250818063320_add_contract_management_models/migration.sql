-- CreateTable
CREATE TABLE "fee_agreements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lawFirmId" INTEGER NOT NULL,
    "contractId" INTEGER,
    "feeType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "paymentTerms" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "lastPaymentDate" DATETIME,
    "nextPaymentDate" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fee_agreements_lawFirmId_fkey" FOREIGN KEY ("lawFirmId") REFERENCES "law_firms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_evaluations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lawFirmId" INTEGER NOT NULL,
    "contractId" INTEGER,
    "evaluatorId" INTEGER NOT NULL,
    "evaluationDate" DATETIME NOT NULL,
    "criteria" TEXT NOT NULL,
    "overallScore" REAL NOT NULL,
    "comments" TEXT,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_evaluations_lawFirmId_fkey" FOREIGN KEY ("lawFirmId") REFERENCES "law_firms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_evaluations_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
