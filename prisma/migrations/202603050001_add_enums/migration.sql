-- Add enum types to align database with Prisma schema
DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('active', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UserRoleType" AS ENUM ('admin', 'affiliate', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WinnerType" AS ENUM ('affiliate', 'referral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommissionType" AS ENUM ('fixed', 'percentage', 'tiered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "LedgerEntryType" AS ENUM ('credit', 'debit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReferralRewardStatus" AS ENUM ('pending', 'approved', 'credited');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'failed', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderAttributionType" AS ENUM ('none', 'affiliate', 'referral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE conversions
  DROP CONSTRAINT IF EXISTS conversions_winner_type_check,
  DROP CONSTRAINT IF EXISTS conversions_winner_consistency_check;

ALTER TABLE affiliate_ledger
  DROP CONSTRAINT IF EXISTS affiliate_ledger_type_check;

ALTER TABLE users
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "UserStatus" USING status::"UserStatus",
  ALTER COLUMN status SET DEFAULT 'active'::"UserStatus";

ALTER TABLE user_roles
  ALTER COLUMN role TYPE "UserRoleType" USING role::"UserRoleType";

ALTER TABLE conversions
  ALTER COLUMN winner_type TYPE "WinnerType" USING winner_type::"WinnerType";

ALTER TABLE orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "OrderStatus" USING status::"OrderStatus",
  ALTER COLUMN status SET DEFAULT 'pending'::"OrderStatus",
  ALTER COLUMN attribution_type DROP DEFAULT,
  ALTER COLUMN attribution_type TYPE "OrderAttributionType" USING attribution_type::"OrderAttributionType",
  ALTER COLUMN attribution_type SET DEFAULT 'none'::"OrderAttributionType";

ALTER TABLE commissions
  ALTER COLUMN type TYPE "CommissionType" USING type::"CommissionType",
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "CommissionStatus" USING status::"CommissionStatus",
  ALTER COLUMN status SET DEFAULT 'pending'::"CommissionStatus";

ALTER TABLE affiliate_payouts
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "PayoutStatus" USING status::"PayoutStatus",
  ALTER COLUMN status SET DEFAULT 'pending'::"PayoutStatus";

ALTER TABLE affiliate_ledger
  ALTER COLUMN type TYPE "LedgerEntryType" USING type::"LedgerEntryType";

ALTER TABLE referral_rewards
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "ReferralRewardStatus" USING status::"ReferralRewardStatus",
  ALTER COLUMN status SET DEFAULT 'pending'::"ReferralRewardStatus";

ALTER TABLE conversions
  ADD CONSTRAINT conversions_winner_type_check
    CHECK (winner_type IN ('affiliate'::"WinnerType", 'referral'::"WinnerType")),
  ADD CONSTRAINT conversions_winner_consistency_check
    CHECK (
      (winner_type = 'affiliate'::"WinnerType" AND affiliate_id IS NOT NULL AND winner_id = affiliate_id)
      OR
      (winner_type = 'referral'::"WinnerType" AND referral_id IS NOT NULL AND winner_id = referral_id)
    );

ALTER TABLE affiliate_ledger
  ADD CONSTRAINT affiliate_ledger_type_check
    CHECK (type IN ('credit'::"LedgerEntryType", 'debit'::"LedgerEntryType"));
