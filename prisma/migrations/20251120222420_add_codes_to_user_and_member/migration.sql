/*
  Warnings:

  - Added the required column `code` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "code" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "membershipType" TEXT NOT NULL,
    "discount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("address", "createdAt", "discount", "id", "membershipType", "name", "phone", "storeId", "updatedAt") SELECT "address", "createdAt", "discount", "id", "membershipType", "name", "phone", "storeId", "updatedAt" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE INDEX "Member_storeId_idx" ON "Member"("storeId");
CREATE UNIQUE INDEX "Member_phone_storeId_key" ON "Member"("phone", "storeId");
CREATE UNIQUE INDEX "Member_code_storeId_key" ON "Member"("code", "storeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
