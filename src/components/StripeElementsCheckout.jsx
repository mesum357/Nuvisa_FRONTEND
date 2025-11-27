"use client";

import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { createPaymentIntent } from "@/api/stripePayment";
import StripePaymentForm from "./StripePaymentForm";
import Cookies from "js-cookie";
import { Loader } from "lucide-react";

const StripeElementsCheckout = forwardRef(({
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
}, ref) => {
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
      if (isInitializingRef.current || clientSecret) {
        return { success: false, message: "Payment intent already exists or is being created" };
      }

      if (!email || !amount) {
        return { success: false, message: "Email and amount are required" };
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
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/visa-checkout`,
        };

        console.log("Creating payment intent with payload:", payload);
        const response = await createPaymentIntent(payload, () => {});

        console.log("Payment intent response:", {
          status: response?.status,
          hasData: !!response?.data,
          responseStructure: response?.data
        });

        if (response?.status === 200 || response?.status === 201) {
          // Handle different possible response structures
          const data = 
            response?.data?.data?.results || 
            response?.data?.results || 
            (response?.data?.status === "success" ? response?.data?.data?.results : null);
          
          const newClientSecret = data?.clientSecret;

          console.log("Extracted clientSecret:", {
            found: !!newClientSecret,
            prefix: newClientSecret ? `${newClientSecret.substring(0, 30)}...` : "NOT FOUND",
            paymentIntentId: newClientSecret ? newClientSecret.split('_secret_')[0] : null,
          });

          if (!newClientSecret) {
            console.error("No client secret in response. Full response:", response);
            throw new Error("No client secret received from server");
          }

          setClientSecret(newClientSecret);

          // Store auth token if provided
          if (data?.token) {
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
          await localStorageGateway("userEmail", localStorageEnums.SET, email);
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
        } else {
          throw new Error(
            response?.data?.message || "Failed to create payment intent"
          );
        }
      } catch (err) {
        console.error("Error creating payment intent:", err);
        const errorMessage = err.message || "Failed to create payment intent";
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
    }
  }));

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      setProcessing(true);

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
        paymentType === "traveler_insurance" ||
        paymentType === "full_payment" ||
        paymentType === "additional_traveler"
      ) {
        // Insurance payment - redirect to application step
        if (applicationId) {
          router.push(
            `/application-step/?application_id=${encodeURIComponent(
              applicationId
            )}`
          );
        } else {
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
        amount={amount && !isNaN(amount) ? Math.round(Number(amount) * 100) : 0}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        isProcessing={processing || loading}
        hideSubmitButton={hideSubmitButton}
      />
    </div>
  );
});

StripeElementsCheckout.displayName = "StripeElementsCheckout";

export default StripeElementsCheckout;
