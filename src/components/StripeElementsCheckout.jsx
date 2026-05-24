"use client";

import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { createPaymentIntent } from "@/api/stripePayment";
import { extractPaymentApiError } from "@/utils/extractPaymentApiError";
import { parsePaymentIntentApiResponse } from "@/utils/parsePaymentIntentApiResponse";
import StripePaymentForm from "./StripePaymentForm";
import Cookies from "js-cookie";
import { Loader } from "lucide-react";

const isValidAuthToken = (token) =>
  token && token !== "existing_session_reused";
const StripeElementsCheckout = forwardRef(
  (
    {
      email,
      amount,
      travelers,
      country,
      insurance,
      visaTypeId,
      currency = "GBP",
      paymentType = "application_creation",
      applicationId,
      travelerIndex,
      noOfInsurance,
      insurancePaymentAmount,
      hideSubmitButton = false,
      includeGiftCard,
      giftCardCount,
    },
    ref
  ) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [clientSecret, setClientSecret] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const isInitializingRef = useRef(false);
    const paymentFormRef = useRef(null);

    // Expose method to create PaymentIntent on demand
    useImperativeHandle(ref, () => ({
      createPaymentIntent: async () => {
        // Clear any existing clientSecret to ensure we create a fresh payment intent
        if (clientSecret) {
          console.log(
            "Clearing existing clientSecret to create a new payment intent"
          );
          setClientSecret(null);
        }

        if (isInitializingRef.current) {
          return {
            success: false,
            message: "Payment intent is already being created",
          };
        }

        const amountNumber = Number(amount);
        if (!email?.trim()) {
          return { success: false, message: "Email is required" };
        }
        if (!Number.isFinite(amountNumber) || amountNumber < 0.5) {
          return {
            success: false,
            message: "Payment total must be at least £0.50",
          };
        }

        try {
          isInitializingRef.current = true;
          setLoading(true);
          setError(null);

          const payload = {
            email,
            amount: String(amount),
            travellers: String(travelers),
            country: country || "",
            insurance: insurance ? "true" : "false",
            paymentType: paymentType,
            visaTypeId: visaTypeId || "",
            currency: currency,
            applicationId: applicationId || undefined,
            travelerIndex: travelerIndex || undefined,
            noOfInsurance: noOfInsurance || 0,
            insurancePaymentAmount: insurancePaymentAmount || 0,
            successUrl: "/payment-success",
            cancelUrl: applicationId
              ? `/application-step/?application_id=${encodeURIComponent(
                  applicationId
                )}`
              : "/visa-checkout",
            // Include gift card quantity when paymentType includes "gift_card"
            ...(paymentType &&
            paymentType.includes("gift_card") &&
            includeGiftCard &&
            giftCardCount > 0
              ? {
                  quantity: String(giftCardCount),
                  noOfGiftCards: String(giftCardCount),
                }
              : {}),
          };

          console.log("Creating payment intent with payload:", payload);
          const response = await createPaymentIntent(payload, () => {});

          const parsed = parsePaymentIntentApiResponse(response);

          if (parsed.ok) {
            const data = parsed.data;
            const newClientSecret = parsed.clientSecret;

            console.log("Payment intent created:", {
              paymentIntentId: newClientSecret.split("_secret_")[0],
            });

            if (!newClientSecret.includes("_secret_")) {
              throw new Error(
                "Invalid client secret format received from server"
              );
            }

            setClientSecret(newClientSecret);

            // Store auth token if provided
            if (isValidAuthToken(data?.token)) {
              await localStorageGateway(
                "token",
                localStorageEnums.SET,
                data.token
              );
              await Cookies.set("token", data.token);
              dispatch(setAuthState(true));
            }

            // Store user if provided
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

            // Store payment metadata
            await localStorageGateway(
              "userEmail",
              localStorageEnums.SET,
              email
            );
            await localStorageGateway(
              "paymentAmount",
              localStorageEnums.SET,
              String(amount)
            );

            // Trigger form submission after state update completes
            // Use requestAnimationFrame to ensure React has re-rendered
            requestAnimationFrame(() => {
              setTimeout(() => {
                if (paymentFormRef.current?.submitForm) {
                  paymentFormRef.current.submitForm();
                }
              }, 50);
            });

            return { success: true, clientSecret: newClientSecret };
          }

          throw new Error(
            parsed.error || "Failed to create payment intent. Please try again."
          );
        } catch (err) {
          console.error("Error creating payment intent:", err);
          const errorMessage =
            extractPaymentApiError(err?.response, err) ||
            err?.message ||
            "Failed to create payment intent";
          setError(errorMessage);
          return { success: false, message: errorMessage };
        } finally {
          setLoading(false);
          isInitializingRef.current = false;
        }
      },
      submitForm: () => {
        if (paymentFormRef.current?.submitForm) {
          paymentFormRef.current.submitForm();
        }
      },
    }));

    const handlePaymentSuccess = async (paymentIntent) => {
      try {
        setProcessing(true);

        // Store the payment intent ID so payment-success can use it as the stripePaymentId
        // idempotency key when creating the application (prevents double creation with webhook)
        if (paymentIntent?.id && typeof window !== "undefined") {
          try {
            sessionStorage.setItem("stripePaymentIntentId", paymentIntent.id);
          } catch {}
        }

        // Store payment metadata
        const paymentMetadata = {
          paymentIntentId: paymentIntent.id,
          email: email,
          amount: amount,
          travelers: travelers,
          country: country,
          insurance: insurance,
          paymentType: paymentType,
          applicationId: applicationId,
          travelerIndex: travelerIndex,
          timestamp: Date.now(),
          paymentDate: new Date().toISOString(),
        };

        await localStorageGateway(
          "paymentMetadata",
          localStorageEnums.SET,
          JSON.stringify(paymentMetadata)
        );

        // Redirect based on payment type
        if (
          paymentType === "additional_traveler_insurance" ||
          paymentType === "traveler_insurance"
        ) {
          if (applicationId) {
            router.push(
              `/application-step/?application_id=${encodeURIComponent(
                applicationId
              )}`
            );
          } else {
            router.push(
              `/payment-success?payment_type=${encodeURIComponent(paymentType)}`
            );
          }
        } else if (
          paymentType === "full_payment" ||
          paymentType === "additional_traveler"
        ) {
          // Payment tied to an existing application should return to the application flow
          if (applicationId) {
            router.push(
              `/application-step/?application_id=${encodeURIComponent(
                applicationId
              )}`
            );
          } else {
            // Fallback for application creation flows that still need to resolve after payment
            router.push("/payment-success-full");
          }
        } else {
          // Application creation payment - redirect to payment success
          router.push("/payment-success");
        }
      } catch (err) {
        console.error("Error handling payment success:", err);
        setError("Payment succeeded but there was an error processing it");
      } finally {
        setProcessing(false);
      }
    };

    const handlePaymentError = (err) => {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed");
    };

    return (
      <div className="w-full">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <Loader className="animate-spin mx-auto mb-2" size={24} />
              <p className="text-gray-600 text-sm">Creating payment...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        )}

        {/* Render form immediately - it will work without clientSecret until payment */}
        <StripePaymentForm
          ref={paymentFormRef}
          clientSecret={clientSecret}
          email={email}
          amount={
            amount && !isNaN(amount) ? Math.round(Number(amount) * 100) : 0
          }
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          isProcessing={processing || loading}
          hideSubmitButton={hideSubmitButton}
        />
      </div>
    );
  }
);

StripeElementsCheckout.displayName = "StripeElementsCheckout";

export default StripeElementsCheckout;
