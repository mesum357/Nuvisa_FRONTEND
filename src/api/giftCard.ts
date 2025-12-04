// Gift card validation and redemption API functions
import { backendApiEnums } from "@/enums/backendApi.enums";

// Validate gift card code
export const validateGiftCardCode = async (code: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${backendApiEnums.ENDPOINTS.GIFT_CARD.VALIDATE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      }
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
export const redeemGiftCardCode = async (code: string, email?: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${backendApiEnums.ENDPOINTS.GIFT_CARD.REDEEM}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          ...(email && { email }),
        }),
      }
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

