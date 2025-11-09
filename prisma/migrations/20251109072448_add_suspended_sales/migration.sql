-- CreateTable
CREATE TABLE "SuspendedSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "cartItems" TEXT NOT NULL,
    "memberId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
