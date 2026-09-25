# PromoAngol

Cloudflare-ready foundation for the PromoAngol rewards ecosystem.

## Important

The current GitHub integration available to this session can read `tnconsultoria19-creator/promoangol`, but its write operation returned HTTP 403 (`Resource not accessible by integration`). The files in this package are therefore a prepared scaffold, not a commit pushed into GitHub.

## Setup

1. Put these files into the repository root alongside the existing Stitch design bundle.
2. Create/bind a D1 database and place its ID in `wrangler.jsonc`.
3. Create/bind the R2 bucket named `promoangol-files`, or change the bucket name in `wrangler.jsonc`.
4. Run `npm install`.
5. Run `npm run typecheck`.
6. Apply migrations with `npm run db:migrate`.
7. Run `npm run dev` for local development.
8. Deploy with `npm run deploy`.

Do not expose secrets in frontend code. Authentication should be implemented server-side before admin or partner API routes are enabled.
