-- AlterTable
ALTER TABLE "conversions" ADD COLUMN "order_id" UUID;

-- AlterTable
ALTER TABLE "referral_rewards" ADD COLUMN "order_id" UUID,
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "conversions_order_id_key" ON "conversions"("order_id");

-- CreateIndex
CREATE INDEX "idx_referral_rewards_user_created" ON "referral_rewards"("referral_user_id", "created_at");

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
