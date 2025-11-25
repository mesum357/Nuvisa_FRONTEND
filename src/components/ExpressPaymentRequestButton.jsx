"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { Loader } from "lucide-react";

import { createPaymentIntent } from "@/api/stripePayment";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useAppDispatch } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";

const validateEmail = (value) =>
  !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const ExpressPaymentRequestButton = ({
  amount, // decimal amount in major currency units (e.g. £129.5)
  currency = "GBP",
  email,
  travellers,
  country,
  includeInsurance,
  insuranceCount,
  insurancePaymentAmount,
  visaTypeId,
  paymentType = "application_creation",
  disabled,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [paymentRequest, setPaymentRequest] = useState(null);
  const [buttonError, setButtonError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const normalizedAmount = useMemo(() => {
    if (!amount || Number(amount) <= 0) return null;
    return Math.round(Number(amount) * 100); // Stripe PaymentRequest expects minor units
  }, [amount]);

  useEffect(() => {
    if (!stripe || !elements || !normalizedAmount || !validateEmail(email)) {
      setPaymentRequest(null);
      setIsSupported(false);
      return;
    }

    const request = stripe.paymentRequest({
      country: "GB",
      currency: currency.toLowerCase(),
      total: {
        label: "NUvisa - Visa Application",
        amount: normalizedAmount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: false, // Optional - set to true if you need phone
      // Display items for better breakdown (works for both Apple Pay and Google Pay)
      displayItems: [
        {
          label: `Visa Processing (${travellers || 1} traveller${
            (travellers || 1) > 1 ? "s" : ""
          })`,
          amount: normalizedAmount,
        },
      ],
    });

    let isMounted = true;

    request.canMakePayment().then((result) => {
      if (!isMounted) return;
      if (result) {
        setPaymentRequest(request);
        setIsSupported(true);
      } else {
        setPaymentRequest(null);
        setIsSupported(false);
      }
    });

    return () => {
      isMounted = false;
      if (request && request.off) {
        request.off("paymentmethod");
      }
    };
  }, [stripe, elements, normalizedAmount, currency, email]);

  useEffect(() => {
    if (!paymentRequest) return;

    const handlePaymentMethod = async (event) => {
      setIsSubmitting(true);
      setButtonError(null);

      try {
        const checkoutPayload = {
          email: event.payerEmail || email,
          amount: String(Number(amount).toFixed(2)),
          travellers: String(travellers || 1),
          country: country || "",
          insurance: includeInsurance ? "true" : "false",
          paymentType,
          visaTypeId: visaTypeId || "",
          currency: currency.toUpperCase(),
          noOfInsurance: insuranceCount || 0,
          insurancePaymentAmount: insurancePaymentAmount || 0,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/visa-checkout`,
        };

        const response = await createPaymentIntent(checkoutPayload, () => {});

        if (response?.status !== 200 && response?.status !== 201) {
          throw new Error(
            response?.data?.message || "Unable to initialize payment"
          );
        }

        const data =
          response?.data?.data?.results ||
          response?.data?.results ||
          (response?.data?.status === "success"
            ? response?.data?.data?.results
            : null);

        const clientSecret = data?.clientSecret;

        if (!clientSecret) {
          throw new Error("Missing client secret from payment intent");
        }

        if (data?.token) {
          await localStorageGateway("token", localStorageEnums.SET, data.token);
          await Cookies.set("token", data.token);
          dispatch(setAuthState(true));
        }

        if (data?.user) {
          await Cookies.set("user", JSON.stringify(data.user));
          await localStorageGateway(
            "user",
            localStorageEnums.SET,
            JSON.stringify(data.user)
          );
          if (data.user.id) {
            dispatch(setAuthId(data.user.id));
          }
        }

        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(
            clientSecret,
            {
              payment_method: event.paymentMethod.id,
            },
            { handleActions: false }
          );

        if (confirmError) {
          event.complete("fail");
          throw confirmError;
        }

        let finalIntent = paymentIntent;

        // Handle 3D Secure or other required actions
        if (paymentIntent.status === "requires_action") {
          const { error: actionError, paymentIntent: resolvedIntent } =
            await stripe.confirmCardPayment(clientSecret, {
              payment_method: event.paymentMethod.id,
            });

          if (actionError) {
            event.complete("fail");
            throw actionError;
          }

          finalIntent = resolvedIntent;
        }

        // Only complete with success after payment is fully confirmed
        if (finalIntent.status === "succeeded") {
          event.complete("success");

          const paymentMetadata = {
            paymentIntentId: finalIntent.id,
            email: checkoutPayload.email,
            amount: checkoutPayload.amount,
            travellers: checkoutPayload.travellers,
            country: checkoutPayload.country,
            insurance: checkoutPayload.insurance,
            paymentType: checkoutPayload.paymentType,
            timestamp: Date.now(),
            paymentDate: new Date().toISOString(),
          };

          await localStorageGateway(
            "paymentMetadata",
            localStorageEnums.SET,
            JSON.stringify(paymentMetadata)
          );
          await localStorageGateway(
            "paymentAmount",
            localStorageEnums.SET,
            String(checkoutPayload.amount)
          );
          await localStorageGateway(
            "userEmail",
            localStorageEnums.SET,
            checkoutPayload.email
          );

          // Check if there's an applicationId to redirect to application step
          try {
            const stored = localStorage.getItem("paymentMetadata");
            const pm = stored ? JSON.parse(stored) : null;
            const appId = pm?.applicationId || null;
            if (appId) {
              router.push(
                `/application-step?application_id=${encodeURIComponent(appId)}`
              );
            } else {
              router.push("/payment-success");
            }
          } catch {
            router.push("/payment-success");
          }
        } else {
          event.complete("fail");
          throw new Error(`Payment status: ${finalIntent.status}`);
        }
      } catch (err) {
        console.error("Express payment error:", err);
        event.complete("fail");
        setButtonError(
          err?.message ||
            "Express checkout failed. Please use another payment method."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    paymentRequest.on("paymentmethod", handlePaymentMethod);

    return () => {
      if (paymentRequest && paymentRequest.off) {
        paymentRequest.off("paymentmethod", handlePaymentMethod);
      }
    };
  }, [
    paymentRequest,
    amount,
    currency,
    email,
    travellers,
    country,
    includeInsurance,
    insuranceCount,
    insurancePaymentAmount,
    visaTypeId,
    paymentType,
    stripe,
  ]);

  if (disabled) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-800">
        {disabled}
      </div>
    );
  }

  if (!stripe || !elements) {
    return (
      <div className="p-4 border rounded-lg text-sm text-red-700 bg-red-50 border-red-200">
        Stripe is not initialized. Please refresh and try again.
      </div>
    );
  }

  if (!validateEmail(email || "")) {
    return (
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800">
        Enter a valid email above to unlock Apple Pay / Google Pay.
      </div>
    );
  }

  if (!normalizedAmount) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-800">
        Add at least one traveller to enable express checkout.
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700">
        Apple Pay / Google Pay is not available on this device or browser.
      </div>
    );
  }

  return (
    <div className="w-full">
      {buttonError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {buttonError}
        </div>
      )}

      {isSubmitting && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <Loader className="animate-spin" size={18} />
          Processing express payment...
        </div>
      )}

      {paymentRequest && (
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: {
              paymentRequestButton: {
                type: "default",
                theme: "dark",
                height: "48px",
                borderRadius: "999px",
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default ExpressPaymentRequestButton;
