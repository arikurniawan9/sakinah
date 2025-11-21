-- Remove icon column from Category table
-- Migration file: remove_icon_from_category

-- Step 1: Create a backup of the current data (optional but recommended)
-- Step 2: Drop the icon column

ALTER TABLE "Category" DROP COLUMN "icon";