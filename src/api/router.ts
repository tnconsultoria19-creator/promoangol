import { json } from "../lib";
import { calculatePromotionEconomics } from "../domain/economics";
import type { CommissionMode, BenefitMode, MemberBenefitDelivery } from "../domain/economics";
import { addWorkingDays, membershipRewardExpiry } from "../domain/business-calendar";

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, { status: response.status, headers });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSession(request: Request, env: Env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);

  const sessions = await env.PROMOANGOL_DB.prepare(`
    SELECT s.id, s.user_credentials_id, s.role, s.reference_id, c.email,
           m.full_name AS member_name,
           m.member_number AS member_number,
           m.membership_plan_id AS membership_plan_id,
           u.full_name AS partner_user_name,
           u.partner_id AS partner_id
    FROM user_sessions s
    JOIN user_credentials c ON c.id = s.user_credentials_id
    LEFT JOIN members m ON m.id = s.reference_id AND s.role = 'MEMBER'
    LEFT JOIN partner_users u ON u.id = s.reference_id AND s.role IN ('PARTNER_ADMIN', 'PARTNER_STAFF')
    WHERE s.id = ? AND datetime('now') < datetime(s.expires_at)
  `).bind(token).all();

  if (!sessions.results || sessions.results.length === 0) return null;
  return sessions.results[0] as {
    id: string;
    user_credentials_id: string;
    role: "MASTER_ADMIN" | "PARTNER_ADMIN" | "PARTNER_STAFF" | "MEMBER";
    reference_id: string | null;
    email: string;
    member_name?: string;
    member_number?: string;
    membership_plan_id?: string;
    partner_user_name?: string;
    partner_id?: string;
  };
}

async function createAuditLog(
  env: Env,
  actor: { role: string; id: string | null },
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  requestId: string
) {
  await env.PROMOANGOL_DB.prepare(`
    INSERT INTO audit_log (id, actor_type, actor_id, action, entity_type, entity_id, before_json, after_json, request_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    actor.role,
    actor.id || "system",
    action,
    entityType,
    entityId,
    before ? JSON.stringify(before) : null,
    after ? JSON.stringify(after) : null,
    requestId
  ).run();
}

export async function apiRouter(request: Request, env: Env): Promise<Response> {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  try {
    // -------------------------------------------------------------
    // HEALTH ENDPOINT
    // -------------------------------------------------------------
    if (url.pathname === "/api/health" && request.method === "GET") {
      return withRequestId(
        json({ ok: true, service: "promoangol", timestamp: new Date().toISOString() }),
        requestId
      );
    }

    // -------------------------------------------------------------
    // PUBLIC CATALOG
    // -------------------------------------------------------------
    if (
      (url.pathname === "/api/catalog/promotions" || url.pathname === "/api/catalog/weekly") &&
      request.method === "GET"
    ) {
      const rows = await env.PROMOANGOL_DB.prepare(`
        SELECT
          p.id,
          p.title,
          p.description,
          l.title AS listing_title,
          l.base_price_kz,
          pt.name AS partner_name,
          pt.category AS partner_category,
          pv.valid_from,
          pv.valid_until,
          pv.delivery_mode,
          pv.member_benefit_kz,
          pv.commission_mode,
          pv.commission_value,
          pv.benefit_mode,
          pv.benefit_value
        FROM promotions p
        JOIN promotion_versions pv ON pv.id = p.current_version_id
        JOIN partner_listings l ON l.id = p.listing_id
        JOIN partners pt ON pt.id = l.partner_id
        WHERE p.status = 'ACTIVE'
          AND date('now') >= date(pv.valid_from)
          AND (pv.valid_until IS NULL OR date('now') <= date(pv.valid_until))
        ORDER BY p.created_at DESC
      `).all();

      return withRequestId(
        json(
          {
            promotions: rows.results ?? [],
            generatedAt: new Date().toISOString(),
          },
          { headers: { "Cache-Control": "no-store" } }
        ),
        requestId
      );
    }

    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = (await request.json()) as { email?: string; password?: string };
      if (!body.email || !body.password) {
        return withRequestId(json({ error: "BAD_REQUEST", message: "Email and password are required" }, { status: 400 }), requestId);
      }

      const inputHash = await hashPassword(body.password);
      const user = await env.PROMOANGOL_DB.prepare(`
        SELECT id, email, password_hash, role, reference_id
        FROM user_credentials
        WHERE email = ?
      `).bind(body.email.toLowerCase().trim()).first<{
        id: string;
        email: string;
        password_hash: string;
        role: "MASTER_ADMIN" | "PARTNER_ADMIN" | "PARTNER_STAFF" | "MEMBER";
        reference_id: string | null;
      }>();

      if (!user || user.password_hash !== inputHash) {
        return withRequestId(json({ error: "UNAUTHORIZED", message: "Credenciais inválidas" }, { status: 401 }), requestId);
      }

      // Check freezes/suspensions
      if (user.role === "MEMBER" && user.reference_id) {
        const member = await env.PROMOANGOL_DB.prepare("SELECT account_state, membership_status FROM members WHERE id = ?").bind(user.reference_id).first<{ account_state: string; membership_status: string }>();
        if (member && (member.account_state === "FROZEN" || member.membership_status === "SUSPENDED")) {
          return withRequestId(json({ error: "ACCOUNT_LOCKED", message: "A sua conta PromoAngol está suspensa ou congelada. Contacte o suporte." }, { status: 403 }), requestId);
        }
      } else if ((user.role === "PARTNER_ADMIN" || user.role === "PARTNER_STAFF") && user.reference_id) {
        const staff = await env.PROMOANGOL_DB.prepare("SELECT status, partner_id FROM partner_users WHERE id = ?").bind(user.reference_id).first<{ status: string; partner_id: string }>();
        if (staff && staff.status !== "ACTIVE") {
          return withRequestId(json({ error: "ACCOUNT_LOCKED", message: "O seu utilizador está suspenso." }, { status: 403 }), requestId);
        }
        if (staff) {
          const partner = await env.PROMOANGOL_DB.prepare("SELECT status FROM partners WHERE id = ?").bind(staff.partner_id).first<{ status: string }>();
          if (partner && partner.status !== "ACTIVE") {
            return withRequestId(json({ error: "PARTNER_LOCKED", message: "A conta da empresa parceira não está activa." }, { status: 403 }), requestId);
          }
        }
      }

      // Generate Session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours session
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO user_sessions (id, user_credentials_id, role, reference_id, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(sessionId, user.id, user.role, user.reference_id, expiresAt).run();

      // Retrieve display details
      let name = "Administrador";
      let detail = "";
      if (user.role === "MEMBER" && user.reference_id) {
        const m = await env.PROMOANGOL_DB.prepare("SELECT full_name, member_number FROM members WHERE id = ?").bind(user.reference_id).first<{ full_name: string; member_number: string }>();
        name = m?.full_name || name;
        detail = m?.member_number || detail;
      } else if ((user.role === "PARTNER_ADMIN" || user.role === "PARTNER_STAFF") && user.reference_id) {
        const u = await env.PROMOANGOL_DB.prepare(`
          SELECT u.full_name, p.name AS partner_name
          FROM partner_users u
          JOIN partners p ON p.id = u.partner_id
          WHERE u.id = ?
        `).bind(user.reference_id).first<{ full_name: string; partner_name: string }>();
        name = u?.full_name || name;
        detail = u?.partner_name || detail;
      }

      await createAuditLog(env, { role: user.role, id: user.reference_id }, "LOGIN", "SESSION", sessionId, null, { email: user.email }, requestId);

      return withRequestId(
        json({
          token: sessionId,
          role: user.role,
          email: user.email,
          referenceId: user.reference_id,
          name,
          detail,
          expiresAt,
        }),
        requestId
      );
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const body = (await request.json()) as { full_name?: string; email?: string; password?: string; phone?: string };
      if (!body.full_name || !body.email || !body.password) {
        return withRequestId(json({ error: "BAD_REQUEST", message: "Preencha o nome, email e palavra-passe." }, { status: 400 }), requestId);
      }

      const email = body.email.toLowerCase().trim();
      const existing = await env.PROMOANGOL_DB.prepare("SELECT id FROM user_credentials WHERE email = ?").bind(email).first();
      if (existing) {
        return withRequestId(json({ error: "CONFLICT", message: "Este email já está registado na plataforma." }, { status: 409 }), requestId);
      }

      const memberId = crypto.randomUUID();
      const randomNum = Math.floor(100000000 + Math.random() * 900000000);
      const memberNumber = `PA${randomNum}`;
      const joinedAt = new Date().toISOString().slice(0, 10);

      // Create Member row
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO members (id, member_number, full_name, email, phone, joined_at, membership_status, membership_plan_id, account_state)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 'standard', 'NORMAL')
      `).bind(memberId, memberNumber, body.full_name, email, body.phone || null, joinedAt).run();

      // Create User Credentials
      const credId = crypto.randomUUID();
      const pwdHash = await hashPassword(body.password);
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO user_credentials (id, email, password_hash, role, reference_id)
        VALUES (?, ?, ?, 'MEMBER', ?)
      `).bind(credId, email, pwdHash, memberId).run();

      // Welcome point reward (1000 points, expires in 12 months)
      const ledgerId = crypto.randomUUID();
      const expiry = membershipRewardExpiry(new Date());
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id, expires_at)
        VALUES (?, ?, 'AVAILABLE', 'CREDIT', 1000, 'Boas-vindas à PromoAngol', 'SYSTEM', 'WELCOME_GIFT', ?)
      `).bind(ledgerId, memberId, expiry.toISOString()).run();

      await createAuditLog(env, { role: "MEMBER", id: memberId }, "REGISTER", "MEMBER", memberId, null, { email }, requestId);

      return withRequestId(json({ success: true, memberNumber, email }), requestId);
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        await env.PROMOANGOL_DB.prepare("DELETE FROM user_sessions WHERE id = ?").bind(token).run();
      }
      return withRequestId(json({ success: true }), requestId);
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const session = await getSession(request, env);
      if (!session) {
        return withRequestId(json({ error: "UNAUTHORIZED" }, { status: 401 }), requestId);
      }
      return withRequestId(json({ user: session }), requestId);
    }

    // -------------------------------------------------------------
    // PROTECTED SERVICES ROUTING
    // -------------------------------------------------------------
    const session = await getSession(request, env);
    if (!session) {
      return withRequestId(json({ error: "AUTH_REQUIRED", message: "Inicie sessão para aceder." }, { status: 401 }), requestId);
    }

    // Double check state
    if (session.role === "MEMBER") {
      const mState = await env.PROMOANGOL_DB.prepare("SELECT account_state, membership_status FROM members WHERE id = ?").bind(session.reference_id).first<{ account_state: string; membership_status: string }>();
      if (!mState || mState.account_state === "FROZEN" || mState.membership_status === "SUSPENDED") {
        return withRequestId(json({ error: "ACCOUNT_LOCKED", message: "A sua conta está congelada ou suspensa." }, { status: 403 }), requestId);
      }
    }

    // -------------------------------------------------------------
    // MEMBER ENDPOINTS
    // -------------------------------------------------------------
    if (session.role === "MEMBER") {
      const memberId = session.reference_id!;

      if (url.pathname === "/api/member/summary" && request.method === "GET") {
        // Balances
        const balance = await env.PROMOANGOL_DB.prepare(`
          SELECT * FROM member_point_balances WHERE member_id = ?
        `).bind(memberId).first<{ pending_points: number; available_points: number; reserved_points: number }>();

        // Plan
        const mInfo = await env.PROMOANGOL_DB.prepare(`
          SELECT m.member_number, m.full_name, m.email, m.phone, m.joined_at, p.name AS plan_name, p.reward_multiplier_bps
          FROM members m
          JOIN membership_plans p ON p.id = m.membership_plan_id
          WHERE m.id = ?
        `).bind(memberId).first<{ member_number: string; full_name: string; email: string; phone: string; joined_at: string; plan_name: string; reward_multiplier_bps: number }>();

        // Recent purchases
        const purchases = await env.PROMOANGOL_DB.prepare(`
          SELECT t.id, t.transaction_number, t.amount_paid_kz, t.member_benefit_kz, t.points_to_release, t.status, t.created_at,
                 p.name AS partner_name, l.title AS listing_title
          FROM purchase_transactions t
          JOIN partners p ON p.id = t.partner_id
          JOIN partner_listings l ON l.id = t.listing_id
          WHERE t.member_id = ?
          ORDER BY t.created_at DESC LIMIT 5
        `).bind(memberId).all();

        // Recent redemptions
        const redemptions = await env.PROMOANGOL_DB.prepare(`
          SELECT r.id, r.redemption_number, r.points_requested, r.cash_amount_kz, r.status, r.created_at,
                 p.name AS partner_name
          FROM redemptions r
          JOIN partners p ON p.id = r.partner_id
          WHERE r.member_id = ?
          ORDER BY r.created_at DESC LIMIT 5
        `).bind(memberId).all();

        // Pending approvals count
        const pendingPurchasesCount = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM purchase_transactions
          WHERE member_id = ? AND status = 'PENDING_MEMBER_CONFIRMATION'
        `).bind(memberId).first<{ count: number }>();

        return withRequestId(
          json({
            profile: mInfo,
            balances: balance || { pending_points: 0, available_points: 0, reserved_points: 0 },
            purchases: purchases.results ?? [],
            redemptions: redemptions.results ?? [],
            notifications: [
              { id: "n1", title: "Bem-vindo à plataforma!", message: "Acaba de ganhar 1,000 pontos por aderir à PromoAngol.", created_at: new Date().toISOString() }
            ],
            pendingPurchasesCount: pendingPurchasesCount?.count ?? 0,
          }),
          requestId
        );
      }

      if (url.pathname === "/api/member/transactions" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT t.id, t.transaction_number, t.amount_paid_kz, t.member_benefit_kz, t.points_to_release, t.status, t.created_at,
                 t.partner_confirmed_at, t.member_confirmed_at, t.verified_at,
                 p.name AS partner_name, l.title AS listing_title, pv.delivery_mode
          FROM purchase_transactions t
          JOIN partners p ON p.id = t.partner_id
          JOIN partner_listings l ON l.id = t.listing_id
          JOIN promotion_versions pv ON pv.id = t.promotion_version_id
          WHERE t.member_id = ?
          ORDER BY t.created_at DESC
        `).bind(memberId).all();

        const ledger = await env.PROMOANGOL_DB.prepare(`
          SELECT id, bucket, direction, points, reason, created_at, expires_at
          FROM points_ledger
          WHERE member_id = ?
          ORDER BY created_at DESC
        `).bind(memberId).all();

        return withRequestId(json({ purchases: rows.results ?? [], ledger: ledger.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/member/confirm-purchase" && request.method === "POST") {
        const body = (await request.json()) as { transaction_id?: string; action?: "CONFIRM" | "REJECT"; reason?: string };
        if (!body.transaction_id || !body.action) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Parâmetros em falta" }, { status: 400 }), requestId);
        }

        const transaction = await env.PROMOANGOL_DB.prepare(`
          SELECT id, status, points_to_release, transaction_number
          FROM purchase_transactions
          WHERE id = ? AND member_id = ?
        `).bind(body.transaction_id, memberId).first<{ id: string; status: string; points_to_release: number; transaction_number: string }>();

        if (!transaction) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Transacção não encontrada." }, { status: 404 }), requestId);
        }

        if (transaction.status !== "PENDING_MEMBER_CONFIRMATION") {
          return withRequestId(json({ error: "INVALID_STATE", message: "Transacção não está pendente de confirmação do membro." }, { status: 400 }), requestId);
        }

        const now = new Date().toISOString();
        if (body.action === "CONFIRM") {
          // Release dates: 3 working days from now
          const releaseDate = addWorkingDays(new Date(), 3).toISOString().slice(0, 10);

          await env.PROMOANGOL_DB.prepare(`
            UPDATE purchase_transactions
            SET status = 'VERIFIED', member_confirmed_at = ?, verified_at = ?, reward_release_at = ?, updated_at = ?
            WHERE id = ?
          `).bind(now, now, releaseDate, now, transaction.id).run();

          // Add a points ledger entry in 'PENDING' bucket
          if (transaction.points_to_release > 0) {
            await env.PROMOANGOL_DB.prepare(`
              INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id, expires_at)
              VALUES (?, ?, 'PENDING', 'CREDIT', ?, ?, 'PURCHASE', ?, ?)
            `).bind(
              crypto.randomUUID(),
              memberId,
              transaction.points_to_release,
              `Compra verificada - Transacção #${transaction.transaction_number}`,
              transaction.id,
              membershipRewardExpiry(new Date()).toISOString()
            ).run();
          }

          await createAuditLog(env, { role: "MEMBER", id: memberId }, "CONFIRM_PURCHASE", "TRANSACTION", transaction.id, { status: transaction.status }, { status: "VERIFIED" }, requestId);

          return withRequestId(json({ success: true, status: "VERIFIED" }), requestId);
        } else {
          await env.PROMOANGOL_DB.prepare(`
            UPDATE purchase_transactions
            SET status = 'REJECTED', member_confirmed_at = ?, member_rejection_reason = ?, updated_at = ?
            WHERE id = ?
          `).bind(now, body.reason || "Rejeitado pelo membro", now, transaction.id).run();

          await createAuditLog(env, { role: "MEMBER", id: memberId }, "REJECT_PURCHASE", "TRANSACTION", transaction.id, { status: transaction.status }, { status: "REJECTED", reason: body.reason }, requestId);

          return withRequestId(json({ success: true, status: "REJECTED" }), requestId);
        }
      }

      if (url.pathname === "/api/member/redemptions" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT r.id, r.redemption_number, r.points_requested, r.cash_amount_kz, r.status, r.created_at, r.approval_expires_at, r.used_at,
                 p.name AS partner_name, l.title AS listing_title
          FROM redemptions r
          JOIN partners p ON p.id = r.partner_id
          JOIN partner_listings l ON l.id = r.listing_id
          WHERE r.member_id = ?
          ORDER BY r.created_at DESC
        `).bind(memberId).all();

        return withRequestId(json({ redemptions: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/member/redemptions" && request.method === "POST") {
        const body = (await request.json()) as { listing_id?: string; points?: number };
        if (!body.listing_id || !body.points) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Indique a oferta e a quantidade de pontos." }, { status: 400 }), requestId);
        }

        const points = Math.floor(body.points);
        if (points < 800) {
          return withRequestId(json({ error: "LIMIT_ERROR", message: "O resgate mínimo é de 800 pontos (Kz 800)." }, { status: 400 }), requestId);
        }

        // Get available balance
        const balanceRow = await env.PROMOANGOL_DB.prepare(`
          SELECT available_points FROM member_point_balances WHERE member_id = ?
        `).bind(memberId).first<{ available_points: number }>();

        const available = balanceRow?.available_points ?? 0;
        if (available < points) {
          return withRequestId(json({ error: "INSUFFICIENT_FUNDS", message: `Pontos insuficientes. Tem apenas ${available} pontos disponíveis.` }, { status: 400 }), requestId);
        }

        // Get Listing info
        const listing = await env.PROMOANGOL_DB.prepare(`
          SELECT l.id, l.partner_id, l.base_price_kz, p.current_version_id
          FROM partner_listings l
          LEFT JOIN promotions p ON p.listing_id = l.id AND p.status = 'ACTIVE'
          WHERE l.id = ? AND l.status = 'ACTIVE'
        `).bind(body.listing_id).first<{ id: string; partner_id: string; base_price_kz: number; current_version_id: string | null }>();

        if (!listing) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Oferta não encontrada ou inativa." }, { status: 404 }), requestId);
        }

        // Cash component (if points < price)
        const cashAmount = Math.max(0, listing.base_price_kz - points);

        const redemptionId = crypto.randomUUID();
        const redNum = `RD${Math.floor(100000 + Math.random() * 900000)}`;

        // Debit points from AVAILABLE, credit to RESERVED in Ledger
        const debitId = crypto.randomUUID();
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
          VALUES (?, ?, 'AVAILABLE', 'DEBIT', ?, ?, 'REDEMPTION_RESERVE', ?)
        `).bind(debitId, memberId, points, `Reserva de pontos para resgate #${redNum}`, redemptionId).run();

        const creditId = crypto.randomUUID();
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
          VALUES (?, ?, 'RESERVED', 'CREDIT', ?, ?, 'REDEMPTION_RESERVE', ?)
        `).bind(creditId, memberId, points, `Reserva de pontos para resgate #${redNum}`, redemptionId).run();

        // Create redemption record (awaiting partner and admin)
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO redemptions (id, redemption_number, member_id, partner_id, listing_id, promotion_version_id, points_requested, cash_amount_kz, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED')
        `).bind(
          redemptionId,
          redNum,
          memberId,
          listing.partner_id,
          listing.id,
          listing.current_version_id,
          points,
          cashAmount
        ).run();

        await createAuditLog(env, { role: "MEMBER", id: memberId }, "REQUEST_REDEMPTION", "REDEMPTION", redemptionId, null, { points, cashAmount }, requestId);

        return withRequestId(json({ success: true, redemptionNumber: redNum, pointsRequested: points, cashAmountKz: cashAmount }), requestId);
      }

      if (url.pathname === "/api/member/transfers" && request.method === "GET") {
        const sent = await env.PROMOANGOL_DB.prepare(`
          SELECT t.id, t.transfer_number, t.points, t.status, t.created_at, t.release_at, t.completed_at,
                 m.full_name AS recipient_name, m.member_number AS recipient_number
          FROM transfer_requests t
          JOIN members m ON m.id = t.recipient_member_id
          WHERE t.sender_member_id = ?
          ORDER BY t.created_at DESC
        `).bind(memberId).all();

        const received = await env.PROMOANGOL_DB.prepare(`
          SELECT t.id, t.transfer_number, t.points, t.status, t.created_at, t.release_at, t.completed_at,
                 m.full_name AS sender_name, m.member_number AS sender_number
          FROM transfer_requests t
          JOIN members m ON m.id = t.sender_member_id
          WHERE t.recipient_member_id = ?
          ORDER BY t.created_at DESC
        `).bind(memberId).all();

        return withRequestId(json({ sent: sent.results ?? [], received: received.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/member/transfers" && request.method === "POST") {
        const body = (await request.json()) as { recipient_number?: string; points?: number };
        if (!body.recipient_number || !body.points) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Indique o destinatário e a quantidade de pontos." }, { status: 400 }), requestId);
        }

        const points = Math.floor(body.points);
        if (points <= 0) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Os pontos devem ser superiores a 0." }, { status: 400 }), requestId);
        }

        const recipient = await env.PROMOANGOL_DB.prepare(`
          SELECT id, full_name, membership_status, account_state FROM members
          WHERE member_number = ?
        `).bind(body.recipient_number.trim().toUpperCase()).first<{ id: string; full_name: string; membership_status: string; account_state: string }>();

        if (!recipient) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Destinatário PromoAngol não encontrado." }, { status: 404 }), requestId);
        }

        if (recipient.id === memberId) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Não pode transferir pontos para si mesmo." }, { status: 400 }), requestId);
        }

        if (recipient.account_state === "FROZEN" || recipient.membership_status !== "ACTIVE") {
          return withRequestId(json({ error: "LOCKED_RECIPIENT", message: "A conta do destinatário está suspensa ou inactiva." }, { status: 403 }), requestId);
        }

        // Get sender available balance
        const balanceRow = await env.PROMOANGOL_DB.prepare(`
          SELECT available_points FROM member_point_balances WHERE member_id = ?
        `).bind(memberId).first<{ available_points: number }>();

        const available = balanceRow?.available_points ?? 0;
        if (available < points) {
          return withRequestId(json({ error: "INSUFFICIENT_FUNDS", message: `Pontos insuficientes. Tem apenas ${available} pontos disponíveis.` }, { status: 400 }), requestId);
        }

        const transferId = crypto.randomUUID();
        const trNum = `TR${Math.floor(100000 + Math.random() * 900000)}`;

        // Debit points from sender's AVAILABLE, credit to RESERVED
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
          VALUES (?, ?, 'AVAILABLE', 'DEBIT', ?, ?, 'TRANSFER_RESERVE', ?)
        `).bind(crypto.randomUUID(), memberId, points, `Reserva para transferência #${trNum} para ${recipient.full_name}`, transferId).run();

        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
          VALUES (?, ?, 'RESERVED', 'CREDIT', ?, ?, 'TRANSFER_RESERVE', ?)
        `).bind(crypto.randomUUID(), memberId, points, `Reserva para transferência #${trNum} para ${recipient.full_name}`, transferId).run();

        // Create transfer request
        // Standard: sender initiates, so sender approved at is now. Awaiting admin approval.
        const now = new Date().toISOString();
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO transfer_requests (id, transfer_number, recipient_member_id, sender_member_id, points, status, sender_approved_at)
          VALUES (?, ?, ?, ?, ?, 'SENDER_APPROVED', ?)
        `).bind(transferId, trNum, recipient.id, memberId, points, now).run();

        await createAuditLog(env, { role: "MEMBER", id: memberId }, "REQUEST_TRANSFER", "TRANSFER", transferId, null, { points, recipientId: recipient.id }, requestId);

        return withRequestId(json({ success: true, transferNumber: trNum, points, recipientName: recipient.full_name }), requestId);
      }
    }

    // -------------------------------------------------------------
    // PARTNER PORTAL ENDPOINTS
    // -------------------------------------------------------------
    if (session.role === "PARTNER_ADMIN" || session.role === "PARTNER_STAFF") {
      const partnerId = session.partner_id!;
      const staffId = session.reference_id!;

      if (url.pathname === "/api/partner/summary" && request.method === "GET") {
        const partner = await env.PROMOANGOL_DB.prepare(`
          SELECT name, category, status, email, phone, address FROM partners WHERE id = ?
        `).bind(partnerId).first();

        // Count of today's transactions
        const todayCount = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count, COALESCE(SUM(amount_paid_kz), 0) AS total_amount
          FROM purchase_transactions
          WHERE partner_id = ? AND date(created_at) = date('now')
        `).bind(partnerId).first<{ count: number; total_amount: number }>();

        // Count pending confirmation
        const pendingConfirm = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM purchase_transactions
          WHERE partner_id = ? AND status = 'PENDING_PARTNER_CONFIRMATION'
        `).bind(partnerId).first<{ count: number }>();

        // Count pending redemptions
        const pendingRedeem = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM redemptions
          WHERE partner_id = ? AND status IN ('REQUESTED', 'AWAITING_PARTNER')
        `).bind(partnerId).first<{ count: number }>();

        // Recent transactions
        const recentTrans = await env.PROMOANGOL_DB.prepare(`
          SELECT t.id, t.transaction_number, t.amount_paid_kz, t.member_benefit_kz, t.points_to_release, t.status, t.created_at,
                 m.full_name AS member_name, m.member_number, l.title AS listing_title
          FROM purchase_transactions t
          JOIN members m ON m.id = t.member_id
          JOIN partner_listings l ON l.id = t.listing_id
          WHERE t.partner_id = ?
          ORDER BY t.created_at DESC LIMIT 10
        `).bind(partnerId).all();

        // Listings
        const listings = await env.PROMOANGOL_DB.prepare(`
          SELECT l.id, l.title, l.description, l.base_price_kz, l.status,
                 (SELECT status FROM promotions WHERE listing_id = l.id LIMIT 1) AS promo_status
          FROM partner_listings l
          WHERE l.partner_id = ?
        `).bind(partnerId).all();

        return withRequestId(
          json({
            partner,
            stats: {
              todayCount: todayCount?.count ?? 0,
              todayVolume: todayCount?.total_amount ?? 0,
              pendingConfirm: pendingConfirm?.count ?? 0,
              pendingRedeem: pendingRedeem?.count ?? 0,
            },
            transactions: recentTrans.results ?? [],
            listings: listings.results ?? [],
          }),
          requestId
        );
      }

      if (url.pathname === "/api/partner/verify-member" && request.method === "POST") {
        const body = (await request.json()) as { member_number?: string };
        if (!body.member_number) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Insira o número de membro" }, { status: 400 }), requestId);
        }

        const member = await env.PROMOANGOL_DB.prepare(`
          SELECT m.id, m.member_number, m.full_name, m.email, m.phone, m.membership_status, m.account_state,
                 p.name AS plan_name, p.reward_multiplier_bps,
                 COALESCE(pb.available_points, 0) AS available_points
          FROM members m
          JOIN membership_plans p ON p.id = m.membership_plan_id
          LEFT JOIN member_point_balances pb ON pb.member_id = m.id
          WHERE m.member_number = ?
        `).bind(body.member_number.trim().toUpperCase()).first<{
          id: string;
          member_number: string;
          full_name: string;
          email: string;
          phone: string;
          membership_status: string;
          account_state: string;
          plan_name: string;
          reward_multiplier_bps: number;
          available_points: number;
        }>();

        if (!member) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Membro não encontrado." }, { status: 404 }), requestId);
        }

        if (member.account_state === "FROZEN" || member.membership_status !== "ACTIVE") {
          return withRequestId(json({ error: "ACCOUNT_LOCKED", message: "Conta de membro inactiva, suspensa ou congelada." }, { status: 403 }), requestId);
        }

        // Active promotions available for this partner
        const promotions = await env.PROMOANGOL_DB.prepare(`
          SELECT p.id, p.title, p.description, l.id AS listing_id, l.title AS listing_title, l.base_price_kz,
                 pv.id AS version_id, pv.delivery_mode, pv.member_benefit_kz, pv.commission_mode, pv.commission_value, pv.benefit_mode, pv.benefit_value
          FROM promotions p
          JOIN promotion_versions pv ON pv.id = p.current_version_id
          JOIN partner_listings l ON l.id = p.listing_id
          WHERE l.partner_id = ? AND p.status = 'ACTIVE'
            AND date('now') >= date(pv.valid_from)
            AND (pv.valid_until IS NULL OR date('now') <= date(pv.valid_until))
        `).bind(partnerId).all();

        return withRequestId(json({ member, promotions: promotions.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/partner/purchase/record" && request.method === "POST") {
        const body = (await request.json()) as {
          member_id?: string;
          listing_id?: string;
          promotion_id?: string;
          amount_paid_kz?: number;
          idempotency_key?: string;
        };

        if (!body.member_id || !body.listing_id || !body.promotion_id || !body.amount_paid_kz) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Preencha todos os campos obrigatórios." }, { status: 400 }), requestId);
        }

        // Validate member
        const member = await env.PROMOANGOL_DB.prepare("SELECT id, full_name, membership_status, account_state FROM members WHERE id = ?").bind(body.member_id).first<{ id: string; full_name: string; membership_status: string; account_state: string }>();
        if (!member || member.account_state === "FROZEN" || member.membership_status !== "ACTIVE") {
          return withRequestId(json({ error: "MEMBER_LOCKED", message: "A conta do membro não está activa." }, { status: 403 }), requestId);
        }

        // Retrieve promotion current version
        const promotion = await env.PROMOANGOL_DB.prepare(`
          SELECT p.id, pv.id AS version_id, pv.commission_mode, pv.commission_value, pv.benefit_mode, pv.benefit_value, pv.delivery_mode
          FROM promotions p
          JOIN promotion_versions pv ON pv.id = p.current_version_id
          WHERE p.id = ? AND p.status = 'ACTIVE'
        `).bind(body.promotion_id).first<{
          id: string;
          version_id: string;
          commission_mode: CommissionMode;
          commission_value: number;
          benefit_mode: BenefitMode;
          benefit_value?: number;
          delivery_mode: MemberBenefitDelivery;
        }>();

        if (!promotion) {
          return withRequestId(json({ error: "PROMOTION_NOT_FOUND", message: "Promoção inactiva ou inválida." }, { status: 404 }), requestId);
        }

        // Server-side economics calculation
        let econ;
        try {
          econ = calculatePromotionEconomics({
            purchaseAmountKz: body.amount_paid_kz,
            commissionMode: promotion.commission_mode,
            commissionValue: promotion.commission_value,
            benefitMode: promotion.benefit_mode,
            benefitValue: promotion.benefit_value,
            delivery: promotion.delivery_mode,
          });
        } catch (err: any) {
          return withRequestId(json({ error: "ECONOMICS_ERROR", message: err.message }, { status: 400 }), requestId);
        }

        const transactionId = crypto.randomUUID();
        const txNum = `TX${Math.floor(100000 + Math.random() * 900000)}`;
        const now = new Date().toISOString();

        // Create transaction: since recorded by partner, partner_confirmed_at = now
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO purchase_transactions (
            id, transaction_number, member_id, partner_id, listing_id, promotion_version_id,
            amount_paid_kz, commission_kz, member_benefit_kz, points_to_release,
            status, partner_confirmed_at, partner_actor_id, idempotency_key
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_MEMBER_CONFIRMATION', ?, ?, ?)
        `).bind(
          transactionId,
          txNum,
          member.id,
          partnerId,
          body.listing_id,
          promotion.version_id,
          body.amount_paid_kz,
          econ.commissionKz,
          econ.memberBenefitKz,
          econ.pointsAwarded,
          now,
          staffId,
          body.idempotency_key || null
        ).run();

        await createAuditLog(env, { role: session.role, id: staffId }, "RECORD_PURCHASE", "TRANSACTION", transactionId, null, { amount: body.amount_paid_kz, points: econ.pointsAwarded }, requestId);

        return withRequestId(json({ success: true, transaction_id: transactionId, transactionNumber: txNum, points: econ.pointsAwarded }), requestId);
      }

      if (url.pathname === "/api/partner/redemptions" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT r.id, r.redemption_number, r.points_requested, r.cash_amount_kz, r.status, r.created_at, r.approval_expires_at,
                 m.full_name AS member_name, m.member_number, l.title AS listing_title
          FROM redemptions r
          JOIN members m ON m.id = r.member_id
          JOIN partner_listings l ON l.id = r.listing_id
          WHERE r.partner_id = ?
          ORDER BY r.created_at DESC
        `).bind(partnerId).all();

        return withRequestId(json({ redemptions: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/partner/redemptions" && request.method === "POST") {
        const body = (await request.json()) as { redemption_id?: string; action?: "APPROVE" | "REJECT" | "VERIFY_TOKEN"; token?: string };
        if (!body.redemption_id || !body.action) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Parâmetros em falta" }, { status: 400 }), requestId);
        }

        const redemption = await env.PROMOANGOL_DB.prepare(`
          SELECT id, status, points_requested, member_id, redemption_number
          FROM redemptions
          WHERE id = ? AND partner_id = ?
        `).bind(body.redemption_id, partnerId).first<{ id: string; status: string; points_requested: number; member_id: string; redemption_number: string }>();

        if (!redemption) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Resgate não encontrado." }, { status: 404 }), requestId);
        }

        const now = new Date().toISOString();

        if (body.action === "APPROVE") {
          if (redemption.status !== "REQUESTED") {
            return withRequestId(json({ error: "INVALID_STATE", message: "Resgate não está pendente de aprovação do parceiro." }, { status: 400 }), requestId);
          }

          // Moves to awaiting Admin approval or goes directly to APPROVED depending on flows. The requirement says:
          // "Partner sees redemption request. Partner approves or rejects. Master Admin approval is required."
          // So partner approves, status becomes AWAITING_ADMIN!
          await env.PROMOANGOL_DB.prepare(`
            UPDATE redemptions
            SET status = 'AWAITING_ADMIN', updated_at = ?
            WHERE id = ?
          `).bind(now, redemption.id).run();

          await createAuditLog(env, { role: session.role, id: staffId }, "PARTNER_APPROVE_REDEMPTION", "REDEMPTION", redemption.id, { status: redemption.status }, { status: "AWAITING_ADMIN" }, requestId);

          return withRequestId(json({ success: true, status: "AWAITING_ADMIN" }), requestId);
        }

        if (body.action === "REJECT") {
          if (redemption.status !== "REQUESTED" && redemption.status !== "AWAITING_PARTNER") {
            return withRequestId(json({ error: "INVALID_STATE", message: "Não é possível rejeitar." }, { status: 400 }), requestId);
          }

          await env.PROMOANGOL_DB.prepare(`
            UPDATE redemptions
            SET status = 'REJECTED', partner_response = 'Rejeitado pelo parceiro', updated_at = ?
            WHERE id = ?
          `).bind(now, redemption.id).run();

          // Release points back to member! (RESERVED -> AVAILABLE)
          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'RESERVED', 'DEBIT', ?, ?, 'REDEMPTION_CANCEL', ?)
          `).bind(crypto.randomUUID(), redemption.member_id, redemption.points_requested, `Estorno por rejeição do parceiro - Resgate #${redemption.redemption_number}`, redemption.id).run();

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'AVAILABLE', 'CREDIT', ?, ?, 'REDEMPTION_CANCEL', ?)
          `).bind(crypto.randomUUID(), redemption.member_id, redemption.points_requested, `Estorno por rejeição do parceiro - Resgate #${redemption.redemption_number}`, redemption.id).run();

          await createAuditLog(env, { role: session.role, id: staffId }, "PARTNER_REJECT_REDEMPTION", "REDEMPTION", redemption.id, { status: redemption.status }, { status: "REJECTED" }, requestId);

          return withRequestId(json({ success: true, status: "REJECTED" }), requestId);
        }

        if (body.action === "VERIFY_TOKEN") {
          if (redemption.status !== "APPROVED") {
            return withRequestId(json({ error: "INVALID_STATE", message: "O resgate não está no estado aprovado para uso." }, { status: 400 }), requestId);
          }

          // Simple token match or we verify the token
          if (!body.token) {
            return withRequestId(json({ error: "BAD_REQUEST", message: "Token de verificação em falta." }, { status: 400 }), requestId);
          }

          // Let's check token hash or a simple text token matches (we'll hash it to verify, or store a hashed token)
          // For simplicity and safety, let's hash body.token and match approval_token_hash.
          const tokenHash = await hashPassword(body.token.trim());
          const match = await env.PROMOANGOL_DB.prepare(`
            SELECT id FROM redemptions
            WHERE id = ? AND approval_token_hash = ? AND datetime('now') < datetime(approval_expires_at)
          `).bind(redemption.id, tokenHash).first();

          if (!match) {
            return withRequestId(json({ error: "INVALID_TOKEN", message: "Token inválido ou expirado. Não entregue o benefício!" }, { status: 401 }), requestId);
          }

          // Token matches! Mark redemption as USED!
          await env.PROMOANGOL_DB.prepare(`
            UPDATE redemptions
            SET status = 'USED', used_at = ?, redeemed_by_partner_user_id = ?, updated_at = ?
            WHERE id = ?
          `).bind(now, staffId, now, redemption.id).run();

          // Consume points permanently from RESERVED!
          // Since they are consumed, they are permanently debited from RESERVED!
          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'RESERVED', 'DEBIT', ?, ?, 'REDEMPTION_CONSUME', ?)
          `).bind(crypto.randomUUID(), redemption.member_id, redemption.points_requested, `Pontos consumidos no resgate #${redemption.redemption_number}`, redemption.id).run();

          await createAuditLog(env, { role: session.role, id: staffId }, "VERIFY_REDEMPTION_TOKEN", "REDEMPTION", redemption.id, { status: "APPROVED" }, { status: "USED" }, requestId);

          return withRequestId(json({ success: true, status: "USED" }), requestId);
        }
      }

      if (url.pathname === "/api/partner/listings" && request.method === "POST") {
        const body = (await request.json()) as { id?: string; title?: string; description?: string; base_price_kz?: number };
        if (!body.title || !body.base_price_kz) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Título e preço base são obrigatórios." }, { status: 400 }), requestId);
        }

        const now = new Date().toISOString();
        if (body.id) {
          // Update
          await env.PROMOANGOL_DB.prepare(`
            UPDATE partner_listings
            SET title = ?, description = ?, base_price_kz = ?, updated_at = ?
            WHERE id = ? AND partner_id = ?
          `).bind(body.title, body.description || null, body.base_price_kz, now, body.id, partnerId).run();

          await createAuditLog(env, { role: session.role, id: staffId }, "UPDATE_LISTING", "LISTING", body.id, null, { title: body.title, price: body.base_price_kz }, requestId);
          return withRequestId(json({ success: true, updated: true }), requestId);
        } else {
          // Create
          const newId = crypto.randomUUID();
          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO partner_listings (id, partner_id, title, description, base_price_kz, status)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE')
          `).bind(newId, partnerId, body.title, body.description || null, body.base_price_kz).run();

          await createAuditLog(env, { role: session.role, id: staffId }, "CREATE_LISTING", "LISTING", newId, null, { title: body.title, price: body.base_price_kz }, requestId);
          return withRequestId(json({ success: true, id: newId }), requestId);
        }
      }
    }

    // -------------------------------------------------------------
    // MASTER ADMIN ENDPOINTS
    // -------------------------------------------------------------
    if (session.role === "MASTER_ADMIN") {
      const adminId = session.user_credentials_id;

      if (url.pathname === "/api/admin/summary" && request.method === "GET") {
        // System wide summary counts
        const membersCount = await env.PROMOANGOL_DB.prepare("SELECT COUNT(*) AS count FROM members").first<{ count: number }>();
        const partnersCount = await env.PROMOANGOL_DB.prepare("SELECT COUNT(*) AS count FROM partners").first<{ count: number }>();
        const promotionsCount = await env.PROMOANGOL_DB.prepare("SELECT COUNT(*) AS count FROM promotions").first<{ count: number }>();

        const pendingConfirmations = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM purchase_transactions WHERE status LIKE 'PENDING_%'
        `).first<{ count: number }>();

        const pendingRedemptions = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM redemptions WHERE status = 'AWAITING_ADMIN' OR status = 'REQUESTED'
        `).first<{ count: number }>();

        const pendingTransfers = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM transfer_requests WHERE status = 'SENDER_APPROVED'
        `).first<{ count: number }>();

        const settlementsCount = await env.PROMOANGOL_DB.prepare(`
          SELECT COUNT(*) AS count FROM partner_settlements WHERE status = 'OPEN'
        `).first<{ count: number }>();

        // Financial sums from ledger
        const ledgerSummary = await env.PROMOANGOL_DB.prepare(`
          SELECT bucket, SUM(CASE WHEN direction = 'CREDIT' THEN points ELSE -points END) AS sum
          FROM points_ledger
          GROUP BY bucket
        `).all<{ bucket: string; sum: number }>();

        // Recent audit logs
        const auditLogs = await env.PROMOANGOL_DB.prepare(`
          SELECT id, actor_type, actor_id, action, entity_type, entity_id, created_at
          FROM audit_log
          ORDER BY created_at DESC LIMIT 15
        `).all();

        return withRequestId(
          json({
            stats: {
              members: membersCount?.count ?? 0,
              partners: partnersCount?.count ?? 0,
              promotions: promotionsCount?.count ?? 0,
              pendingConfirmations: pendingConfirmations?.count ?? 0,
              pendingRedemptions: pendingRedemptions?.count ?? 0,
              pendingTransfers: pendingTransfers?.count ?? 0,
              settlements: settlementsCount?.count ?? 0,
            },
            ledger: ledgerSummary.results ?? [],
            audit: auditLogs.results ?? [],
          }),
          requestId
        );
      }

      // MANAGING MEMBERS
      if (url.pathname === "/api/admin/members" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT m.id, m.member_number, m.full_name, m.email, m.phone, m.joined_at, m.membership_status, m.account_state,
                 p.name AS plan_name,
                 COALESCE(pb.available_points, 0) AS available_points,
                 COALESCE(pb.pending_points, 0) AS pending_points,
                 COALESCE(pb.reserved_points, 0) AS reserved_points
          FROM members m
          JOIN membership_plans p ON p.id = m.membership_plan_id
          LEFT JOIN member_point_balances pb ON pb.member_id = m.id
          ORDER BY m.created_at DESC
        `).all();
        return withRequestId(json({ members: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/admin/members/action" && request.method === "POST") {
        const body = (await request.json()) as { id?: string; action?: "FREEZE" | "UNFREEZE" | "SUSPEND" | "ACTIVATE" };
        if (!body.id || !body.action) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "ID and Action are required" }, { status: 400 }), requestId);
        }

        const now = new Date().toISOString();
        if (body.action === "FREEZE") {
          await env.PROMOANGOL_DB.prepare("UPDATE members SET account_state = 'FROZEN', updated_at = ? WHERE id = ?").bind(now, body.id).run();
          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "FREEZE_MEMBER", "MEMBER", body.id, { account_state: "NORMAL" }, { account_state: "FROZEN" }, requestId);
        } else if (body.action === "UNFREEZE") {
          await env.PROMOANGOL_DB.prepare("UPDATE members SET account_state = 'NORMAL', updated_at = ? WHERE id = ?").bind(now, body.id).run();
          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "UNFREEZE_MEMBER", "MEMBER", body.id, { account_state: "FROZEN" }, { account_state: "NORMAL" }, requestId);
        } else if (body.action === "SUSPEND") {
          await env.PROMOANGOL_DB.prepare("UPDATE members SET membership_status = 'SUSPENDED', updated_at = ? WHERE id = ?").bind(now, body.id).run();
          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "SUSPEND_MEMBER", "MEMBER", body.id, { membership_status: "ACTIVE" }, { membership_status: "SUSPENDED" }, requestId);
        } else if (body.action === "ACTIVATE") {
          await env.PROMOANGOL_DB.prepare("UPDATE members SET membership_status = 'ACTIVE', updated_at = ? WHERE id = ?").bind(now, body.id).run();
          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "ACTIVATE_MEMBER", "MEMBER", body.id, { membership_status: "SUSPENDED" }, { membership_status: "ACTIVE" }, requestId);
        }

        return withRequestId(json({ success: true }), requestId);
      }

      // MANAGING PARTNERS
      if (url.pathname === "/api/admin/partners" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT * FROM partners ORDER BY created_at DESC
        `).all();
        return withRequestId(json({ partners: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/admin/partners" && request.method === "POST") {
        const body = (await request.json()) as {
          id?: string;
          name?: string;
          legal_name?: string;
          category?: string;
          status?: string;
          contact_name?: string;
          phone?: string;
          email?: string;
          address?: string;
          admin_email?: string; // To optionally create associated Partner Admin user
        };

        if (!body.name || !body.category) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Nome e Categoria são obrigatórios" }, { status: 400 }), requestId);
        }

        const now = new Date().toISOString();
        if (body.id) {
          // Update
          await env.PROMOANGOL_DB.prepare(`
            UPDATE partners
            SET name = ?, legal_name = ?, category = ?, status = ?, contact_name = ?, phone = ?, email = ?, address = ?, updated_at = ?
            WHERE id = ?
          `).bind(body.name, body.legal_name || null, body.category, body.status || 'ACTIVE', body.contact_name || null, body.phone || null, body.email || null, body.address || null, now, body.id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "UPDATE_PARTNER", "PARTNER", body.id, null, body, requestId);
          return withRequestId(json({ success: true, updated: true }), requestId);
        } else {
          // Create
          const partnerId = crypto.randomUUID();
          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO partners (id, name, legal_name, category, status, contact_name, phone, email, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(partnerId, body.name, body.legal_name || null, body.category, body.status || 'ACTIVE', body.contact_name || null, body.phone || null, body.email || null, body.address || null).run();

          // If admin_email supplied, automatically seed a user_credentials for them with default partner123
          if (body.admin_email) {
            const pUserId = crypto.randomUUID();
            await env.PROMOANGOL_DB.prepare(`
              INSERT INTO partner_users (id, partner_id, full_name, email, phone, role, status)
              VALUES (?, ?, ?, ?, ?, 'OWNER', 'ACTIVE')
            `).bind(pUserId, partnerId, body.contact_name || body.name, body.admin_email, body.phone || null).run();

            const credId = crypto.randomUUID();
            // partner123 hash
            const defaultHash = "3f03b22b10499d0e19cfb34d72851dbe59da8cf834246ed80ee9dc779bf18408";
            await env.PROMOANGOL_DB.prepare(`
              INSERT INTO user_credentials (id, email, password_hash, role, reference_id)
              VALUES (?, ?, ?, 'PARTNER_ADMIN', ?)
            `).bind(credId, body.admin_email.toLowerCase().trim(), defaultHash, pUserId).run();
          }

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "CREATE_PARTNER", "PARTNER", partnerId, null, body, requestId);
          return withRequestId(json({ success: true, id: partnerId }), requestId);
        }
      }

      // MANAGING PROMOTIONS
      if (url.pathname === "/api/admin/promotions" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT
            p.id,
            p.title,
            p.description,
            p.status,
            p.listing_id,
            l.title AS listing_title,
            pt.name AS partner_name,
            pv.id AS version_id,
            pv.version_number,
            pv.commission_mode,
            pv.commission_value,
            pv.benefit_mode,
            pv.benefit_value,
            pv.delivery_mode,
            pv.member_benefit_kz,
            pv.platform_margin_kz,
            pv.valid_from,
            pv.valid_until
          FROM promotions p
          LEFT JOIN promotion_versions pv ON pv.id = p.current_version_id
          JOIN partner_listings l ON l.id = p.listing_id
          JOIN partners pt ON pt.id = l.partner_id
          ORDER BY p.created_at DESC
        `).all();

        const listings = await env.PROMOANGOL_DB.prepare(`
          SELECT l.id, l.title, l.base_price_kz, pt.name AS partner_name
          FROM partner_listings l
          JOIN partners pt ON pt.id = l.partner_id
          WHERE l.status = 'ACTIVE'
        `).all();

        return withRequestId(json({ promotions: rows.results ?? [], listings: listings.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/admin/promotions" && request.method === "POST") {
        const body = (await request.json()) as {
          id?: string;
          listing_id?: string;
          title?: string;
          description?: string;
          status?: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
          commission_mode?: CommissionMode;
          commission_value?: number;
          benefit_mode?: BenefitMode;
          benefit_value?: number;
          delivery_mode?: MemberBenefitDelivery;
          valid_from?: string;
          valid_until?: string;
        };

        if (!body.listing_id || !body.title || !body.commission_mode || !body.commission_value || !body.benefit_mode || !body.delivery_mode) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Faltam parâmetros de configuração da promoção." }, { status: 400 }), requestId);
        }

        const listing = await env.PROMOANGOL_DB.prepare("SELECT base_price_kz FROM partner_listings WHERE id = ?").bind(body.listing_id).first<{ base_price_kz: number }>();
        if (!listing) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Oferta base associada não existe" }, { status: 400 }), requestId);
        }

        // Calculate economics
        let econ;
        try {
          econ = calculatePromotionEconomics({
            purchaseAmountKz: listing.base_price_kz,
            commissionMode: body.commission_mode,
            commissionValue: body.commission_value,
            benefitMode: body.benefit_mode,
            benefitValue: body.benefit_value,
            delivery: body.delivery_mode,
          });
        } catch (err: any) {
          return withRequestId(json({ error: "ECONOMICS_ERROR", message: err.message }, { status: 400 }), requestId);
        }

        const now = new Date().toISOString();
        const validFrom = body.valid_from || now.slice(0, 10);

        if (body.id) {
          // Update: Create new version to preserve historical financial integrity!
          const promo = await env.PROMOANGOL_DB.prepare(`
            SELECT current_version_id FROM promotions WHERE id = ?
          `).bind(body.id).first<{ current_version_id: string }>();

          if (!promo) {
            return withRequestId(json({ error: "NOT_FOUND", message: "Promoção não encontrada." }, { status: 404 }), requestId);
          }

          const currentVersion = await env.PROMOANGOL_DB.prepare(`
            SELECT version_number FROM promotion_versions WHERE id = ?
          `).bind(promo.current_version_id).first<{ version_number: number }>();

          const newVersionNum = (currentVersion?.version_number ?? 0) + 1;
          const newVersionId = crypto.randomUUID();

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO promotion_versions (
              id, promotion_id, version_number, commission_mode, commission_value,
              benefit_mode, benefit_value, delivery_mode, member_benefit_kz, platform_margin_kz,
              valid_from, valid_until, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            newVersionId,
            body.id,
            newVersionNum,
            body.commission_mode,
            body.commission_value,
            body.benefit_mode,
            body.benefit_value || null,
            body.delivery_mode,
            econ.memberBenefitKz,
            econ.platformMarginKz,
            validFrom,
            body.valid_until || null,
            adminId
          ).run();

          // Point to new version
          await env.PROMOANGOL_DB.prepare(`
            UPDATE promotions
            SET title = ?, description = ?, status = ?, current_version_id = ?, updated_at = ?
            WHERE id = ?
          `).bind(body.title, body.description || null, body.status || 'ACTIVE', newVersionId, now, body.id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "UPDATE_PROMOTION", "PROMOTION", body.id, { oldVersionId: promo.current_version_id }, { newVersionId, status: body.status }, requestId);

          return withRequestId(json({ success: true, updated: true, newVersionId }), requestId);
        } else {
          // Create
          const promoId = crypto.randomUUID();
          const versionId = crypto.randomUUID();

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO promotions (id, listing_id, title, description, status, current_version_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(promoId, body.listing_id, body.title, body.description || null, body.status || 'ACTIVE', versionId).run();

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO promotion_versions (
              id, promotion_id, version_number, commission_mode, commission_value,
              benefit_mode, benefit_value, delivery_mode, member_benefit_kz, platform_margin_kz,
              valid_from, valid_until, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            versionId,
            promoId,
            1,
            body.commission_mode,
            body.commission_value,
            body.benefit_mode,
            body.benefit_value || null,
            body.delivery_mode,
            econ.memberBenefitKz,
            econ.platformMarginKz,
            validFrom,
            body.valid_until || null,
            adminId
          ).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "CREATE_PROMOTION", "PROMOTION", promoId, null, { title: body.title, status: body.status }, requestId);

          return withRequestId(json({ success: true, id: promoId, versionId }), requestId);
        }
      }

      // REDEMPTIONS APPROVALS (MASTER ADMIN)
      if (url.pathname === "/api/admin/redemptions" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT r.id, r.redemption_number, r.points_requested, r.cash_amount_kz, r.status, r.created_at,
                 m.full_name AS member_name, m.member_number,
                 pt.name AS partner_name, l.title AS listing_title
          FROM redemptions r
          JOIN members m ON m.id = r.member_id
          JOIN partners pt ON pt.id = r.partner_id
          JOIN partner_listings l ON l.id = r.listing_id
          ORDER BY r.created_at DESC
        `).all();

        return withRequestId(json({ redemptions: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/admin/redemptions/action" && request.method === "POST") {
        const body = (await request.json()) as { redemption_id?: string; action?: "APPROVE" | "REJECT" };
        if (!body.redemption_id || !body.action) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Redemption ID and action are required." }, { status: 400 }), requestId);
        }

        const redemption = await env.PROMOANGOL_DB.prepare(`
          SELECT id, status, member_id, points_requested, redemption_number
          FROM redemptions
          WHERE id = ?
        `).bind(body.redemption_id).first<{ id: string; status: string; member_id: string; points_requested: number; redemption_number: string }>();

        if (!redemption) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Resgate não encontrado" }, { status: 404 }), requestId);
        }

        const now = new Date().toISOString();

        if (body.action === "APPROVE") {
          // Generates a short-lived 6-digit verification code token for member.
          // Store token hashed in DB. approval_token_hash is SHA-256 of code.
          const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
          const approvalTokenHash = await hashPassword(verificationCode);
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour token validity

          await env.PROMOANGOL_DB.prepare(`
            UPDATE redemptions
            SET status = 'APPROVED', admin_approved_by = ?, admin_approved_at = ?, approval_token_hash = ?, approval_expires_at = ?, updated_at = ?
            WHERE id = ?
          `).bind(adminId, now, approvalTokenHash, expiresAt, now, redemption.id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "ADMIN_APPROVE_REDEMPTION", "REDEMPTION", redemption.id, { status: redemption.status }, { status: "APPROVED" }, requestId);

          // We'll return the token so that the admin can view or member can see (the member can display this to the partner!)
          return withRequestId(json({ success: true, status: "APPROVED", verificationCode, expiresAt }), requestId);
        } else if (body.action === "REJECT") {
          await env.PROMOANGOL_DB.prepare(`
            UPDATE redemptions
            SET status = 'REJECTED', updated_at = ?
            WHERE id = ?
          `).bind(now, redemption.id).run();

          // Release points back to member (RESERVED -> AVAILABLE)
          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'RESERVED', 'DEBIT', ?, ?, 'REDEMPTION_CANCEL', ?)
          `).bind(crypto.randomUUID(), redemption.member_id, redemption.points_requested, `Estorno por rejeição do Admin - Resgate #${redemption.redemption_number}`, redemption.id).run();

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'AVAILABLE', 'CREDIT', ?, ?, 'REDEMPTION_CANCEL', ?)
          `).bind(crypto.randomUUID(), redemption.member_id, redemption.points_requested, `Estorno por rejeição do Admin - Resgate #${redemption.redemption_number}`, redemption.id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "ADMIN_REJECT_REDEMPTION", "REDEMPTION", redemption.id, { status: redemption.status }, { status: "REJECTED" }, requestId);

          return withRequestId(json({ success: true, status: "REJECTED" }), requestId);
        }
      }

      // TRANSFERS (MASTER ADMIN APPROVALS)
      if (url.pathname === "/api/admin/transfers" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT t.id, t.transfer_number, t.points, t.status, t.created_at, t.release_at,
                 sm.full_name AS sender_name, sm.member_number AS sender_number,
                 rm.full_name AS recipient_name, rm.member_number AS recipient_number
          FROM transfer_requests t
          JOIN members sm ON sm.id = t.sender_member_id
          JOIN members rm ON rm.id = t.recipient_member_id
          ORDER BY t.created_at DESC
        `).all();

        return withRequestId(json({ transfers: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/admin/transfers/action" && request.method === "POST") {
        const body = (await request.json()) as { transfer_id?: string; action?: "APPROVE" | "REJECT" };
        if (!body.transfer_id || !body.action) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Transfer ID and Action are required." }, { status: 400 }), requestId);
        }

        const transfer = await env.PROMOANGOL_DB.prepare(`
          SELECT id, status, sender_member_id, recipient_member_id, points, transfer_number
          FROM transfer_requests
          WHERE id = ?
        `).bind(body.transfer_id).first<{
          id: string;
          status: string;
          sender_member_id: string;
          recipient_member_id: string;
          points: number;
          transfer_number: string;
        }>();

        if (!transfer) {
          return withRequestId(json({ error: "NOT_FOUND", message: "Transferência não encontrada" }, { status: 404 }), requestId);
        }

        const now = new Date().toISOString();

        if (body.action === "APPROVE") {
          if (transfer.status !== "SENDER_APPROVED") {
            return withRequestId(json({ error: "INVALID_STATE", message: "Estado inválido para aprovação" }, { status: 400 }), requestId);
          }

          // Transfer APPROVED by admin! Wait, "Settlement/release can take up to 3 working days."
          // So set release_at to 3 working days from now, status = 'ADMIN_APPROVED'.
          // The cron will complete the transfer.
          const releaseDate = addWorkingDays(new Date(), 3).toISOString().slice(0, 10);

          await env.PROMOANGOL_DB.prepare(`
            UPDATE transfer_requests
            SET status = 'ADMIN_APPROVED', admin_approved_by = ?, admin_approved_at = ?, release_at = ?, updated_at = ?
            WHERE id = ?
          `).bind(adminId, now, releaseDate, now, transfer.id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "ADMIN_APPROVE_TRANSFER", "TRANSFER", transfer.id, { status: transfer.status }, { status: "ADMIN_APPROVED" }, requestId);

          return withRequestId(json({ success: true, status: "ADMIN_APPROVED", releaseDate }), requestId);
        } else if (body.action === "REJECT") {
          await env.PROMOANGOL_DB.prepare(`
            UPDATE transfer_requests
            SET status = 'REJECTED', updated_at = ?
            WHERE id = ?
          `).bind(now, transfer.id).run();

          // Release points back to sender (RESERVED -> AVAILABLE)
          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'RESERVED', 'DEBIT', ?, ?, 'TRANSFER_CANCEL', ?)
          `).bind(crypto.randomUUID(), transfer.sender_member_id, transfer.points, `Estorno de transferência rejeitada #${transfer.transfer_number}`, transfer.id).run();

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
            VALUES (?, ?, 'AVAILABLE', 'CREDIT', ?, ?, 'TRANSFER_CANCEL', ?)
          `).bind(crypto.randomUUID(), transfer.sender_member_id, transfer.points, `Estorno de transferência rejeitada #${transfer.transfer_number}`, transfer.id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "ADMIN_REJECT_TRANSFER", "TRANSFER", transfer.id, { status: transfer.status }, { status: "REJECTED" }, requestId);

          return withRequestId(json({ success: true, status: "REJECTED" }), requestId);
        }
      }

      // SETTLEMENTS & ACCOUNTING (MASTER ADMIN)
      if (url.pathname === "/api/admin/settlements" && request.method === "GET") {
        const rows = await env.PROMOANGOL_DB.prepare(`
          SELECT s.id, s.partner_id, s.period_start, s.period_end, s.gross_redemptions_kz, s.adjustments_kz, s.net_payable_kz, s.status, s.generated_at, s.paid_at, s.bank_reference,
                 p.name AS partner_name
          FROM partner_settlements s
          JOIN partners p ON p.id = s.partner_id
          ORDER BY s.generated_at DESC
        `).all();

        return withRequestId(json({ settlements: rows.results ?? [] }), requestId);
      }

      if (url.pathname === "/api/admin/settlements" && request.method === "POST") {
        const body = (await request.json()) as { partner_id?: string; action?: "GENERATE" | "PAY"; settlement_id?: string; bank_reference?: string };
        if (!body.action) {
          return withRequestId(json({ error: "BAD_REQUEST", message: "Ação é obrigatória." }, { status: 400 }), requestId);
        }

        const now = new Date().toISOString();

        if (body.action === "GENERATE") {
          if (!body.partner_id) {
            return withRequestId(json({ error: "BAD_REQUEST", message: "Selecione a empresa parceira." }, { status: 400 }), requestId);
          }

          // Let's generate a settlement for the current partner!
          // We look for redemptions that are USED, but not yet linked to any settlement_lines!
          const unsubmittedRedemptions = await env.PROMOANGOL_DB.prepare(`
            SELECT r.id, r.redemption_number, r.points_requested, r.cash_amount_kz
            FROM redemptions r
            WHERE r.partner_id = ? AND r.status = 'USED'
              AND r.id NOT IN (SELECT DISTINCT redemption_id FROM settlement_lines WHERE redemption_id IS NOT NULL)
          `).bind(body.partner_id).all<{ id: string; redemption_number: string; points_requested: number; cash_amount_kz: number }>();

          const redList = unsubmittedRedemptions.results ?? [];
          if (redList.length === 0) {
            return withRequestId(json({ error: "NO_DATA", message: "Não existem resgates consumidos pendentes de liquidação para este parceiro." }, { status: 400 }), requestId);
          }

          // Calculate sum. 1 point = 1 Kz. Partner is paid for point redemptions.
          const grossRedemptions = redList.reduce((sum, r) => sum + r.points_requested, 0);
          const settlementId = crypto.randomUUID();
          const pStart = "2026-01-01";
          const pEnd = now.slice(0, 10);

          await env.PROMOANGOL_DB.prepare(`
            INSERT INTO partner_settlements (id, partner_id, period_start, period_end, gross_redemptions_kz, adjustments_kz, net_payable_kz, status, generated_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, 'READY', ?)
          `).bind(settlementId, body.partner_id, pStart, pEnd, grossRedemptions, grossRedemptions, now).run();

          // Write lines
          for (const item of redList) {
            await env.PROMOANGOL_DB.prepare(`
              INSERT INTO settlement_lines (id, settlement_id, redemption_id, transaction_number, amount_kz, description)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(crypto.randomUUID(), settlementId, item.id, item.redemption_number, item.points_requested, `Compensação de resgate #${item.redemption_number}`).run();
          }

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "GENERATE_SETTLEMENT", "SETTLEMENT", settlementId, null, { grossRedemptions }, requestId);

          return withRequestId(json({ success: true, settlementId, grossRedemptions }), requestId);
        }

        if (body.action === "PAY") {
          if (!body.settlement_id || !body.bank_reference) {
            return withRequestId(json({ error: "BAD_REQUEST", message: "Especifique o ID da liquidação e a referência bancária." }, { status: 400 }), requestId);
          }

          await env.PROMOANGOL_DB.prepare(`
            UPDATE partner_settlements
            SET status = 'PAID', paid_at = ?, bank_reference = ?
            WHERE id = ?
          `).bind(now, body.bank_reference, body.settlement_id).run();

          await createAuditLog(env, { role: "MASTER_ADMIN", id: adminId }, "PAY_SETTLEMENT", "SETTLEMENT", body.settlement_id, { status: "READY" }, { status: "PAID", ref: body.bank_reference }, requestId);

          return withRequestId(json({ success: true, status: "PAID" }), requestId);
        }
      }
    }

    return withRequestId(json({ error: "NOT_FOUND", message: "Endpoint de API não encontrado." }, { status: 404 }), requestId);
  } catch (error: any) {
    console.error("PromoAngol API error", { requestId, error });
    return withRequestId(json({ error: "INTERNAL_ERROR", message: error.message, requestId }, { status: 500 }), requestId);
  }
}
