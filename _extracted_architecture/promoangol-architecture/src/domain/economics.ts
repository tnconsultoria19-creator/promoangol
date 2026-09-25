export type CommissionMode = "PERCENT_OF_PURCHASE" | "FIXED_KZ";
export type BenefitMode = "FIXED_KZ" | "PERCENT_OF_COMMISSION" | "FULL_COMMISSION";
export type MemberBenefitDelivery = "POINTS" | "DISCOUNT";

export interface PromotionEconomicsInput {
  purchaseAmountKz: number;
  commissionMode: CommissionMode;
  commissionValue: number;
  benefitMode: BenefitMode;
  benefitValue?: number;
  delivery: MemberBenefitDelivery;
}

export interface PromotionEconomicsResult {
  commissionKz: number;
  memberBenefitKz: number;
  platformMarginKz: number;
  pointsAwarded: number;
  discountKz: number;
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative number`);
}

export function calculatePromotionEconomics(input: PromotionEconomicsInput): PromotionEconomicsResult {
  assertNonNegative(input.purchaseAmountKz, "purchaseAmountKz");
  assertNonNegative(input.commissionValue, "commissionValue");
  assertNonNegative(input.benefitValue ?? 0, "benefitValue");

  const commissionKz = Math.round(
    input.commissionMode === "FIXED_KZ"
      ? input.commissionValue
      : input.purchaseAmountKz * (input.commissionValue / 100),
  );

  if (input.commissionMode === "FIXED_KZ" && commissionKz > input.purchaseAmountKz) {
    throw new Error("Commission cannot exceed the purchase amount");
  }

  let memberBenefitKz: number;
  switch (input.benefitMode) {
    case "FIXED_KZ":
      memberBenefitKz = Math.round(input.benefitValue ?? 0);
      break;
    case "PERCENT_OF_COMMISSION":
      memberBenefitKz = Math.round(commissionKz * ((input.benefitValue ?? 0) / 100));
      break;
    case "FULL_COMMISSION":
      memberBenefitKz = commissionKz;
      break;
    default:
      throw new Error("Unsupported benefit mode");
  }

  // PromoAngol cannot grant a member more value than the commission it receives
  // under this commercial model unless a future rule explicitly creates a funded subsidy.
  if (memberBenefitKz > commissionKz) {
    throw new Error("Member benefit exceeds partner commission");
  }

  const platformMarginKz = commissionKz - memberBenefitKz;
  return {
    commissionKz,
    memberBenefitKz,
    platformMarginKz,
    pointsAwarded: input.delivery === "POINTS" ? memberBenefitKz : 0,
    discountKz: input.delivery === "DISCOUNT" ? memberBenefitKz : 0,
  };
}
