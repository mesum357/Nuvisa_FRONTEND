/**
 * Resolves Stripe/backend paymentType from checkout cart composition.
 */
export function resolveCheckoutPaymentType({
  travelers = 0,
  finalVisaFees = 0,
  includeGiftCard = false,
  giftCardCount = 0,
  includeInsurance = false,
  insuranceCount = 0,
}) {
  const types = [];
  const hasVisa = Number(travelers) > 0 && Number(finalVisaFees) > 0;
  const hasGiftCard =
    includeGiftCard && Number(giftCardCount) > 0;
  const hasInsurance =
    includeInsurance && Number(insuranceCount) > 0;

  if (hasVisa) {
    types.push("application_creation");
  }
  if (hasGiftCard) {
    types.push("gift_card");
  }
  if (hasInsurance && !hasVisa) {
    types.push("traveler_insurance");
  }

  if (types.length === 0) {
    if (hasInsurance) return "traveler_insurance";
    if (hasGiftCard) return "gift_card";
    return "application_creation";
  }

  return types.join(",");
}

export function canCheckoutWithoutDestinationCountry({
  travelers = 0,
  finalVisaFees = 0,
  includeGiftCard = false,
  giftCardCount = 0,
  includeInsurance = false,
  insuranceCount = 0,
}) {
  const hasVisa = Number(travelers) > 0 && Number(finalVisaFees) > 0;
  const hasGiftCard =
    includeGiftCard && Number(giftCardCount) > 0;
  const hasInsurance =
    includeInsurance && Number(insuranceCount) > 0;
  return !hasVisa && (hasGiftCard || hasInsurance);
}

export function hasCheckoutLineItems({
  travelers = 0,
  finalVisaFees = 0,
  includeGiftCard = false,
  giftCardCount = 0,
  includeInsurance = false,
  insuranceCount = 0,
}) {
  const hasVisa = Number(travelers) > 0 && Number(finalVisaFees) > 0;
  const hasGiftCard =
    includeGiftCard && Number(giftCardCount) > 0;
  const hasInsurance =
    includeInsurance && Number(insuranceCount) > 0;
  return hasVisa || hasGiftCard || hasInsurance;
}
