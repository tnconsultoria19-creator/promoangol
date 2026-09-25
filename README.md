# PromoAngol

PromoAngol is a rewards and partner ecosystem for Angola.

The repository contains the Cloudflare-first application foundation, the customer-facing member experience, the transactional D1 schema and the supplied Stitch/Agota visual reference.

## Stack

- Vite + React
- Cloudflare Workers
- D1 for transactional state, points ledger and accounting
- R2 for private payment proofs and documents
- Cron Trigger for deterministic scheduled operations
- GitHub as source of truth

## Business rules built into the foundation

- 1 point = Kz 1
- Standard membership is free
- Points require partner and member confirmation
- Verified points remain pending for 3 working days
- Minimum redemption is 800 points
- Points expire 12 months from joining
- Promotions are owned by PromoAngol and versioned
- Historical transaction economics are never rewritten
- Redemptions use server-side live verification
- Transfers require recipient request, sender approval and Master Admin approval
- Financial records are corrected through reversal/adjustment entries rather than deletion

## Local

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Cloudflare

Create the D1 database and R2 bucket, then place the D1 database ID in `wrangler.jsonc`.

```bash
npx wrangler@latest d1 create promoangol-db
npx wrangler@latest r2 bucket create promoangol-files
npm run db:migrate
npm run deploy
```

The authentication layer is intentionally not faked. Admin and member account data must only be exposed after a real server-side identity/session layer is connected.
