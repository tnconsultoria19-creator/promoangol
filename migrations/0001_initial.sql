PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  annual_fee_kz INTEGER NOT NULL DEFAULT 0 CHECK (annual_fee_kz >= 0),
  upgrade_points INTEGER CHECK (upgrade_points IS NULL OR upgrade_points > 0),
  reward_multiplier_bps INTEGER NOT NULL DEFAULT 10000 CHECK (reward_multiplier_bps > 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  member_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  joined_at TEXT NOT NULL,
  membership_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (membership_status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
  membership_plan_id TEXT NOT NULL REFERENCES membership_plans(id),
  membership_expires_at TEXT,
  account_state TEXT NOT NULL DEFAULT 'NORMAL' CHECK (account_state IN ('NORMAL', 'FROZEN')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS membership_subscriptions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id),
  plan_id TEXT NOT NULL REFERENCES membership_plans(id),
  paid_amount_kz INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount_kz >= 0),
  paid_at TEXT,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
  payment_reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_users (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('OWNER', 'MANAGER', 'STAFF')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_listings (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price_kz INTEGER NOT NULL CHECK (base_price_kz >= 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES partner_listings(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED')),
  current_version_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS promotion_versions (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES promotions(id),
  version_number INTEGER NOT NULL,
  commission_mode TEXT NOT NULL CHECK (commission_mode IN ('PERCENT_OF_PURCHASE', 'FIXED_KZ')),
  commission_value REAL NOT NULL CHECK (commission_value >= 0),
  benefit_mode TEXT NOT NULL CHECK (benefit_mode IN ('FIXED_KZ', 'PERCENT_OF_COMMISSION', 'FULL_COMMISSION')),
  benefit_value REAL,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('POINTS', 'DISCOUNT')),
  member_benefit_kz INTEGER NOT NULL CHECK (member_benefit_kz >= 0),
  platform_margin_kz INTEGER NOT NULL CHECK (platform_margin_kz >= 0),
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  availability_rule TEXT,
  eligibility_rule TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (promotion_id, version_number)
);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  r2_object_key TEXT NOT NULL,
  original_filename TEXT,
  content_type TEXT,
  sha256 TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  member_id TEXT NOT NULL REFERENCES members(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  listing_id TEXT NOT NULL REFERENCES partner_listings(id),
  promotion_version_id TEXT NOT NULL REFERENCES promotion_versions(id),
  amount_paid_kz INTEGER NOT NULL CHECK (amount_paid_kz >= 0),
  commission_kz INTEGER NOT NULL CHECK (commission_kz >= 0),
  member_benefit_kz INTEGER NOT NULL CHECK (member_benefit_kz >= 0),
  points_to_release INTEGER NOT NULL DEFAULT 0 CHECK (points_to_release >= 0),
  reward_release_at TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_MEMBER_CONFIRMATION' CHECK (status IN ('PENDING_PARTNER_CONFIRMATION', 'PENDING_MEMBER_CONFIRMATION', 'VERIFIED', 'REJECTED', 'DISPUTED', 'REVERSED')),
  member_confirmed_at TEXT,
  partner_confirmed_at TEXT,
  verified_at TEXT,
  proof_received_at TEXT,
  reversal_of_transaction_id TEXT REFERENCES purchase_transactions(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id),
  bucket TEXT NOT NULL CHECK (bucket IN ('PENDING', 'AVAILABLE', 'RESERVED')),
  direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  points INTEGER NOT NULL CHECK (points > 0),
  reason TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  expires_at TEXT,
  source_entry_id TEXT REFERENCES points_ledger(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  redemption_number TEXT NOT NULL UNIQUE,
  member_id TEXT NOT NULL REFERENCES members(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  listing_id TEXT NOT NULL REFERENCES partner_listings(id),
  promotion_version_id TEXT REFERENCES promotion_versions(id),
  points_requested INTEGER NOT NULL CHECK (points_requested >= 800),
  cash_amount_kz INTEGER NOT NULL DEFAULT 0 CHECK (cash_amount_kz >= 0),
  requested_for_date TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'AWAITING_PARTNER', 'AWAITING_ADMIN', 'APPROVED', 'REJECTED', 'CANCELLED', 'USED', 'EXPIRED')),
  partner_response TEXT,
  admin_approved_by TEXT,
  admin_approved_at TEXT,
  approval_token_hash TEXT,
  approval_expires_at TEXT,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transfer_requests (
  id TEXT PRIMARY KEY,
  transfer_number TEXT NOT NULL UNIQUE,
  recipient_member_id TEXT NOT NULL REFERENCES members(id),
  sender_member_id TEXT NOT NULL REFERENCES members(id),
  points INTEGER NOT NULL CHECK (points > 0),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'SENDER_APPROVED', 'ADMIN_APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
  sender_approved_at TEXT,
  admin_approved_at TEXT,
  release_at TEXT,
  completed_at TEXT,
  rejection_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_settlements (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  gross_redemptions_kz INTEGER NOT NULL DEFAULT 0,
  adjustments_kz INTEGER NOT NULL DEFAULT 0,
  net_payable_kz INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'READY', 'PAID', 'VOID')),
  generated_at TEXT,
  paid_at TEXT,
  bank_reference TEXT,
  UNIQUE (partner_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS settlement_lines (
  id TEXT PRIMARY KEY,
  settlement_id TEXT NOT NULL REFERENCES partner_settlements(id),
  redemption_id TEXT REFERENCES redemptions(id),
  transaction_number TEXT,
  amount_kz INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member_benefits (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id),
  plan_id TEXT NOT NULL REFERENCES membership_plans(id),
  benefit_name TEXT NOT NULL,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('SERVICE', 'DISCOUNT', 'PROMOTION')),
  quantity_granted INTEGER NOT NULL DEFAULT 1 CHECK (quantity_granted >= 0),
  quantity_used INTEGER NOT NULL DEFAULT 0 CHECK (quantity_used >= 0),
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'PARTIALLY_USED', 'USED', 'EXPIRED', 'REVOKED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS calendar_exceptions (
  date TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_working_day INTEGER NOT NULL DEFAULT 0 CHECK (is_working_day IN (0,1))
);

CREATE TABLE IF NOT EXISTS system_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  request_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_members_member_number ON members(member_number);
CREATE INDEX IF NOT EXISTS idx_members_plan ON members(membership_plan_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotion_versions_promotion ON promotion_versions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON purchase_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner ON purchase_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON purchase_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ledger_member_bucket ON points_ledger(member_id, bucket);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON points_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_member ON redemptions(member_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_partner ON redemptions(partner_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_transfers_sender ON transfer_requests(sender_member_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient ON transfer_requests(recipient_member_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);

INSERT OR IGNORE INTO membership_plans (id, name, description, annual_fee_kz, upgrade_points, reward_multiplier_bps)
VALUES ('standard', 'Standard', 'Free PromoAngol membership', 0, NULL, 10000);

CREATE VIEW IF NOT EXISTS member_point_balances AS
SELECT
  member_id,
  COALESCE(SUM(CASE WHEN bucket = 'PENDING' THEN CASE WHEN direction = 'CREDIT' THEN points ELSE -points END ELSE 0 END), 0) AS pending_points,
  COALESCE(SUM(CASE WHEN bucket = 'AVAILABLE' THEN CASE WHEN direction = 'CREDIT' THEN points ELSE -points END ELSE 0 END), 0) AS available_points,
  COALESCE(SUM(CASE WHEN bucket = 'RESERVED' THEN CASE WHEN direction = 'CREDIT' THEN points ELSE -points END ELSE 0 END), 0) AS reserved_points
FROM points_ledger
GROUP BY member_id;

CREATE VIEW IF NOT EXISTS transaction_accounting AS
SELECT
  t.transaction_number,
  t.created_at,
  t.member_id,
  m.member_number,
  m.full_name AS member_name,
  t.partner_id,
  p.name AS partner_name,
  l.title AS listing_title,
  t.amount_paid_kz,
  t.commission_kz,
  t.member_benefit_kz,
  (t.commission_kz - t.member_benefit_kz) AS platform_margin_kz,
  t.points_to_release,
  t.status,
  t.verified_at
FROM purchase_transactions t
JOIN members m ON m.id = t.member_id
JOIN partners p ON p.id = t.partner_id
JOIN partner_listings l ON l.id = t.listing_id;

CREATE VIEW IF NOT EXISTS partner_settlement_detail AS
SELECT
  ps.id AS settlement_id,
  ps.partner_id,
  p.name AS partner_name,
  ps.period_start,
  ps.period_end,
  sl.redemption_id,
  r.redemption_number,
  r.member_id,
  m.member_number,
  m.full_name AS member_name,
  sl.amount_kz,
  sl.description,
  ps.status AS settlement_status,
  ps.net_payable_kz
FROM partner_settlements ps
JOIN partners p ON p.id = ps.partner_id
JOIN settlement_lines sl ON sl.settlement_id = ps.id
LEFT JOIN redemptions r ON r.id = sl.redemption_id
LEFT JOIN members m ON m.id = r.member_id;
