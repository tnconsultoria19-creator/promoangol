# PromoAngol — Cloudflare Architecture

## Purpose

This scaffold turns the existing Stitch visual direction into a Cloudflare-first application architecture for:

- member rewards and points
- partner promotions owned by PromoAngol
- partner purchase verification
- point holding/release
- point redemptions
- member-to-member transfers
- Preferred / Elite memberships
- PromoAngol service benefits
- partner settlement and accounting
- immutable audit history

The existing Stitch bundle remains the visual reference. Its design language is carried forward through Jost, Playfair Display, Great Vibes, the restrained neutral palette, terracotta/teal/navy feature blocks, editorial spacing, full-bleed imagery, and compact product-card treatment.

## Cloudflare topology

Browser/mobile web
→ Cloudflare Worker
→ D1 (`PROMOANGOL_DB`) for transactional state and immutable ledger
→ R2 (`PROMOANGOL_FILES`) for proof-of-payment and documents
→ Cron Trigger for deterministic scheduled state transitions
→ Optional Queues later for notifications or non-critical asynchronous work

Cloudflare Workers Static Assets serves the built frontend and the same Worker exposes `/api/*` routes.

## Core rules

1. Partners do not create promotions. PromoAngol Master Admin creates and controls promotions.
2. Partner listings are the underlying commercial items; promotions are versioned terms applied to listings.
3. Commission can be fixed Kz or percentage of the purchase amount.
4. PromoAngol can allocate none, part, or all of its commission as a member benefit. Member benefit cannot exceed the commission under the normal commission model.
5. A member benefit can be delivered as points or as a discount.
6. One point = Kz 1.
7. Points are not a cash withdrawal instrument.
8. Points become usable only after partner confirmation and a 3-working-day release period.
9. Redemption minimum is 800 points/Kz.
10. Redemptions lock points immediately; approval and availability happen before fulfilment.
11. Final redemption verification is server-side and one-time; screenshots are not authoritative.
12. Point transfers require recipient request, sender approval, and Master Admin approval, followed by the hold period.
13. Points expire 12 months after joining. The anniversary date starts a new point-expiry cycle; points are unusable from the anniversary date onward unless a future policy explicitly changes this.
14. Membership is free at Standard level. Paid Preferred/Elite plans may exist.
15. Points may be used to purchase a membership upgrade; consumed upgrade points are permanently debited from the ledger.
16. PromoAngol itself can be a benefit provider for services such as CV work, consultations and websites.
17. Historical transactions keep a snapshot of the promotion-version economics that governed them. Editing a current promotion must never rewrite historical accounting.
18. Balances are derived from the points ledger. There is no authoritative mutable `member.points` field.
19. Financial records are reversed or adjusted through new entries; they are not destructively edited.

## Major domains

### Membership
`membership_plans`, `membership_subscriptions`, `members`, `member_benefits`

### Partner ecosystem
`partners`, `partner_users`, `partner_listings`

### Promotion engine
`promotions`, `promotion_versions`

### Purchases
`purchase_transactions`, `payment_proofs`

### Rewards ledger
`points_ledger`

### Redemption
`redemptions`

### Transfers
`transfer_requests`

### Settlement
`partner_settlements`, `settlement_lines`

### Governance
`audit_log`, `calendar_exceptions`, `system_jobs`

## Transaction state model

### Purchase

`created → pending member/partner confirmation → verified → reward pending → reward released`

Rejected, disputed and reversed transactions are separate terminal/recovery states.

### Redemption

`requested → awaiting partner → awaiting admin → approved → used`

Alternative terminal states: `rejected`, `cancelled`, `expired`.

### Transfer

`requested → sender approved → admin approved → processing → completed`

Alternative terminal states: `rejected`, `cancelled`, `expired`.

## Accounting principle

A transaction writes immutable financial facts:

- purchase value
- partner commission
- member benefit
- PromoAngol margin
- points awarded
- reward release date
- partner settlement obligation

The transaction stores the promotion version ID and the calculated monetary snapshot. If the Master Admin changes the promotion later, the original transaction remains unchanged.

## Cloudflare scheduling

The hourly Cron Trigger is the scheduler for:

- releasing rewards whose release date has arrived
- expiring points at the member anniversary
- expiring unused redemption approvals
- progressing approved transfers after the 3-working-day hold
- creating scheduled operational alerts

Three-working-day calculation is deterministic and should use `calendar_exceptions` so future public-holiday rules can be configured instead of hardcoding them.

## AI policy

The core financial and authorization engine is intentionally deterministic. No AI is required for commission calculation, points calculation, approval, eligibility, redemption validation, transfer authorization, accounting or settlement. AI can be added later only as an optional non-authoritative assistant for things such as copy generation or support summaries.

## Security boundaries

The browser must never be trusted to calculate:

- commission
- reward points
- redemption eligibility
- available points
- transferable points
- settlement amounts

The Worker recomputes and validates these values against D1.

Administrative role checks must come from authenticated server-side identity context, never from a role field supplied by the browser.

Proof-of-payment files should use private R2 objects and short-lived authorized access. The public UI should never expose raw R2 object keys.

The redemption approval indicator must be backed by a one-time server-side token or equivalent server-side verification record.

## Recommended next implementation sequence

1. Authentication and role model
2. Master Admin control tower
3. Partner and listing management
4. Promotion/version editor
5. Purchase verification flow
6. Ledger and scheduled reward release
7. Member card and weekly catalogue
8. Redemption workflow with live one-time verification
9. Transfer workflow
10. Membership plans and points-based upgrades
11. Settlement and PDF/CSV accounting reports
12. Mobile-first polishing and production hardening
