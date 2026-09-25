PRAGMA foreign_keys = ON;

ALTER TABLE purchase_transactions ADD COLUMN idempotency_key TEXT;
ALTER TABLE purchase_transactions ADD COLUMN partner_actor_id TEXT;
ALTER TABLE purchase_transactions ADD COLUMN member_actor_id TEXT;
ALTER TABLE purchase_transactions ADD COLUMN partner_rejection_reason TEXT;
ALTER TABLE purchase_transactions ADD COLUMN member_rejection_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_idempotency
  ON purchase_transactions(member_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE redemptions ADD COLUMN redeemed_by_partner_user_id TEXT;
ALTER TABLE redemptions ADD COLUMN verification_request_id TEXT;

ALTER TABLE transfer_requests ADD COLUMN sender_approved_by TEXT;
ALTER TABLE transfer_requests ADD COLUMN admin_approved_by TEXT;

CREATE INDEX IF NOT EXISTS idx_redemption_verification
  ON redemptions(approval_token_hash, status);

CREATE INDEX IF NOT EXISTS idx_transactions_idempotency
  ON purchase_transactions(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_transfers_release_at
  ON transfer_requests(status, release_at);
