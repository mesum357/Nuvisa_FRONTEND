"use client";
import { updateVisaApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import usePaymentData from "@/hooks/usePaymentData";
import { useAppSelector } from "@/store";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

const ApplicationStepPaymentSuccessPage = () => {
  const { getCurrentPaymentData } = usePaymentData();
  const router = useRouter();
  const visaState = useAppSelector((state) => state.visa);

  const hasFiredPurchase = useRef(false);

  const applicationId = router.query.application_id;
  const insurancePaymentMetadata = localStorageGateway(
    "insurancePaymentMetadata",
    localStorageEnums.GET
  );

  const token = localStorageGateway("token", localStorageEnums.GET);
  const insuranceMetadata = insurancePaymentMetadata
    ? JSON.parse(insurancePaymentMetadata)
    : null;
  useEffect(() => {
    const processPaymentSuccess = async () => {
      const currentData = await getCurrentPaymentData();
      const finalApplicationId = applicationId || currentData.applicationId;

      const updatePayload = {
        id: finalApplicationId,
        travelersData: insuranceMetadata?.travelData,
      };

      if (finalApplicationId) {
        // 🔥 GTM: FIRE PURCHASE EVENT HERE 🔥
        if (
          typeof window !== "undefined" &&
          window.dataLayer &&
          !hasFiredPurchase.current
        ) {
          hasFiredPurchase.current = true; // Lock it so it only fires once

          const travelers = Math.max(Number(visaState.travelers || 0), 0);
          const insuranceCount = Math.max(
            Number(visaState.insuranceCount || 0),
            0
          );
          const giftCardCount = Math.max(
            Number(visaState.giftCardCount || 0),
            0
          );
          const countryName = visaState.selectedCountry || "Schengen";

          const purchaseItems = [];
          if (travelers > 0)
            purchaseItems.push({
              item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
              item_name: `Visa - ${countryName}`,
              price: Number(
                ((Number(visaState.visaFees) || 0) / travelers).toFixed(2)
              ),
              quantity: travelers,
            });
          if (insuranceCount > 0)
            purchaseItems.push({
              item_id: "insurance_certificate",
              item_name: "Insurance Certificate",
              price: Number(
                (
                  (Number(visaState.insuranceFees) || 0) / insuranceCount
                ).toFixed(2)
              ),
              quantity: insuranceCount,
            });
          if (giftCardCount > 0)
            purchaseItems.push({
              item_id: "digital_gift_card",
              item_name: "NUvisa Digital Gift Card",
              price: Number(
                ((Number(visaState.giftCardFees) || 0) / giftCardCount).toFixed(
                  2
                )
              ),
              quantity: giftCardCount,
            });

          window.dataLayer.push({ ecommerce: null }); // Clear previous data
          window.dataLayer.push({
            event: "purchase",
            ecommerce: {
              transaction_id: finalApplicationId || `TXN-${Date.now()}`,
              value: Number((Number(visaState.totalAmount) || 0).toFixed(2)),
              currency: "GBP",
              payment_type:
                typeof window !== "undefined"
                  ? localStorage.getItem("ga4_payment_type") || "Credit Card"
                  : "Credit Card",
              coupon:
                visaState.appliedDiscount?.code ||
                visaState.couponCode ||
                undefined,
              items: purchaseItems,
            },
          });
        }

        await updateVisaApplication(token, updatePayload);

        setTimeout(() => {
          router.replace(
            `/application-step/?application_id=${finalApplicationId}&step=${insuranceMetadata?.paymentType}`
          );
        }, 2000);
      }
    };
    if (applicationId) {
      processPaymentSuccess();
    }
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7350FF] mx-auto mb-4"></div>
        <p className="text-gray-600">
          Processing{" "}
          {insuranceMetadata?.simplePaymentType === "insurance"
            ? "insurance"
            : ""}{" "}
          payment and redirecting back to your application...
        </p>
      </div>
    </div>
  );
};

export default ApplicationStepPaymentSuccessPage;
