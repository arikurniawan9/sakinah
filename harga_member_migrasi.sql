-- Migration file for implementing fixed pricing system

-- Drop the price_tiers table
DROP TABLE IF EXISTS "PriceTier";

-- Add the new pricing columns to the products table
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "retailPrice" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "silverPrice" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "goldPrice" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "platinumPrice" INTEGER DEFAULT 0;

-- Remove discount column from members table
ALTER TABLE "Member" DROP COLUMN IF EXISTS "discount";

-- Optional: populate the new price columns from existing price tiers
-- Uncomment the following lines if you want to migrate existing data
/*
UPDATE "Product" SET "retailPrice" = (
  SELECT "price"
  FROM "PriceTier"
  WHERE "PriceTier"."productId" = "Product"."id"
  ORDER BY "minQty" ASC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "PriceTier" WHERE "PriceTier"."productId" = "Product"."id"
);
*/

-- Set silver, gold, and platinum prices to retail price as default
UPDATE "Product" SET
  "silverPrice" = "retailPrice",
  "goldPrice" = "retailPrice",
  "platinumPrice" = "retailPrice";