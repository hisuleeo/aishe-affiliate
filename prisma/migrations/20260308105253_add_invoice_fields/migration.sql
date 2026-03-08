-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "invoice_info" JSONB,
ADD COLUMN     "needs_invoice" BOOLEAN DEFAULT false;
