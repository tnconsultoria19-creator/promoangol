# PromoAngol Cloudflare deployment

## Resources

Create these once in the target Cloudflare account:

```bash
npx wrangler@latest d1 create promoangol-db
npx wrangler@latest r2 bucket create promoangol-files
```

Copy the D1 database ID returned by Wrangler into `wrangler.jsonc`.

## Install / migrate / build

```bash
npm install
npm run db:migrate
npm run typecheck
npm run build
```

## Local development

```bash
npm run dev
```

For scheduled operations, Cloudflare's local development supports the scheduled handler through `/cdn-cgi/local/scheduled` when running the Worker development environment.

## Production deploy

```bash
npm run deploy
```

Workers Static Assets and the Worker API are deployed together. Keep `/api/*` on the Worker and serve the rest as static assets.

## Database discipline

Never manually edit a member's point balance. Use ledger entries and state transitions. Apply schema changes through sequential D1 migrations.
