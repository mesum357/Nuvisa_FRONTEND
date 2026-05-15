"use client";

/**
 * KlarnaForm Component
 *
 * Complete Klarna Payment Flow:
 * 1. User selects Klarna payment method in OrderCheckout
 * 2. Form appears automatically (via useEffect in OrderCheckout)
 * 3. User fills in required information (name, address, phone, etc.)
 * 4. User clicks "Pay with Klarna" button (main button in OrderCheckout)
 * 5. Form validates all required fields
 * 6. Determines currency based on selected country (GBP for GB, EUR for EU, etc.)
 * 7. Calls backend API to create Stripe checkout session with Klarna
 * 8. Backend creates Stripe session with payment_method_types: ["klarna"]
 * 9. Backend returns checkout URL
 * 10. Frontend redirects user to Stripe checkout page
 * 11. User sees Klarna as payment option on Stripe page
 * 12. User clicks "Continue with Klarna"
 * 13. Stripe redirects to Klarna payment page
 * 14. User completes payment on Klarna
 * 15. Klarna redirects back to success_url
 *
 * Supported Countries: GB, DE, FR, IT, ES, NL, BE, AT, FI, IE, PT, SE, NO, DK, PL
 * Supported Currencies: GBP, EUR, SEK, NOK, DKK, PLN
 */

import React, { useState } from "react";
import { SiKlarna } from "react-icons/si";
import { persistCheckoutPaymentContext } from "@/utils/persistCheckoutPaymentContext";
import { buildCheckoutReturnUrl } from "@/utils/checkoutOrigin";

const KlarnaForm = ({
  email,
  amount,
  travelers,
  country,
  insurance,
  visaTypeId,
  insuranceCount,
  insurancePaymentAmount,
  paymentType = "application_creation",
  applicationId,
  travelerIndex,
  paymentWithoutInsurance,
  paymentWithDiscount,
  onCreateCheckoutSession,
  onSuccess,
  onError,
  onSubmittingChange,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "GB",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (!onCreateCheckoutSession) {
      console.error("Checkout session handler not provided");
      if (onError) {
        onError(new Error("Checkout session handler not provided"));
      }
      return;
    }

    setIsSubmitting(true);
    if (onSubmittingChange) {
      onSubmittingChange(true);
    }
    try {
      // Store Klarna form data
      const klarnaData = {
        email,
        amount,
        ...formData,
      };

      // Store in localStorage for potential use
      localStorage.setItem("klarnaFormData", JSON.stringify(klarnaData));

      // Determine currency based on country for Klarna
      // Klarna is only available for certain countries/currencies
      // Not available for US (USD), Canada (CAD), Australia (AUD)
      const countryCode = formData.country || country || "GB";
      let currency = "GBP"; // Default to GBP for UK

      // Klarna supported countries and their currencies
      if (countryCode === "GB") {
        currency = "GBP";
      } else if (
        ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "FI", "IE", "PT"].includes(
          countryCode
        )
      ) {
        currency = "EUR";
      } else if (countryCode === "SE") {
        currency = "SEK";
      } else if (countryCode === "NO") {
        currency = "NOK";
      } else if (countryCode === "DK") {
        currency = "DKK";
      } else if (countryCode === "PL") {
        currency = "PLN";
      } else {
        // For unsupported countries (US, CA, AU, etc.), Klarna won't work
        // Show error or fall back
        if (onError) {
          onError(
            new Error(
              `Klarna is not available for ${countryCode}. Please select a supported country (GB, DE, FR, IT, ES, NL, SE, NO, DK, PL, etc.) or use a different payment method.`
            )
          );
        }
        setIsSubmitting(false);
        if (onSubmittingChange) {
          onSubmittingChange(false);
        }
        return;
      }

      await persistCheckoutPaymentContext({
        email,
        amount,
        travellers: travelers,
        country: countryCode,
        insurance,
        paymentType,
        applicationId,
        insuranceCount,
        insurancePaymentAmount,
        paymentWithoutInsurance,
        paymentWithDiscount,
      });

      const billingName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      // Create Stripe checkout session for Klarna
      const response = await onCreateCheckoutSession({
        email,
        amount,
        travellers: travelers,
        country: countryCode, // Use the country from form
        insurance: insurance,
        visaTypeId: visaTypeId,
        paymentType: paymentType,
        applicationId: applicationId,
        travelerIndex: travelerIndex,
        currency: currency, // Match currency to country
        uiMode: "hosted",
        paymentMethod: "klarna", // This tells backend to use Klarna
        successUrl: buildCheckoutReturnUrl("/payment-success"),
        cancelUrl: buildCheckoutReturnUrl("/visa-checkout"),
        phone: formData.phone,
        billingName,
        name: billingName,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        // Include form data in metadata
        klarnaFormData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: countryCode, // Ensure country code is used
        },
        noOfInsurance: insuranceCount,
        insurancePaymentAmount: insurancePaymentAmount,
      });

      // Extract the checkout URL from response
      // Handle different response structures from the backend
      let redirectUrl = null;

      if (response?.data?.data?.results?.url) {
        redirectUrl = response.data.data.results.url;
      } else if (response?.data?.results?.url) {
        redirectUrl = response.data.results.url;
      } else if (response?.data?.url) {
        redirectUrl = response.data.url;
      } else if (response?.url) {
        redirectUrl = response.url;
      } else if (response?.data?.data?.url) {
        redirectUrl = response.data.data.url;
      }

      if (redirectUrl) {
        const paymentIntentId =
          response?.data?.data?.results?.paymentIntentId ||
          response?.data?.results?.paymentIntentId ||
          response?.data?.paymentIntentId ||
          null;

        console.log("[Klarna] Checkout URL received, redirecting to Stripe-hosted Klarna page:", redirectUrl);
        console.log("[Klarna] successUrl (return_url) will be /payment-success, paymentType:", paymentType);

        if (paymentIntentId) {
          await persistCheckoutPaymentContext({
            email,
            amount,
            travellers: travelers,
            country: countryCode,
            insurance,
            paymentType,
            applicationId,
            paymentIntentId,
            insuranceCount,
            insurancePaymentAmount,
            paymentWithoutInsurance,
            paymentWithDiscount,
          });
        }

        try {
          sessionStorage.setItem(
            "nuvisa.pendingKlarnaCheckout",
            JSON.stringify({
              startedAt: Date.now(),
              cancelUrl: "/visa-checkout",
              paymentType,
              paymentIntentId,
            })
          );
        } catch {}
        if (onSuccess) {
          onSuccess(klarnaData);
        }
        // Redirect to Stripe-hosted Klarna checkout page
        window.location.assign(redirectUrl);
      } else {
        console.error("No checkout URL in response:", response);
        throw new Error(
          "No checkout URL received from server. Please check backend logs for details."
        );
      }
    } catch (error) {
      console.error("Klarna form submission error:", error);
      setIsSubmitting(false);
      if (onSubmittingChange) {
        onSubmittingChange(false);
      }

      // Extract error message for better user feedback
      let errorMessage = "Failed to create Klarna checkout session.";
      if (error?.response?.data?.data?.results?.error) {
        errorMessage = error.response.data.data.results.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      if (onError) {
        onError(new Error(errorMessage));
      }
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form
      id="klarna-payment-form"
      onSubmit={handleSubmit}
      className="w-full space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <SiKlarna className="text-2xl text-pink-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Complete your Klarna payment
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange("firstName")}
            className={`w-full border ${
              errors.firstName ? "border-red-400" : "border-gray-300"
            } rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
            placeholder="John"
          />
          {errors.firstName && (
            <span className="text-xs text-red-400 mt-1">
              {errors.firstName}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            className={`w-full border ${
              errors.lastName ? "border-red-400" : "border-gray-300"
            } rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <span className="text-xs text-red-400 mt-1">{errors.lastName}</span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium mb-1 text-gray-700"
        >
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={handleChange("phone")}
          className={`w-full border ${
            errors.phone ? "border-red-400" : "border-gray-300"
          } rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
          placeholder="+44 20 1234 5678"
        />
        {errors.phone && (
          <span className="text-xs text-red-400 mt-1">{errors.phone}</span>
        )}
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium mb-1 text-gray-700"
        >
          Address *
        </label>
        <input
          type="text"
          id="address"
          value={formData.address}
          onChange={handleChange("address")}
          className={`w-full border ${
            errors.address ? "border-red-400" : "border-gray-300"
          } rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
          placeholder="123 Main Street"
        />
        {errors.address && (
          <span className="text-xs text-red-400 mt-1">{errors.address}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            City *
          </label>
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={handleChange("city")}
            className={`w-full border ${
              errors.city ? "border-red-400" : "border-gray-300"
            } rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
            placeholder="London"
          />
          {errors.city && (
            <span className="text-xs text-red-400 mt-1">{errors.city}</span>
          )}
        </div>

        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium mb-1 text-gray-700"
          >
            Postal Code *
          </label>
          <input
            type="text"
            id="postalCode"
            value={formData.postalCode}
            onChange={handleChange("postalCode")}
            className={`w-full border ${
              errors.postalCode ? "border-red-400" : "border-gray-300"
            } rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
            placeholder="SW1A 1AA"
          />
          {errors.postalCode && (
            <span className="text-xs text-red-400 mt-1">
              {errors.postalCode}
            </span>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="country"
          className="block text-sm font-medium mb-1 text-gray-700"
        >
          Country *
        </label>
        <select
          id="country"
          value={formData.country}
          onChange={handleChange("country")}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="GB">United Kingdom</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="IT">Italy</option>
          <option value="ES">Spain</option>
          <option value="NL">Netherlands</option>
          <option value="BE">Belgium</option>
          <option value="AT">Austria</option>
          <option value="FI">Finland</option>
          <option value="IE">Ireland</option>
          <option value="PT">Portugal</option>
          <option value="SE">Sweden</option>
          <option value="NO">Norway</option>
          <option value="DK">Denmark</option>
          <option value="PL">Poland</option>
        </select>
      </div>
    </form>
  );
};

export default KlarnaForm;
