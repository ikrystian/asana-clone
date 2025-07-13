/*
  Warnings:

  - You are about to drop the column `adminPassword` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `adminUrl` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `adminUsername` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ftpHost` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ftpPassword` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ftpUsername` on the `Client` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ClientAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT,
    "username" TEXT,
    "password" TEXT,
    "port" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "ClientAccess_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientAccess_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "websiteUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "companyName", "contactPerson", "createdAt", "createdById", "email", "id", "notes", "phone", "status", "updatedAt", "websiteUrl") SELECT "address", "companyName", "contactPerson", "createdAt", "createdById", "email", "id", "notes", "phone", "status", "updatedAt", "websiteUrl" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
