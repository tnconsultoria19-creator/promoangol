# PromoAngol deployment

## 1. Cloudflare resources

```bash
npx wrangler@latest d1 create promoangol-db
npx wrangler@latest r2 bucket create promoangol-files
```

Copy the returned D1 database ID into `wrangler.jsonc`.

## 2. Database

```bash
npm install
npm run db:migrate
```

The migration directory contains the initial schema and a hardening migration for idempotency and approval traceability.

## 3. Build and preview

```bash
npm run build
npm run preview
```

The Cloudflare Vite plugin generates the deployment configuration alongside the client output.

## 4. Deploy

```bash
npm run deploy
```

## Still required before production financial operations

- Real member/partner/admin identity and session management
- Production D1 database ID
- R2 bucket
- Notification delivery
- Scheduled reward/expiry/transfer state-transition workers
- Payment/settlement integration when selected
