"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store";
import StripeProvider from "@/components/StripeProvider";
import StripeElementsCheckout from "@/components/StripeElementsCheckout";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import ClientOnly from "@/components/ClientOnly";
import { trackInitiateCheckout } from "@/utils/analytics";

const StripeElementsCheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visaState = useAppSelector((state) => state.visa);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasTrackedCheckout = useRef(false);

  // Track checkout event when payment data is loaded
  useEffect(() => {
    if (paymentData && !hasTrackedCheckout.current) {
      hasTrackedCheckout.current = true;
      trackInitiateCheckout({
        currency: 'GBP',
        value: paymentData.amount,
        content_name: 'Visa Application',
        content_category: 'Visa',
        num_items: paymentData.travelers,
        email: paymentData.email,
        country: paymentData.country,
      });
    }
  }, [paymentData]);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const email =
          searchParams.get("email") ||
          localStorageGateway("userEmail", localStorageEnums.GET) ||
          "";
        const amount =
          searchParams.get("amount") ||
          localStorageGateway("paymentAmount", localStorageEnums.GET) ||
          "";
        const travelers =
          searchParams.get("travelers") ||
          localStorageGateway("travelers", localStorageEnums.GET) ||
          "1";
        const country =
          searchParams.get("country") || visaState.selectedCountry || "";
        const insurance =
          searchParams.get("insurance") === "true" ||
          localStorageGateway("insuranceSelected", localStorageEnums.GET) ===
            "true";
        const paymentType =
          searchParams.get("paymentType") || "application_creation";
        const applicationId = searchParams.get("applicationId") || "";
        const travelerIndex = searchParams.get("travelerIndex") || "";
        const visaTypeId =
          searchParams.get("visaTypeId") || visaState.visaTypeId || "";
        const noOfInsurance =
          searchParams.get("noOfInsurance") ||
          localStorageGateway("insuranceCount", localStorageEnums.GET) ||
          "0";
        const insurancePaymentAmount =
          searchParams.get("insurancePaymentAmount") ||
          localStorageGateway("insurancePayment", localStorageEnums.GET) ||
          "0";

        if (!email || !amount) {
          router.push("/visa-checkout");
          return;
        }

        setPaymentData({
          email,
          amount: parseFloat(amount),
          travelers: parseInt(travelers),
          country,
          insurance,
          paymentType,
          applicationId,
          travelerIndex,
          visaTypeId,
          noOfInsurance: parseInt(noOfInsurance),
          insurancePaymentAmount: parseFloat(insurancePaymentAmount),
        });
      } catch (err) {
        console.error("Error loading payment data:", err);
        router.push("/visa-checkout");
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, [searchParams, visaState, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7350FF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No payment data found</p>
          <button
            onClick={() => router.push("/visa-checkout")}
            className="bg-[#7350FF] text-white px-6 py-2 rounded-lg hover:bg-[#6247D3]"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-gilroy-bold text-gray-900 mb-2">
              Secure Payment
            </h1>
            <p className="text-gray-600">
              Complete your visa application payment securely
            </p>
          </div>

          <StripeProvider>
            <StripeElementsCheckout
              email={paymentData.email}
              amount={paymentData.amount}
              travelers={paymentData.travelers}
              country={paymentData.country}
              insurance={paymentData.insurance}
              visaTypeId={paymentData.visaTypeId}
              currency="GBP"
              paymentType={paymentData.paymentType}
              applicationId={paymentData.applicationId}
              travelerIndex={paymentData.travelerIndex}
              noOfInsurance={paymentData.noOfInsurance}
              insurancePaymentAmount={paymentData.insurancePaymentAmount}
            />
          </StripeProvider>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Payment Information
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                <span className="font-medium">Email:</span> {paymentData.email}
              </li>
              <li>
                <span className="font-medium">Amount:</span> £
                {paymentData.amount.toFixed(2)}
              </li>
              <li>
                <span className="font-medium">Travelers:</span>{" "}
                {paymentData.travelers}
              </li>
              {paymentData.country && (
                <li>
                  <span className="font-medium">Country:</span>{" "}
                  {paymentData.country}
                </li>
              )}
              {paymentData.insurance && (
                <li>
                  <span className="font-medium">Insurance:</span> Included
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
};

export default StripeElementsCheckoutPage;
