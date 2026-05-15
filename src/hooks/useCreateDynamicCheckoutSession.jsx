import { createDynamicPaymentSession } from "@/api/payment";
import {
  countryForStripeSession,
  currencyForStripeSession,
} from "@/utils/stripeHostedCheckoutUk";
import { buildCheckoutReturnUrl } from "@/utils/checkoutOrigin";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useAppDispatch } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import Cookies from "js-cookie";
import React, { useState } from "react";

const useCreateDynamicCheckoutSession = () => {
  const dispatch = useAppDispatch();
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
    billingCountry,
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

    const toReturnPath = (url) => {
      if (!url) return url;
      const value = String(url)
        .trim()
        .replace(/^(https?)\/\//i, "$1://");
      if (!/^https?:\/\//i.test(value)) return value;

      try {
        const parsed = new URL(value);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return value;
      }
    };

    const normalizedPm = String(paymentMethod || "")
      .trim()
      .toLowerCase();

    let successUrl = successUrlOverride || "/payment-success";

    const checkoutOrigin =
      typeof window !== "undefined"
        ? window.location.origin.replace(/\/+$/, "")
        : "";

    if (normalizedPm === "klarna") {
      successUrl =
        successUrlOverride || buildCheckoutReturnUrl("/payment-success");
    } else if (normalizedPaymentType === "application_creation") {
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

    const visaCountryName = String(normalizedCountry || "").trim();
    const billingIso = billingCountry
      ? countryForStripeSession(billingCountry)
      : countryForStripeSession(visaCountryName);
    const currencyForSession = currencyForStripeSession(
      billingCountry || normalizedCountry,
      currency
    );

    const cancelUrl =
      cancelUrlOverride ||
      (normalizedPm === "klarna"
        ? buildCheckoutReturnUrl("/visa-checkout")
        : applicationId
        ? `/application-step?application_id=${encodeURIComponent(
            applicationId
          )}`
        : "/visa-checkout");

    const useAbsoluteKlarnaUrls = normalizedPm === "klarna" && checkoutOrigin;

    const payload = {
      email: String(email || ""),
      successUrl: useAbsoluteKlarnaUrls ? successUrl : toReturnPath(successUrl),
      cancelUrl: useAbsoluteKlarnaUrls ? cancelUrl : toReturnPath(cancelUrl),
      ...(useAbsoluteKlarnaUrls ? { checkoutOrigin } : {}),
      amount: normalizedAmount,
      travellers: normalizedTravellers,
      country: visaCountryName,
      ...(normalizedPm === "klarna" && billingIso
        ? { billingCountry: billingIso }
        : {}),
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
      ...(normalizedPm === "klarna" && klarnaFormData
        ? {
            billingName:
              klarnaFormData.firstName && klarnaFormData.lastName
                ? `${klarnaFormData.firstName} ${klarnaFormData.lastName}`.trim()
                : undefined,
            name:
              klarnaFormData.firstName && klarnaFormData.lastName
                ? `${klarnaFormData.firstName} ${klarnaFormData.lastName}`.trim()
                : undefined,
            phone: klarnaFormData.phone,
            address: klarnaFormData.address,
            city: klarnaFormData.city,
            postalCode: klarnaFormData.postalCode,
          }
        : {}),
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

      const results =
        response?.data?.data?.results ||
        response?.data?.results ||
        response?.data ||
        {};

      if (results?.token) {
        await localStorageGateway("token", localStorageEnums.SET, results.token);
        await Cookies.set("token", results.token);
        dispatch(setAuthState(true));
      }

      if (results?.user) {
        await Cookies.set("user", JSON.stringify(results.user));
        await localStorageGateway(
          "user",
          localStorageEnums.SET,
          JSON.stringify(results.user)
        );
        if (results.user.id) {
          dispatch(setAuthId(results.user.id));
        }
      }

      if (email) {
        await localStorageGateway("userEmail", localStorageEnums.SET, email);
        await Cookies.set("userEmail", email);
      }



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
