/*
  Warnings:

  - You are about to drop the `PriceTier` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Warehouse` will be added. If there are existing duplicate values, this will fail.
  - Made the column `retailPrice` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `silverPrice` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `goldPrice` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `platinumPrice` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `code` on table `Store` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PriceTier" DROP CONSTRAINT "PriceTier_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "retailPrice" SET NOT NULL,
ALTER COLUMN "retailPrice" DROP DEFAULT,
ALTER COLUMN "silverPrice" SET NOT NULL,
ALTER COLUMN "silverPrice" DROP DEFAULT,
ALTER COLUMN "goldPrice" SET NOT NULL,
ALTER COLUMN "goldPrice" DROP DEFAULT,
ALTER COLUMN "platinumPrice" SET NOT NULL,
ALTER COLUMN "platinumPrice" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "code" SET NOT NULL,
ALTER COLUMN "code" DROP DEFAULT;

-- DropTable
DROP TABLE "PriceTier";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "storeId" TEXT,
    "severity" TEXT NOT NULL,
    "data" JSONB,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_storeId_idx" ON "Notification"("storeId");

-- CreateIndex
CREATE INDEX "Notification_acknowledged_idx" ON "Notification"("acknowledged");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
