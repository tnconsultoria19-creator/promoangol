import { json } from "../lib";

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, { status: response.status, headers });
}

export async function apiRouter(request: Request, env: Env): Promise<Response> {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/health" && request.method === "GET") {
      return withRequestId(
        json({ ok: true, service: "promoangol", timestamp: new Date().toISOString() }),
        requestId,
      );
    }

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

      return withRequestId(
        json(
          {
            promotions: rows.results ?? [],
            generatedAt: new Date().toISOString(),
          },
          { headers: { "Cache-Control": "no-store" } },
        ),
        requestId,
      );
    }

    if (url.pathname === "/api/member/summary" && request.method === "GET") {
      return withRequestId(
        json(
          {
            error: "AUTH_REQUIRED",
            message: "Member authentication must be completed before account data is returned.",
          },
          { status: 401 },
        ),
        requestId,
      );
    }

    if (url.pathname === "/api/admin/summary" && request.method === "GET") {
      return withRequestId(json({ error: "AUTH_NOT_CONFIGURED" }, { status: 501 }), requestId);
    }

    return withRequestId(json({ error: "NOT_FOUND" }, { status: 404 }), requestId);
  } catch (error) {
    console.error("PromoAngol API error", { requestId, error });
    return withRequestId(json({ error: "INTERNAL_ERROR", requestId }, { status: 500 }), requestId);
  }
}
