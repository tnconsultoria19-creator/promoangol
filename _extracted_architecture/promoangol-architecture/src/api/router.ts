import { json } from "../lib";

export async function apiRouter(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health" && request.method === "GET") {
    return json({ ok: true, service: "promoangol", timestamp: new Date().toISOString() });
  }

  if (url.pathname === "/api/catalog/promotions" && request.method === "GET") {
    const rows = await env.PROMOANGOL_DB.prepare(`
      SELECT
        p.id,
        p.title,
        p.description,
        l.title AS listing_title,
        pt.name AS partner_name,
        pv.valid_from,
        pv.valid_until,
        pv.delivery_mode,
        pv.member_benefit_kz
      FROM promotions p
      JOIN promotion_versions pv ON pv.id = p.current_version_id
      JOIN partner_listings l ON l.id = p.listing_id
      JOIN partners pt ON pt.id = l.partner_id
      WHERE p.status = 'ACTIVE'
        AND date('now') >= date(pv.valid_from)
        AND (pv.valid_until IS NULL OR date('now') <= date(pv.valid_until))
      ORDER BY p.created_at DESC
    `).all();

    return json({ promotions: rows.results ?? [] });
  }

  if (url.pathname === "/api/admin/summary" && request.method === "GET") {
    // Authentication/authorization is intentionally not stubbed with a client header.
    // Integrate a real identity layer before exposing admin data.
    return json({ error: "AUTH_NOT_CONFIGURED" }, { status: 501 });
  }

  return json({ error: "NOT_FOUND" }, { status: 404 });
}
