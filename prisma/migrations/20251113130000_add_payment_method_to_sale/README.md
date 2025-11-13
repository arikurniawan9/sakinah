/*
  Add payment method column to Sale
*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'CASH';