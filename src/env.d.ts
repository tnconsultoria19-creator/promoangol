interface Env {
  ASSETS: Fetcher;
  PROMOANGOL_DB: D1Database;
  PROMOANGOL_FILES: R2Bucket;
  SESSION_SECRET?: string;
  GEMINI_API_KEY?: string;
}
