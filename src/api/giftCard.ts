// Gift card validation and redemption API functions
import { backendApiEnums } from "@/enums/backendApi.enums";
import { getPublicApiBase } from "@/utils/adminApiBase";

export type GiftCardValidationContext = {
  packagePrice?: number;
  travelerCount?: number;
  appliedGiftCardCount?: number;
  /** Sum of monetary value already applied via other gift-card codes */
  appliedGiftCardsTotal?: number;
};

export const fulfillGiftCardPurchase = async (payload: {
  email: string;
  amount: string;
  quantity?: number;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
}) => {
  const response = await fetch(
    `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.GIFT_CARD.FULFILL_PURCHASE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Failed to fulfill gift card purchase",
    );
  }

  return response.json();
};

// Validate gift card code
export const validateGiftCardCode = async (
  code: string,
  context?: GiftCardValidationContext,
) => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.GIFT_CARD.VALIDATE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          ...(context || {}),
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to validate gift card");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gift card validation error:", error);
    throw error;
  }
};

// Redeem gift card code
export const redeemGiftCardCode = async (
  code: string,
  email?: string,
  context?: GiftCardValidationContext,
) => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.GIFT_CARD.REDEEM}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          ...(email && { email }),
          ...(context || {}),
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to redeem gift card");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gift card redemption error:", error);
    throw error;
  }
};
