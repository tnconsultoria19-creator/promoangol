PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_credentials (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MASTER_ADMIN', 'PARTNER_ADMIN', 'PARTNER_STAFF', 'MEMBER')),
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_credentials_id TEXT NOT NULL REFERENCES user_credentials(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  reference_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed additional membership plans
INSERT OR IGNORE INTO membership_plans (id, name, description, annual_fee_kz, upgrade_points, reward_multiplier_bps, status)
VALUES 
  ('preferred', 'Preferred', 'Elevated membership benefits', 50000, 5000, 11000, 'ACTIVE'),
  ('elite', 'Elite', 'Elite tier access with maximum rewards', 150000, 15000, 12500, 'ACTIVE');

-- Seed Partners
INSERT OR IGNORE INTO partners (id, name, legal_name, category, status, contact_name, phone, email, address)
VALUES
  ('partner_1', 'Hotel Alvalade', 'Alvalade Empreendimentos Hoteleiros S.A.', 'Hotelaria', 'ACTIVE', 'Rui Santos', '923111222', 'alvalade@promoangol.com', 'Avenida Comandante Gika, Luanda'),
  ('partner_2', 'Restaurante O Lume', 'Lume Gastronomia Lda.', 'Restaurantes', 'ACTIVE', 'Ana Mendes', '923333444', 'olume@promoangol.com', 'Rua da Ilha de Luanda, Luanda'),
  ('partner_3', 'Amandla Spa', 'Amandla Bem Estar S.A.', 'Beleza', 'ACTIVE', 'Cláudia Tomás', '923555666', 'amandla@promoangol.com', 'Rua Major Kanhangulo, Luanda');

-- Seed Partner Users
INSERT OR IGNORE INTO partner_users (id, partner_id, full_name, email, phone, role, status)
VALUES
  ('partner_user_admin_1', 'partner_1', 'Rui Santos', 'hotel_admin@promoangol.com', '923111222', 'OWNER', 'ACTIVE'),
  ('partner_user_staff_1', 'partner_1', 'João Carlos', 'hotel_staff@promoangol.com', '923111223', 'STAFF', 'ACTIVE'),
  ('partner_user_admin_2', 'partner_2', 'Ana Mendes', 'lume_admin@promoangol.com', '923333444', 'OWNER', 'ACTIVE'),
  ('partner_user_admin_3', 'partner_3', 'Cláudia Tomás', 'amandla_admin@promoangol.com', '923555666', 'OWNER', 'ACTIVE');

-- Seed Partner Listings
INSERT OR IGNORE INTO partner_listings (id, partner_id, title, description, category, base_price_kz, status)
VALUES
  ('listing_1', 'partner_1', 'Estadia Suite Deluxe', 'Uma noite luxuosa para duas pessoas com pequeno almoço incluído.', 'Hotelaria', 80000, 'ACTIVE'),
  ('listing_2', 'partner_1', 'Jantar Romântico de Gala', 'Menu degustação de 3 pratos com vista para a piscina.', 'Hotelaria', 25000, 'ACTIVE'),
  ('listing_3', 'partner_2', 'Menu de Degustação Executivo', 'Almoço gourmet rápido e refinado.', 'Restaurantes', 18000, 'ACTIVE'),
  ('listing_4', 'partner_3', 'Massagem de Aromaterapia', 'Sessão relaxante de 60 minutos com óleos essenciais.', 'Beleza', 20000, 'ACTIVE');

-- Seed Promotions (partners do not create promotions, Admin creates them)
INSERT OR IGNORE INTO promotions (id, listing_id, title, description, status, current_version_id)
VALUES
  ('promo_1', 'listing_1', 'Estadia Premium Suite Deluxe', 'Poupe na sua estadia na Suite Deluxe.', 'ACTIVE', 'promo_version_1'),
  ('promo_2', 'listing_2', 'Jantar de Gala Exclusivo', 'Benefício exclusivo para jantares de gala.', 'ACTIVE', 'promo_version_2'),
  ('promo_3', 'listing_3', 'Almoço Executivo Gourmet', 'Poupe no seu almoço com pontos ou descontos.', 'ACTIVE', 'promo_version_3'),
  ('promo_4', 'listing_4', 'Massagem de Aromaterapia Relaxante', 'Recompensa especial de bem-estar.', 'ACTIVE', 'promo_version_4');

-- Seed Promotion Versions
INSERT OR IGNORE INTO promotion_versions (id, promotion_id, version_number, commission_mode, commission_value, benefit_mode, benefit_value, delivery_mode, member_benefit_kz, platform_margin_kz, valid_from, valid_until, created_by)
VALUES
  ('promo_version_1', 'promo_1', 1, 'PERCENT_OF_PURCHASE', 15.0, 'PERCENT_OF_COMMISSION', 80.0, 'POINTS', 9600, 2400, '2026-01-01', '2027-12-31', 'admin_user'),
  ('promo_version_2', 'promo_2', 1, 'FIXED_KZ', 5000.0, 'FULL_COMMISSION', NULL, 'DISCOUNT', 5000, 0, '2026-01-01', '2027-12-31', 'admin_user'),
  ('promo_version_3', 'promo_3', 1, 'PERCENT_OF_PURCHASE', 10.0, 'PERCENT_OF_COMMISSION', 50.0, 'POINTS', 900, 900, '2026-01-01', '2027-12-31', 'admin_user'),
  ('promo_version_4', 'promo_4', 1, 'PERCENT_OF_PURCHASE', 20.0, 'PERCENT_OF_COMMISSION', 75.0, 'POINTS', 3000, 1000, '2026-01-01', '2027-12-31', 'admin_user');

-- Seed Members
INSERT OR IGNORE INTO members (id, member_number, full_name, email, phone, joined_at, membership_status, membership_plan_id, account_state)
VALUES
  ('member_id_1', 'PA923456789', 'António Silva', 'member@promoangol.com', '923456789', '2026-01-15', 'ACTIVE', 'standard', 'NORMAL'),
  ('member_id_2', 'PA923111222', 'Maria Domingos', 'elite_member@promoangol.com', '923111222', '2026-02-20', 'ACTIVE', 'elite', 'NORMAL');

-- Seed Initial Points Ledger entries to give members starting balances
-- member_1 gets 5000 points (AVAILABLE)
INSERT OR IGNORE INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id, expires_at)
VALUES
  ('ledger_init_1', 'member_id_1', 'AVAILABLE', 'CREDIT', 5000, 'Saldo inicial de boas-vindas', 'SYSTEM', 'INITIAL', '2027-01-15'),
  ('ledger_init_2', 'member_id_2', 'AVAILABLE', 'CREDIT', 25000, 'Saldo inicial de boas-vindas', 'SYSTEM', 'INITIAL', '2027-02-20');

-- Seed User Credentials
-- Password hashes (SHA-256):
-- admin123 -> c7ad44cbad762a5da0a452f9e854fdc1e0e69e075d128b71c8b211a774f96409
-- partner123 -> 3f03b22b10499d0e19cfb34d72851dbe59da8cf834246ed80ee9dc779bf18408
-- staff123 -> 4e77353f86e300185e6cb2a297746cb98dfd76378c8a14ec86813470cc0662df
-- member123 -> 524f2b93bc67db6f0ec43b179373976379f8fa19a9735d688cf411aa6027a69b
INSERT OR IGNORE INTO user_credentials (id, email, password_hash, role, reference_id)
VALUES
  ('cred_admin', 'admin@promoangol.com', 'c7ad44cbad762a5da0a452f9e854fdc1e0e69e075d128b71c8b211a774f96409', 'MASTER_ADMIN', NULL),
  ('cred_partner_1', 'hotel_admin@promoangol.com', '3f03b22b10499d0e19cfb34d72851dbe59da8cf834246ed80ee9dc779bf18408', 'PARTNER_ADMIN', 'partner_user_admin_1'),
  ('cred_partner_staff_1', 'hotel_staff@promoangol.com', '4e77353f86e300185e6cb2a297746cb98dfd76378c8a14ec86813470cc0662df', 'PARTNER_STAFF', 'partner_user_staff_1'),
  ('cred_partner_2', 'lume_admin@promoangol.com', '3f03b22b10499d0e19cfb34d72851dbe59da8cf834246ed80ee9dc779bf18408', 'PARTNER_ADMIN', 'partner_user_admin_2'),
  ('cred_member_1', 'member@promoangol.com', '524f2b93bc67db6f0ec43b179373976379f8fa19a9735d688cf411aa6027a69b', 'MEMBER', 'member_id_1'),
  ('cred_member_2', 'elite_member@promoangol.com', '524f2b93bc67db6f0ec43b179373976379f8fa19a9735d688cf411aa6027a69b', 'MEMBER', 'member_id_2');
