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
    travelData,
    noOfInsurance,
    insurancePaymentAmount,
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
      successUrl = "/payment-success-full";
      successUrl += `?payment_type=${encodeURIComponent(
        normalizedPaymentType
      )}`;
      successUrl += `&application_id=${encodeURIComponent(applicationId)}`;
      successUrl += `&traveler_index=${encodeURIComponent(travelerIndex)}`;



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

    const payload = {
      email: String(email || ""),
      successUrl,
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
        (typeof window !== "undefined" &&
          window.sessionStorage?.getItem("lastOrderId")) ||
        undefined,
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

      if (redirectUrl && typeof window !== "undefined") {
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
