import { createDynamicPaymentSession } from "@/api/payment";
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
    currency = "EUR",
  }) => {
    setCreatingDynamicCheckout(true);
    const successCallbackFunction = () => { };

    console.log("=== PAYMENT HOOK DEBUG ===");
    console.log("Raw input parameters:", {
      email,
      amount,
      travellers,
      country,
      insurance,
      applicationId,
      travelerIndex,
      paymentType,
      visaTypeId,
      currency,
    });

    // Ensure paymentType uses backend-expected naming for various payment flows
    let normalizedPaymentType = paymentType;
    if (paymentType === "insurance") normalizedPaymentType = "traveler_insurance";
    if (paymentType === "insurance_additional") normalizedPaymentType = "additional_traveler_insurance";
    if (paymentType === "additional_traveler") normalizedPaymentType = "additional_traveler";
    if (paymentType === "full_payment") normalizedPaymentType = "full_payment";

    // Note: orderId may be provided via sessionStorage or generated below if needed

    let successUrl = "/payment-success";

    if (normalizedPaymentType === "application_creation") {
      if (applicationId) {
        successUrl = `/application-step?application_id=${encodeURIComponent(
          applicationId
        )}`;
      } else {
        successUrl = "/payment-success";
      }
    } else if (
      normalizedPaymentType === "additional_traveler_insurance" ||
      normalizedPaymentType === "traveler_insurance" ||
      normalizedPaymentType === "full_payment" ||
      normalizedPaymentType === "additional_traveler"
    ) {
      successUrl = "/payment-success";
      successUrl += `?payment_type=${encodeURIComponent(normalizedPaymentType)}&application_id=${encodeURIComponent(
        applicationId
      )}&traveler_index=${encodeURIComponent(travelerIndex)}`;

      // Store payment metadata in localStorage as backup
      const paymentMetadata = {
        paymentType: normalizedPaymentType,
        applicationId,
        travelerIndex,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "paymentMetadata",
        JSON.stringify(paymentMetadata)
      );
      console.log("Stored payment metadata:", paymentMetadata);
    }

    // Normalize payload fields to strings (backend DTO expects strings)
    const normalizedTravellers = typeof travellers === "string" ? travellers.trim() : String(travellers || "");
    const normalizedAmount = String(amount ?? "0");
    const normalizedCountry = String(country ?? "");
    const normalizedInsurance =
      typeof insurance === "boolean"
        ? insurance
          ? "true"
          : "false"
        : String(insurance ?? "");
    const normalizedApplicationId = applicationId ? String(applicationId) : undefined;
    const normalizedTravelerIndex =
      travelerIndex === undefined || travelerIndex === null
        ? undefined
        : String(travelerIndex);

    const payload = {
      email: String(email || ""),
      successUrl: successUrl,
      cancelUrl: "/cancel-payment",
      amount: normalizedAmount,
      travellers: normalizedTravellers,
      country: normalizedCountry,
      insurance: normalizedInsurance,
      applicationId: normalizedApplicationId,
      travelerIndex: normalizedTravelerIndex,
      // use normalized payment type
      paymentType: normalizedPaymentType,
      visaTypeId: visaTypeId ? String(visaTypeId) : undefined,
      // Ensure currency is passed to backend (default to EUR)
      currency: (currency || "EUR").toString(),
      // ensure an orderId exists for server-side bookkeeping
      orderId:
        (typeof window !== "undefined" && window.sessionStorage?.getItem("lastOrderId")) ||
        undefined,
    };

    // If no orderId provided by caller, generate one and persist temporarily
    if (!payload.orderId) {
      const generated = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      payload.orderId = generated;
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("lastOrderId", generated);
        }
      } catch {
        // ignore session storage failures
      }
    }

    console.log("Final payload being sent to API:", payload);
    console.log("=== END PAYMENT HOOK DEBUG ===");

    try {
      const response = await createDynamicPaymentSession(payload, successCallbackFunction);

      console.log("=== PAYMENT API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response?.data);
      console.log("Response status:", response?.status);
      console.log("=== END PAYMENT API RESPONSE ===");

      // Backend may return the checkout URL in different shapes.
      const redirectUrl =
        response?.data?.data?.results?.url ||
        response?.data?.results?.url ||
        response?.url ||
        response?.data?.url ||
        null;

      setCreatingDynamicCheckout(false);

      if (redirectUrl && typeof window !== "undefined") {
        console.log("Redirecting to Stripe checkout:", redirectUrl);
        // Use assign so browser history keeps track for back button
        window.location.assign(redirectUrl);
        // Return response in case caller wants to await it
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
