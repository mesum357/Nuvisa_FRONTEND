// Coupon validation API functions
import { backendApiEnums } from "@/enums/backendApi.enums";
import { getPublicApiBase } from "@/utils/adminApiBase";

// Validate coupon code
export const validateCouponCode = async (code) => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.COUPON.VALIDATE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.toUpperCase() }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to validate coupon");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Coupon validation error:", error);
    // Fallback to client-side validation if API fails
    return fallbackValidateCoupon(code);
  }
};

// Get available coupons
export const getAvailableCoupons = async () => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.COUPON.AVAILABLE}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch available coupons");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get available coupons error:", error);
    return { coupons: [] };
  }
};

// Apply coupon to cart/order
export const applyCoupon = async (couponCode, orderData) => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.COUPON.APPLY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          ...orderData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to apply coupon");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Apply coupon error:", error);
    throw error;
  }
};

// Remove coupon from cart/order
export const removeCoupon = async (couponCode, orderData) => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.COUPON.REMOVE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          ...orderData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove coupon");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Remove coupon error:", error);
    throw error;
  }
};

// Fallback client-side validation when API is unavailable
const fallbackValidateCoupon = (code) => {
  const validCoupons = {
    STUDENT10: {
      valid: true,
      discount: 10,
      description: "Student Discount",
      message: "Student discount applied successfully",
    },
    SAVE10: {
      valid: true,
      discount: 10,
      description: "10% Discount",
      message: "10% discount applied successfully",
    },
    GROUP20: {
      valid: true,
      discount: 20,
      description: "Group Discount (3+ travelers)",
      message: "Group discount applied successfully",
    },
    WELCOME15: {
      valid: true,
      discount: 15,
      description: "Welcome Discount",
      message: "Welcome discount applied successfully",
    },
  };

  const coupon = validCoupons[code.toUpperCase()];
  if (coupon) {
    return coupon;
  }

  return {
    valid: false,
    message: "Invalid coupon code. Please check and try again.",
  };
};

// Check if coupon requires additional verification (e.g., student email)
export const requiresVerification = (couponCode) => {
  const verificationRequired = ["STUDENT10", "STUDENT15", "STUDENT20"];
  return verificationRequired.includes(couponCode.toUpperCase());
};

// Verify student coupon with email
export const verifyStudentCoupon = async (couponCode, email) => {
  try {
    const response = await fetch(
      `${getPublicApiBase()}${backendApiEnums.ENDPOINTS.COUPON.VERIFY_STUDENT}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          email: email.toLowerCase(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to verify student coupon");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Student coupon verification error:", error);
    return {
      valid: false,
      message: "Failed to verify student status. Please try again.",
    };
  }
};
