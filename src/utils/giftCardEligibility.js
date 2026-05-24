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

  return {
    packagePrice: resolvedPackagePrice,
    travelerCount,
    appliedGiftCardCount: Math.max(0, Number(appliedGiftCardCount) || 0),
  };
}

export function getGiftCardEligibilityError({
  packagePrice,
  travelerCount,
  appliedGiftCardCount = 0,
  giftCardAmount = DEFAULT_GIFT_CARD_AMOUNT,
}) {
  const cardAmount = parseGiftCardAmount(giftCardAmount);
  const travelers = Math.max(0, Math.floor(Number(travelerCount) || 0));
  const applied = Math.max(0, Math.floor(Number(appliedGiftCardCount) || 0));
  const nextCount = applied + 1;
  const packageTotal = Number(packagePrice) || 0;

  if (travelers < 1) {
    return "Add at least one traveller to apply a gift card.";
  }

  if (nextCount > travelers) {
    return `You can apply at most ${travelers} gift card${travelers === 1 ? "" : "s"} for ${travelers} traveller${travelers === 1 ? "" : "s"}.`;
  }

  const requiredTotal = cardAmount * nextCount;
  if (packageTotal < requiredTotal) {
    return `Your package total must be at least £${requiredTotal.toFixed(2)} to apply ${nextCount} gift card${nextCount === 1 ? "" : "s"} (£${cardAmount.toFixed(2)} each). Your current package total is £${packageTotal.toFixed(2)}.`;
  }

  return null;
}
