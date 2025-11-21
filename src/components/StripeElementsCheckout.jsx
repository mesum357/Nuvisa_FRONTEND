"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { createPaymentIntent } from "@/api/stripePayment";
import StripePaymentForm from "./StripePaymentForm";
import Cookies from "js-cookie";
import { Loader } from "lucide-react";

const StripeElementsCheckout = ({
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
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const initializePayment = async () => {
      try {
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
        };

        const response = await createPaymentIntent(payload, () => {});

        if (response?.status === 200 || response?.status === 201) {
          const data = response?.data?.data?.results;
          const clientSecret = data?.clientSecret;

          if (!clientSecret) {
            throw new Error("No client secret received from server");
          }

          setClientSecret(clientSecret);

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
        } else {
          throw new Error(
            response?.data?.message || "Failed to create payment intent"
          );
        }
      } catch (err) {
        console.error("Error initializing payment:", err);
        setError(err.message || "Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };

    if (email && amount) {
      initializePayment();
    }
  }, [email, amount, dispatch]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-600">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Payment Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">{error}</p>
        </div>
      )}

      {clientSecret && (
        <StripePaymentForm
          clientSecret={clientSecret}
          email={email}
          amount={Math.round(Number(amount) * 100)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          isProcessing={processing}
        />
      )}
    </div>
  );
};

export default StripeElementsCheckout;
