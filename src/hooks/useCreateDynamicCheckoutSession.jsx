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
  }) => {
    setCreatingDynamicCheckout(true);
    const successCallbackFunction = () => {};

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
    });

    // Build success URL with metadata for insurance payments
    let successUrl = "/payment-success";
    if (
      paymentType === "additional_traveler_insurance" ||
      paymentType === "traveler_insurance"
    ) {
      successUrl += `?payment_type=${paymentType}&application_id=${applicationId}&traveler_index=${travelerIndex}`;

      // Also store insurance payment metadata in localStorage as backup
      // since session handling might not preserve URL parameters
      const insurancePaymentMetadata = {
        paymentType,
        applicationId,
        travelerIndex,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "insurancePaymentMetadata",
        JSON.stringify(insurancePaymentMetadata)
      );
      console.log(
        "Stored insurance payment metadata:",
        insurancePaymentMetadata
      );
    }

    const payload = {
      email,
      successUrl: successUrl,
      cancelUrl: "/cancel-payment",
      amount,
      travellers: travellers.trim(),
      country,
      insurance,
      applicationId,
      travelerIndex,
      paymentType,
      visaTypeId,
    };

    console.log("Final payload being sent to API:", payload);
    console.log("=== END PAYMENT HOOK DEBUG ===");

    try {
      const response = await createDynamicPaymentSession(
        payload,
        successCallbackFunction
      );

      console.log("=== PAYMENT API RESPONSE ===");
      console.log("Full response:", response);
      console.log("Response data:", response?.data);
      console.log("Response status:", response?.status);
      console.log("=== END PAYMENT API RESPONSE ===");

      setCreatingDynamicCheckout(false);
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
