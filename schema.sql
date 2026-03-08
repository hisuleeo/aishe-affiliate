-- AISHE Affiliate & Referral Schema (PostgreSQL)
-- Generated: 2026-03-03

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Users & Roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  PRIMARY KEY (user_id, role)
);

-- 2) Programs & Campaigns
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  attribution_window_days INT NOT NULL DEFAULT 30,
  cookie_ttl_days INT NOT NULL DEFAULT 30,
  default_currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);

-- 3) Affiliate Flow
CREATE TABLE affiliate_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  payout_method TEXT,
  payout_details JSONB,
  tax_info JSONB
);

CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  cookie_id TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Attribution & Conversions (Single Winner)
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  external_order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  conversion_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  affiliate_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_type TEXT NOT NULL,
  winner_id UUID NOT NULL,
  CONSTRAINT conversions_winner_type_check
    CHECK (winner_type IN ('affiliate', 'referral')),
  CONSTRAINT conversions_winner_consistency_check
    CHECK (
      (winner_type = 'affiliate' AND affiliate_id IS NOT NULL AND winner_id = affiliate_id)
      OR
      (winner_type = 'referral' AND referral_id IS NOT NULL AND winner_id = referral_id)
    )
);

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  commission_rate NUMERIC(6, 4) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT NOT NULL,
  min_sales_threshold INT NOT NULL,
  commission_rate NUMERIC(6, 4) NOT NULL,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  attribution_type TEXT NOT NULL DEFAULT 'none',
  affiliate_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT,
  referral_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Tiered Commissions
CREATE TABLE commission_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  min_sales_threshold NUMERIC(18, 4) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(6, 4) NOT NULL,
  currency CHAR(3) NOT NULL
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversion_id UUID NOT NULL UNIQUE REFERENCES conversions(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES commission_tiers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- 6) Affiliate Ledger (Liability)
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ
);

CREATE TABLE affiliate_payout_items (
  payout_id UUID NOT NULL REFERENCES affiliate_payouts(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  PRIMARY KEY (payout_id, commission_id)
);

CREATE TABLE affiliate_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_ledger_type_check CHECK (type IN ('credit', 'debit'))
);

-- 7) Referral Flow (Internal Credit)
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE
);

CREATE TABLE referral_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  target TEXT NOT NULL,
  channel TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referral_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_id UUID NOT NULL REFERENCES referral_invites(id) ON DELETE CASCADE,
  new_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signup_id UUID NOT NULL REFERENCES referral_signups(id) ON DELETE CASCADE,
  amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE referral_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  ref_type TEXT NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_credits_type_check CHECK (type IN ('credit', 'debit'))
);

-- 8) Webhook & Audit
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (event_type, external_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clicks_cookie_clicked_at ON clicks (cookie_id, clicked_at);
CREATE INDEX idx_clicks_affiliate_link ON clicks (affiliate_link_id);
CREATE INDEX idx_conversions_conversion_at ON conversions (conversion_at);
CREATE INDEX idx_commissions_affiliate_status ON commissions (affiliate_id, status);
CREATE INDEX idx_affiliate_ledger_affiliate_created ON affiliate_ledger (affiliate_id, created_at);
CREATE INDEX idx_referral_credits_user_created ON referral_credits (referral_user_id, created_at);
CREATE INDEX idx_orders_buyer_created ON orders (buyer_id, created_at);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_commission_rules_active_threshold ON commission_rules (is_active, min_sales_threshold);
CREATE INDEX idx_commission_rules_package_priority ON commission_rules (package_id, priority);
