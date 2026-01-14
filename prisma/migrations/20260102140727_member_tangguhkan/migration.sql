-- AddForeignKey
ALTER TABLE "SuspendedSale" ADD CONSTRAINT "SuspendedSale_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
