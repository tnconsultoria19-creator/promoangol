# PromoAngol — Cloudflare Architecture

## Current implementation

The supplied Stitch source remains preserved under `design-reference/`. The production frontend is a React/Vite implementation that carries forward its visual language: Jost, Playfair Display, the blue-grey hero treatment, terracotta/teal/navy blocks, restrained borders and editorial whitespace.

Cloudflare topology:

Browser
→ Cloudflare Worker
→ D1 (`PROMOANGOL_DB`)
→ R2 (`PROMOANGOL_FILES`)
→ Cron Trigger

The Cloudflare Vite plugin builds the client and Worker together. The Worker handles `/api/*`; static routes are served through the asset binding.

## Core rules

1. Partners do not create promotions.
2. Listings are separate from promotions.
3. Promotions are versioned and historical transaction terms are immutable.
4. Commission is fixed Kz or percentage of purchase.
5. PromoAngol may return none, some or all commission as the member benefit.
6. Benefits are points or discount.
7. One point equals Kz 1.
8. Verified rewards wait 3 working days before becoming available.
9. Redemption minimum is 800 points.
10. Redemption points are reserved while a request is pending.
11. Final redemption validation is one-time and server-side.
12. Transfers require recipient request, sender approval and Master Admin approval.
13. Points expire 12 months after joining.
14. The points balance is derived from the ledger rather than a mutable user balance.
15. Corrections use reversal/adjustment entries.

## API foundation

- `GET /api/health`
- `GET /api/catalog/promotions`
- `GET /api/catalog/weekly`
- `GET /api/member/summary` — authentication required
- `GET /api/admin/summary` — identity layer required

The browser never becomes the source of truth for commission, points, approval state or settlement amounts.

## Next server modules

1. Identity/session layer
2. Master Admin control tower
3. Partner/listing management
4. Promotion/version editor
5. Purchase confirmation workflow
6. Ledger transitions and scheduled reward release
7. Redemption approval and one-time verification
8. Transfer approval lifecycle
9. Membership subscriptions and points-based upgrades
10. Settlement and accountant-friendly reporting
