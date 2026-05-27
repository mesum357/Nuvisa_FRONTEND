const DEFAULT_GIFT_CARD_AMOUNT = 159;

export function parseGiftCardAmount(amount) {
  const parsed = Number.parseFloat(
    String(amount ?? "")
      .replace(/[^\d.]/g, "")
      .trim(),
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GIFT_CARD_AMOUNT;
}

/**
 * Visa package total before gift-card free-traveller waivers (group/student discounts included).
 */
export function computeVisaPackagePrice({
  perTravelerFee,
  travelers,
  appliedDiscount = null,
}) {
  const travelerCount = Math.max(0, Number(travelers) || 0);
  const fee = Math.max(0, Number(perTravelerFee) || 0);
  let total = fee * travelerCount;

  if (travelerCount >= 3) {
    total -= total * 0.2;
  }

  if (appliedDiscount?.code === "STUDENT10") {
    total -= total * 0.1;
  }

  return Number(total.toFixed(2));
}

export function buildGiftCardValidationContext({
  perTravelerFee,
  travelers,
  appliedDiscount = null,
  appliedGiftCardCount = 0,
  appliedGiftCards = [],
  packagePrice,
}) {
  const travelerCount = Math.max(0, Number(travelers) || 0);
  const resolvedPackagePrice =
    packagePrice !== undefined
      ? Number(packagePrice)
      : computeVisaPackagePrice({
          perTravelerFee,
          travelers: travelerCount,
          appliedDiscount,
        });

  const appliedCards = Array.isArray(appliedGiftCards) ? appliedGiftCards : [];
  const appliedCount =
    appliedCards.length > 0
      ? appliedCards.length
      : Math.max(0, Number(appliedGiftCardCount) || 0);

  return {
    packagePrice: resolvedPackagePrice,
    travelerCount,
    appliedGiftCardCount: appliedCount,
    appliedGiftCardsTotal: getTotalGiftCardMonetaryDiscount(appliedCards),
  };
}

export function getGiftCardEligibilityError({
  packagePrice,
  travelerCount,
  appliedGiftCardCount = 0,
  appliedGiftCardsTotal = 0,
  giftCardAmount = DEFAULT_GIFT_CARD_AMOUNT,
}) {
  const cardAmount = parseGiftCardAmount(giftCardAmount);
  const travelers = Math.max(0, Math.floor(Number(travelerCount) || 0));
  const applied = Math.max(0, Math.floor(Number(appliedGiftCardCount) || 0));
  const nextCount = applied + 1;
  const packageTotal = Number(packagePrice) || 0;
  const alreadyAppliedTotal = Math.max(0, Number(appliedGiftCardsTotal) || 0);
  const requiredTotal = alreadyAppliedTotal + cardAmount;

  if (travelers < 1) {
    return "Add at least one traveller to apply a gift card.";
  }

  if (nextCount > travelers) {
    return `You can apply at most ${travelers} gift card${travelers === 1 ? "" : "s"} for ${travelers} traveller${travelers === 1 ? "" : "s"}.`;
  }

  if (packageTotal < requiredTotal) {
    const remaining = Math.max(0, packageTotal - alreadyAppliedTotal);
    if (alreadyAppliedTotal > 0) {
      return `Your remaining package balance (£${remaining.toFixed(2)}) is not enough to apply this gift card (£${cardAmount.toFixed(2)}).`;
    }
    return `Your package total must be at least £${cardAmount.toFixed(2)} to apply this gift card. Your current package total is £${packageTotal.toFixed(2)}.`;
  }

  return null;
}

/** Sum of monetary value for applied gift-card coupon codes (default £159 each). */
export function getTotalGiftCardMonetaryDiscount(redeemedGiftCards = []) {
  if (!Array.isArray(redeemedGiftCards) || redeemedGiftCards.length === 0) {
    return 0;
  }

  return redeemedGiftCards.reduce(
    (sum, card) => sum + parseGiftCardAmount(card?.amount),
    0,
  );
}

/** Apply gift-card coupon as a fixed £ discount (not a full traveller waiver). */
export function subtractGiftCardCouponDiscount(subtotal, redeemedGiftCards = []) {
  const raw = Number(subtotal) || 0;
  const discount = Math.min(raw, getTotalGiftCardMonetaryDiscount(redeemedGiftCards));
  return Math.max(0, Number((raw - discount).toFixed(2)));
}

export function formatGiftCardAppliedMessage(code, amount = DEFAULT_GIFT_CARD_AMOUNT) {
  const value = parseGiftCardAmount(amount);
  return `Gift card ${code} applied! £${value.toFixed(2)} will be deducted when payment completes.`;
}
