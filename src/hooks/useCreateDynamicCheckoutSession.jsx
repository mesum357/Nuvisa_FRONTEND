import { createDynamicPaymentSession } from "@/api/payment";
import {
  countryForStripeSession,
  currencyForStripeSession,
} from "@/utils/stripeHostedCheckoutUk";
import React, { useState } from "react";

const useCreateDynamicCheckoutSession = () => {
  const [cretingDynamicCheckout, setCreatingDynamicCheckout] = useState(false);

  const handleCreateDynamicCheckoutSession = async ({
    email = "",
    amount = 0,
    travellers,
    country,
    insurance,
    applicationId = "",
    travelerIndex = "",
    paymentType = "application_creation",
    visaTypeId = "",
    // Default logical currency for visa checkout is GBP
    currency = "GBP",
    travelData,
    noOfInsurance,
    insurancePaymentAmount,
    uiMode = "hosted", // 'hosted' or 'embedded'
    paymentMethod, // 'klarna', 'stripe', etc.
    klarnaFormData, // Form data for Klarna
    quantity, // Number of gift cards purchased
    noOfGiftCards, // Alternative field name for quantity
    phone,
    successUrl: successUrlOverride,
    cancelUrl: cancelUrlOverride,
    ...options // Additional options
  }) => {
    setCreatingDynamicCheckout(true);
    const successCallbackFunction = () => { };



    // Ensure paymentType uses backend-expected naming for various payment flows
    let normalizedPaymentType = paymentType;
    if (paymentType === "insurance")
      normalizedPaymentType = "traveler_insurance";
    if (paymentType === "insurance_additional")
      normalizedPaymentType = "additional_traveler_insurance";
    if (paymentType === "additional_traveler")
      normalizedPaymentType = "additional_traveler";
    if (paymentType === "full_payment") normalizedPaymentType = "full_payment";

    // Note: orderId may be provided via sessionStorage or generated below if needed

    const toAbsoluteUrl = (url) => {
      if (!url || typeof window === "undefined") return url;
      return new URL(url, window.location.origin).toString();
    };

    let successUrl = successUrlOverride || "/payment-success";

    if (normalizedPaymentType === "application_creation") {
      if (applicationId) {
        successUrl =
          successUrlOverride ||
          `/application-step?application_id=${encodeURIComponent(
            applicationId
          )}`;
      } else {
        successUrl = successUrlOverride || "/payment-success";
      }
    } else if (normalizedPaymentType === "gift_card") {
      // Gift card-only purchase - redirect to payment-success with payment_type parameter
      successUrl =
        successUrlOverride ||
        `/payment-success?payment_type=${encodeURIComponent(
          normalizedPaymentType
        )}`;
      
      // Store payment metadata in localStorage as backup
      const paymentMetadata = {
        paymentType: normalizedPaymentType,
        applicationId: null,
        travelerIndex: null,
        timestamp: Date.now(),
        travelData: travelData || null,
        noOfInsurance: 0,
        insurancePaymentAmount: 0,
        paymentMethod: "stripe",
        paymentDate: new Date().toISOString(),
        simplePaymentType: paymentType,
        email: email,
        amount: amount,
        quantity: quantity || noOfGiftCards || 1
      };
      localStorage.setItem(
        "paymentMetadata",
        JSON.stringify(paymentMetadata)
      );
    } else if (
      normalizedPaymentType === "additional_traveler_insurance" ||
      normalizedPaymentType === "traveler_insurance" ||
      normalizedPaymentType === "full_payment" ||
      normalizedPaymentType === "additional_traveler"
    ) {
      successUrl =
        successUrlOverride ||
        `/payment-success-full?payment_type=${encodeURIComponent(
          normalizedPaymentType
        )}&application_id=${encodeURIComponent(
          applicationId
        )}&traveler_index=${encodeURIComponent(travelerIndex)}`;



      // Store payment metadata in localStorage as backup
      const paymentMetadata = {
        paymentType: normalizedPaymentType,
        applicationId,
        travelerIndex,
        timestamp: Date.now(),
        travelData: travelData || null,
        noOfInsurance: noOfInsurance || 0,
        insurancePaymentAmount: insurancePaymentAmount || 0,
        paymentMethod: "stripe",
        paymentDate: new Date().toISOString(),
        simplePaymentType: paymentType
      };
      localStorage.setItem(
        "insurancePaymentMetadata",
        JSON.stringify(paymentMetadata)
      );
    }


    // Normalize payload fields to strings (backend DTO expects strings)
    const normalizedTravellers =
      typeof travellers === "string"
        ? travellers.trim()
        : String(travellers || "");
    const normalizedAmount = String(amount ?? "0");
    const normalizedCountry = String(country ?? "");
    const normalizedInsurance =
      typeof insurance === "boolean"
        ? insurance
          ? "true"
          : "false"
        : String(insurance ?? "");
    const normalizedApplicationId = applicationId
      ? String(applicationId)
      : undefined;
    const normalizedTravelerIndex =
      travelerIndex === undefined || travelerIndex === null
        ? undefined
        : String(travelerIndex);

    const countryForSession = countryForStripeSession(normalizedCountry);
    const currencyForSession = currencyForStripeSession(
      normalizedCountry,
      currency
    );

    const normalizedPm = String(paymentMethod || "")
      .trim()
      .toLowerCase();

    const cancelUrl =
      cancelUrlOverride ||
      (normalizedPm === "klarna"
        ? "/visa-checkout"
        : applicationId
        ? `/application-step?application_id=${encodeURIComponent(
            applicationId
          )}`
        : "/visa-checkout");

    const payload = {
      email: String(email || ""),
      successUrl: toAbsoluteUrl(successUrl),
      cancelUrl: toAbsoluteUrl(cancelUrl),
      amount: normalizedAmount,
      travellers: normalizedTravellers,
      country: countryForSession,
      insurance: normalizedInsurance,
      applicationId: normalizedApplicationId,
      travelerIndex: normalizedTravelerIndex,
      // use normalized payment type
      paymentType: normalizedPaymentType,
      visaTypeId: visaTypeId ? String(visaTypeId) : undefined,
      // UK: always `gbp`; other regions: lowercase ISO4217 (Nest/Stripe contract)
      currency: currencyForSession,
      // UI mode for checkout (embedded or hosted)
      uiMode: uiMode || "hosted",
      // ensure an orderId exists for server-side bookkeeping
      orderId:
        (typeof window !== "undefined" &&
          window.sessionStorage?.getItem("lastOrderId")) ||
        undefined,
      // Do not send Klarna hints on non-Klarna checkouts
      ...(normalizedPm === "klarna"
        ? {
            paymentMethod: "klarna",
            payment_method_types: ["klarna"],
            stripePaymentMethodTypes: ["klarna"],
          }
        : paymentMethod
          ? { paymentMethod: String(paymentMethod).trim() }
          : {}),
      // Additional metadata (like Klarna form data)
      ...(klarnaFormData ? { klarnaFormData: klarnaFormData } : {}),
      // Insurance-related fields
      noOfInsurance: noOfInsurance || undefined,
      insurancePaymentAmount: insurancePaymentAmount || undefined,
      // Gift card quantity - include when paymentType includes "gift_card"
      ...(normalizedPaymentType && normalizedPaymentType.includes("gift_card") && (quantity || noOfGiftCards)
        ? { quantity: String(quantity || noOfGiftCards || "1"), noOfGiftCards: String(quantity || noOfGiftCards || "1") }
        : {}),
      ...(phone !== undefined && phone !== null && String(phone).trim() !== ""
        ? { phone: String(phone).trim() }
        : {}),
    };

    // If no orderId provided by caller, generate one and persist temporarily
    if (!payload.orderId) {
      const generated = `order_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      payload.orderId = generated;
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("lastOrderId", generated);
        }
      } catch {
        // ignore session storage failures
      }
    }

    try {
      const response = await createDynamicPaymentSession(
        payload,
        successCallbackFunction
      );



      // Backend may return the checkout URL in different shapes.
      const redirectUrl =
        response?.data?.data?.results?.url ||
        response?.data?.results?.url ||
        response?.url ||
        response?.data?.url ||
        null;

      setCreatingDynamicCheckout(false);

      // Klarna: `KlarnaForm` performs redirect after reading the same URL from the response.
      if (
        redirectUrl &&
        typeof window !== "undefined" &&
        normalizedPm !== "klarna"
      ) {
        window.location.assign(redirectUrl);
        return response;
      }

      return response;
    } catch (error) {
      console.error("=== PAYMENT API ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("=== END PAYMENT API ERROR ===");

      setCreatingDynamicCheckout(false);
      throw error;
    }
  };

  return { handleCreateDynamicCheckoutSession, cretingDynamicCheckout };
};

export default useCreateDynamicCheckoutSession;
