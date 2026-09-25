const app = document.querySelector<HTMLDivElement>("#app");

if (app) {
  app.innerHTML = `
    <main class="shell">
      <section class="member-card">
        <div class="eyebrow">PROMOANGOL REWARDS</div>
        <div class="member-card-row">
          <div>
            <div class="member-name">Member experience</div>
            <div class="member-number">PA-00000000</div>
          </div>
          <div class="points-pill"><span>4,850</span><small>POINTS</small></div>
        </div>
      </section>

      <section class="section-head">
        <div>
          <span class="eyebrow dark">THIS WEEK</span>
          <h1>Promotions worth using.</h1>
          <p>Browse partner offers, member rewards and benefits from PromoAngol.</p>
        </div>
        <button class="outline-button">View all</button>
      </section>

      <section class="promo-rail" id="promoRail" aria-label="Weekly promotions"></section>

      <section class="service-grid">
        <article><span>REWARDS</span><strong>Earn</strong><p>Buy from participating partners and receive rewards after verification.</p></article>
        <article><span>MEMBERSHIP</span><strong>Upgrade</strong><p>Use eligible points to move into Preferred or Elite membership.</p></article>
        <article><span>PROMOANGOL</span><strong>Benefits</strong><p>Access member services such as consultations, CV help and digital services.</p></article>
      </section>
    </main>
  `;

  loadPromotions();
}

async function loadPromotions() {
  const rail = document.querySelector<HTMLDivElement>("#promoRail");
  if (!rail) return;
  try {
    const response = await fetch("/api/catalog/promotions");
    if (!response.ok) throw new Error("catalog unavailable");
    const data = (await response.json()) as { promotions?: Array<Record<string, unknown>> };
    const promotions = data.promotions ?? [];
    rail.innerHTML = promotions.length
      ? promotions.map((p) => `
          <article class="promo-card">
            <div class="promo-photo"></div>
            <div class="promo-body">
              <span>${escapeHtml(String(p.partner_name ?? "Partner"))}</span>
              <h2>${escapeHtml(String(p.title ?? p.listing_title ?? "Promotion"))}</h2>
              <strong>${escapeHtml(String(p.delivery_mode ?? "REWARD"))}</strong>
            </div>
          </article>`).join("")
      : `<article class="empty-card"><span>NO LIVE PROMOTIONS</span><strong>Your weekly catalogue is being prepared.</strong></article>`;
  } catch {
    rail.innerHTML = `<article class="empty-card"><span>PROMOANGOL</span><strong>Connect the Cloudflare database to load live promotions.</strong></article>`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}
