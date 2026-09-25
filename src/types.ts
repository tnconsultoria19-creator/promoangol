export interface UserSession {
  token: string;
  role: "MASTER_ADMIN" | "PARTNER_ADMIN" | "PARTNER_STAFF" | "MEMBER";
  email: string;
  name: string;
  detail: string;
  referenceId: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description?: string | null;
  listing_title?: string | null;
  base_price_kz?: number | null;
  partner_name?: string | null;
  partner_category?: string | null;
  delivery_mode?: "POINTS" | "DISCOUNT" | string | null;
  member_benefit_kz?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
}
