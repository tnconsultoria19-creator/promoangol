export const transactionStatuses = [
  "PENDING_PARTNER_CONFIRMATION",
  "PENDING_MEMBER_CONFIRMATION",
  "VERIFIED",
  "REJECTED",
  "DISPUTED",
  "REVERSED",
] as const;

export const redemptionStatuses = [
  "REQUESTED",
  "AWAITING_PARTNER",
  "AWAITING_ADMIN",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "USED",
  "EXPIRED",
] as const;

export type TransactionStatus = (typeof transactionStatuses)[number];
export type RedemptionStatus = (typeof redemptionStatuses)[number];
