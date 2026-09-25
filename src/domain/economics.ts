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
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(label + " must be a non-negative number");
  }
}

function assertPercent(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(label + " must be between 0 and 100");
  }
}

function assertKz(value: number, label: string): void {
  assertNonNegative(value, label);
  if (!Number.isInteger(value)) throw new Error(label + " must be a whole Kz amount");
}

export function calculatePromotionEconomics(input: PromotionEconomicsInput): PromotionEconomicsResult {
  assertKz(input.purchaseAmountKz, "purchaseAmountKz");
  assertNonNegative(input.commissionValue, "commissionValue");
  assertNonNegative(input.benefitValue ?? 0, "benefitValue");

  if (input.commissionMode === "PERCENT_OF_PURCHASE") {
    assertPercent(input.commissionValue, "commissionValue");
  } else {
    assertKz(input.commissionValue, "commissionValue");
  }

  if (input.benefitMode === "PERCENT_OF_COMMISSION") {
    assertPercent(input.benefitValue ?? 0, "benefitValue");
  } else {
    assertKz(input.benefitValue ?? 0, "benefitValue");
  }

  const commissionKz = Math.round(
    input.commissionMode === "FIXED_KZ"
      ? input.commissionValue
      : input.purchaseAmountKz * (input.commissionValue / 100),
  );

  if (commissionKz > input.purchaseAmountKz) {
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
