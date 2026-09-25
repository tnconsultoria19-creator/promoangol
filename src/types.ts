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
  listing_id?: string | null;
  title: string;
  description?: string | null;
  listing_title?: string | null;
  base_price_kz?: number | null;
  partner_name?: string | null;
  partner_category?: string | null;
  delivery_mode?: "POINTS" | "DISCOUNT" | string | null;
  member_benefit_kz?: number | null;
  commission_mode?: string | null;
  commission_value?: number | null;
  benefit_mode?: string | null;
  benefit_value?: number | null;
  status?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
}
