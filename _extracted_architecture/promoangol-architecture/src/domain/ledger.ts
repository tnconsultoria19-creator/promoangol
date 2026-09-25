export type LedgerBucket = "PENDING" | "AVAILABLE" | "RESERVED";
export type LedgerDirection = "CREDIT" | "DEBIT";

export interface LedgerEntry {
  memberId: string;
  bucket: LedgerBucket;
  direction: LedgerDirection;
  points: number;
  reason: string;
  referenceType: string;
  referenceId: string;
  expiresAt?: string | null;
  sourceEntryId?: string | null;
}

export function signedPoints(entry: LedgerEntry): number {
  return entry.direction === "CREDIT" ? entry.points : -entry.points;
}

export function validateLedgerEntry(entry: LedgerEntry): void {
  if (!entry.memberId || !entry.referenceId || !entry.referenceType) throw new Error("Ledger reference is required");
  if (!Number.isInteger(entry.points) || entry.points <= 0) throw new Error("Ledger points must be a positive integer");
}

/**
 * A balance is derived from ledger entries. Do not persist a mutable points balance as source-of-truth.
 */
export function deriveBalance(entries: LedgerEntry[], bucket: LedgerBucket): number {
  return entries.filter((entry) => entry.bucket === bucket).reduce((sum, entry) => sum + signedPoints(entry), 0);
}
