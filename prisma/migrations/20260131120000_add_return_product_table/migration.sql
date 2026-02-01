-- CreateTable
CREATE TABLE "ReturnProduct" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attendantId" TEXT NOT NULL,
    "reason" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHERS',
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReturnProduct" ADD CONSTRAINT "ReturnProduct_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnProduct" ADD CONSTRAINT "ReturnProduct_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnProduct" ADD CONSTRAINT "ReturnProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnProduct" ADD CONSTRAINT "ReturnProduct_attendantId_fkey" FOREIGN KEY ("attendantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ReturnProduct_storeId_idx" ON "ReturnProduct"("storeId");

-- CreateIndex
CREATE INDEX "ReturnProduct_transactionId_idx" ON "ReturnProduct"("transactionId");

-- CreateIndex
CREATE INDEX "ReturnProduct_productId_idx" ON "ReturnProduct"("productId");

-- CreateIndex
CREATE INDEX "ReturnProduct_attendantId_idx" ON "ReturnProduct"("attendantId");

-- CreateIndex
CREATE INDEX "ReturnProduct_returnDate_idx" ON "ReturnProduct"("returnDate");

-- CreateIndex
CREATE INDEX "ReturnProduct_status_idx" ON "ReturnProduct"("status");