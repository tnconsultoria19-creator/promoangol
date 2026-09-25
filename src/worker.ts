import { apiRouter } from "./api/router";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return apiRouter(request, env);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    switch (controller.cron) {
      case "0 * * * *":
        await processScheduledOperations(env);
        break;
      default:
        console.log("Unknown cron trigger", controller.cron);
    }
  },
};

async function processScheduledOperations(env: Env): Promise<void> {
  const jobId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  try {
    // 1. RELEASE ELIGIBLE REWARDS
    // Find verified purchase transactions where reward_release_at <= now,
    // and we have NOT yet released them (i.e. no points_ledger entry in AVAILABLE bucket for this transaction)
    const pendingReleases = await env.PROMOANGOL_DB.prepare(`
      SELECT t.id, t.member_id, t.points_to_release, t.transaction_number
      FROM purchase_transactions t
      WHERE t.status = 'VERIFIED'
        AND t.points_to_release > 0
        AND date('now') >= date(t.reward_release_at)
        AND t.id NOT IN (
          SELECT reference_id FROM points_ledger
          WHERE reference_type = 'PURCHASE' AND bucket = 'AVAILABLE' AND direction = 'CREDIT'
        )
    `).all<{ id: string; member_id: string; points_to_release: number; transaction_number: string }>();

    for (const tx of pendingReleases.results ?? []) {
      const nowStr = new Date().toISOString();
      const expiryStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 12 months expiry

      // Immutable bookkeeping: debit the pending bucket and credit the available bucket
      // Debit PENDING
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
        VALUES (?, ?, 'PENDING', 'DEBIT', ?, ?, 'PURCHASE', ?)
      `).bind(
        crypto.randomUUID(),
        tx.member_id,
        tx.points_to_release,
        `Libertação de recompensa - Compra #${tx.transaction_number}`,
        tx.id
      ).run();

      // Credit AVAILABLE
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id, expires_at)
        VALUES (?, ?, 'AVAILABLE', 'CREDIT', ?, ?, 'PURCHASE', ?, ?)
      `).bind(
        crypto.randomUUID(),
        tx.member_id,
        tx.points_to_release,
        `Recompensa disponível - Compra #${tx.transaction_number}`,
        tx.id,
        expiryStr
      ).run();

      // Update purchase transaction if needed
      await env.PROMOANGOL_DB.prepare(`
        UPDATE purchase_transactions
        SET updated_at = ?
        WHERE id = ?
      `).bind(nowStr, tx.id).run();
    }

    // 2. EXPIRE ELIGIBLE POINTS
    // Find credit AVAILABLE points ledger entries that are expired
    // and haven't had an expiration debit recorded against them yet
    const expiredPoints = await env.PROMOANGOL_DB.prepare(`
      SELECT pl.id, pl.member_id, pl.points, pl.reason
      FROM points_ledger pl
      WHERE pl.bucket = 'AVAILABLE'
        AND pl.direction = 'CREDIT'
        AND pl.expires_at IS NOT NULL
        AND datetime('now') >= datetime(pl.expires_at)
        AND pl.id NOT IN (
          SELECT DISTINCT source_entry_id FROM points_ledger
          WHERE source_entry_id IS NOT NULL AND bucket = 'AVAILABLE' AND direction = 'DEBIT' AND reason LIKE 'Pontos expirados%'
        )
    `).all<{ id: string; member_id: string; points: number; reason: string }>();

    for (const entry of expiredPoints.results ?? []) {
      // Find how many points are actually left in AVAILABLE for this member to debit
      // (avoid over-debiting below zero available balance)
      const bal = await env.PROMOANGOL_DB.prepare(`
        SELECT available_points FROM member_point_balances WHERE member_id = ?
      `).bind(entry.member_id).first<{ available_points: number }>();

      const available = bal?.available_points ?? 0;
      if (available > 0) {
        const debitPoints = Math.min(entry.points, available);
        await env.PROMOANGOL_DB.prepare(`
          INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id, source_entry_id)
          VALUES (?, ?, 'AVAILABLE', 'DEBIT', ?, 'Pontos expirados (entrada original: ' || ?, 'EXPIRATION', ?, ?)
        `).bind(
          crypto.randomUUID(),
          entry.member_id,
          debitPoints,
          entry.reason,
          entry.id,
          entry.id
        ).run();
      }
    }

    // 3. EXPIRE UNUSED REDEMPTION APPROVALS
    // Redemptions that are APPROVED but approval_expires_at <= now
    const expiredRedemptions = await env.PROMOANGOL_DB.prepare(`
      SELECT id, redemption_number, member_id, points_requested
      FROM redemptions
      WHERE status = 'APPROVED'
        AND approval_expires_at IS NOT NULL
        AND datetime('now') >= datetime(approval_expires_at)
    `).all<{ id: string; redemption_number: string; member_id: string; points_requested: number }>();

    for (const r of expiredRedemptions.results ?? []) {
      const nowStr = new Date().toISOString();
      await env.PROMOANGOL_DB.prepare(`
        UPDATE redemptions
        SET status = 'EXPIRED', updated_at = ?
        WHERE id = ?
      `).bind(nowStr, r.id).run();

      // Return points back to AVAILABLE (RESERVED -> AVAILABLE)
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
        VALUES (?, ?, 'RESERVED', 'DEBIT', ?, ?, 'REDEMPTION_EXPIRED', ?)
      `).bind(crypto.randomUUID(), r.member_id, r.points_requested, `Estorno por expiração do resgate #${r.redemption_number}`, r.id).run();

      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
        VALUES (?, ?, 'AVAILABLE', 'CREDIT', ?, ?, 'REDEMPTION_EXPIRED', ?)
      `).bind(crypto.randomUUID(), r.member_id, r.points_requested, `Estorno por expiração do resgate #${r.redemption_number}`, r.id).run();
    }

    // 4. COMPLETE ELIGIBLE TRANSFERS
    // Transfers that are SENDER_APPROVED or ADMIN_APPROVED and release_at <= now
    // (Wait, the admin approves first, sets release_at, status becomes ADMIN_APPROVED.
    // The cron will complete the transfer after 3 working days)
    const eligibleTransfers = await env.PROMOANGOL_DB.prepare(`
      SELECT id, transfer_number, sender_member_id, recipient_member_id, points
      FROM transfer_requests
      WHERE status = 'ADMIN_APPROVED'
        AND release_at IS NOT NULL
        AND date('now') >= date(release_at)
    `).all<{ id: string; transfer_number: string; sender_member_id: string; recipient_member_id: string; points: number }>();

    for (const t of eligibleTransfers.results ?? []) {
      const nowStr = new Date().toISOString();

      await env.PROMOANGOL_DB.prepare(`
        UPDATE transfer_requests
        SET status = 'COMPLETED', completed_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(nowStr, nowStr, t.id).run();

      // Complete points transfer:
      // Debit sender's RESERVED points
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id)
        VALUES (?, ?, 'RESERVED', 'DEBIT', ?, ?, 'TRANSFER_COMPLETE', ?)
      `).bind(crypto.randomUUID(), t.sender_member_id, t.points, `Transferência #${t.transfer_number} enviada`, t.id).run();

      // Credit recipient's AVAILABLE points
      const recipientExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await env.PROMOANGOL_DB.prepare(`
        INSERT INTO points_ledger (id, member_id, bucket, direction, points, reason, reference_type, reference_id, expires_at)
        VALUES (?, ?, 'AVAILABLE', 'CREDIT', ?, ?, 'TRANSFER_COMPLETE', ?, ?)
      `).bind(crypto.randomUUID(), t.recipient_member_id, t.points, `Transferência #${t.transfer_number} recebida`, t.id, recipientExpiry).run();
    }

    // Write job completion
    await env.PROMOANGOL_DB.prepare(`
      INSERT INTO system_jobs (id, job_type, started_at, completed_at, status)
      VALUES (?, 'HOURLY_OPERATIONS', ?, ?, 'COMPLETED')
    `).bind(jobId, startTime, new Date().toISOString()).run();

  } catch (err: any) {
    console.error("Scheduled cron error", err);
    await env.PROMOANGOL_DB.prepare(`
      INSERT INTO system_jobs (id, job_type, started_at, completed_at, status, error_message)
      VALUES (?, 'HOURLY_OPERATIONS', ?, ?, 'FAILED', ?)
    `).bind(jobId, startTime, new Date().toISOString(), err.message || "Unknown error").run();
  }
}
