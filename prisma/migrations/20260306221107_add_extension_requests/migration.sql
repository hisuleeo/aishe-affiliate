-- CreateEnum
CREATE TYPE "ExtensionRequestStatus" AS ENUM ('pending', 'paid', 'failed', 'canceled');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "valid_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "extension_requests" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "ExtensionRequestStatus" NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "months" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "extension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_extension_requests_user_created" ON "extension_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_extension_requests_order" ON "extension_requests"("order_id");

-- CreateIndex
CREATE INDEX "idx_orders_aishe_id" ON "orders"("aishe_id");

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
