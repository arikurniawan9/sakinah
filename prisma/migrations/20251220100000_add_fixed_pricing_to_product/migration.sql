-- CreateTable
-- Migration: add_fixed_pricing_to_product

-- Add the new pricing columns to the products table
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "retailPrice" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "silverPrice" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "goldPrice" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "platinumPrice" INTEGER DEFAULT 0;

-- Remove discount column from members table if it exists
ALTER TABLE "Member" DROP COLUMN IF EXISTS "discount";

-- Set silver, gold, and platinum prices to retail price as default for existing products
UPDATE "Product" SET
  "silverPrice" = COALESCE("silverPrice", "retailPrice"),
  "goldPrice" = COALESCE("goldPrice", "retailPrice"),
  "platinumPrice" = COALESCE("platinumPrice", "retailPrice");