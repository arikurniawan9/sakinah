-- AlterTable
ALTER TABLE "ReturnProduct" ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "ReturnProduct_invoiceNumber_idx" ON "ReturnProduct"("invoiceNumber");
