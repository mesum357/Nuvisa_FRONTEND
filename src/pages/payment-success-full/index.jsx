"use client";
import { updateVisaApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { buildGtmUserData, resolveCoupon, computeCouponDiscountPerUnit } from "@/utils/gtmUserData";
import usePaymentData from "@/hooks/usePaymentData";
import { useAppSelector } from "@/store";
import { GIFT_CARD_PRODUCT_NAME } from "@/constants/productLabels";
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

      if (!finalApplicationId) {
        const paymentType = insuranceMetadata?.paymentType || "insurance";
        const fallbackRoute = paymentType.includes("insurance")
          ? `/payment-success?payment_type=${encodeURIComponent(paymentType)}`
          : "/dashboard";

        router.replace(fallbackRoute);
        return;
      }

      const updatePayload = {
        id: finalApplicationId,
        travelersData: insuranceMetadata?.travelData,
      };

      if (finalApplicationId) {
        if (
          typeof window !== "undefined" &&
          window.dataLayer &&
          !hasFiredPurchase.current
        ) {
          hasFiredPurchase.current = true;

          const isInsuranceOnlyAddon =
            insuranceMetadata?.simplePaymentType === "insurance" ||
            insuranceMetadata?.paymentType === "traveler_insurance";

          const travelers = isInsuranceOnlyAddon
            ? 0
            : Math.max(Number(visaState.travelers || 0), 0);

          // ✅ metadata first, Redux fallback, localStorage last resort
          const insuranceCount =
            Number(insuranceMetadata?.insuranceCount) > 0
              ? Number(insuranceMetadata.insuranceCount)
              : Number(visaState.insuranceCount) > 0
              ? Number(visaState.insuranceCount)
              : Number(localStorage.getItem("saved_ga4_insurance_count")) > 0
              ? Number(localStorage.getItem("saved_ga4_insurance_count"))
              : 0;

          const giftCardCount = isInsuranceOnlyAddon
            ? 0
            : Math.max(Number(visaState.giftCardCount || 0), 0);

          const countryName = visaState.selectedCountry || "Schengen";

          const baseCode =
            visaState.appliedDiscount?.code ||
            localStorage.getItem("saved_ga4_coupon") ||
            undefined;
          const hasCoupon = !!baseCode;
          const couponAppliedDiscount = visaState.appliedDiscount || null;

          // effectiveInsCount used only for GROUP20 coupon threshold check
          const effectiveInsCount =
            travelers > 0
              ? Math.min(insuranceCount, travelers)
              : insuranceCount;

          const purchaseItems = [];

          if (travelers > 0) {
            const visaTotal = Number(visaState.visaFees) || 0;
            const vItem = {
              item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
              item_name: `Visa - ${countryName}`,
              item_category: "Schengen Visa",
              item_brand: "NUvisa",
              index: 0,
              price: Number((visaTotal / travelers).toFixed(2)),
              quantity: travelers,
            };
            const vCoupon = resolveCoupon(travelers >= 3, baseCode);
            if (vCoupon) vItem.coupon = vCoupon;
            const vDiscount = hasCoupon
              ? computeCouponDiscountPerUnit(visaTotal, travelers, couponAppliedDiscount)
              : 0;
            if (vDiscount > 0) vItem.discount = vDiscount;
            purchaseItems.push(vItem);
          }

          if (insuranceCount > 0) {
            // ✅ metadata amount first, Redux fee only as fallback
            const insuranceTotal =
              Number(insuranceMetadata?.insurancePaymentAmount) > 0
                ? Number(insuranceMetadata.insurancePaymentAmount)
                : Number(visaState.insuranceFees) || 0;

            const iItem = {
              item_id: "insurance_certificate",
              item_name: "Insurance Certificate",
              item_category: "Insurance",
              item_brand: "NUvisa",
              index: purchaseItems.length,
              price: Number((insuranceTotal / insuranceCount).toFixed(2)),
              quantity: insuranceCount,
            };
            const iCoupon = resolveCoupon(effectiveInsCount >= 3, baseCode);
            if (iCoupon) iItem.coupon = iCoupon;
            const iDiscount = hasCoupon
              ? computeCouponDiscountPerUnit(insuranceTotal, insuranceCount, couponAppliedDiscount)
              : 0;
            if (iDiscount > 0) iItem.discount = iDiscount;
            purchaseItems.push(iItem);
          }

          if (giftCardCount > 0) {
            const giftCardTotal = Number(visaState.giftCardFees) || 0;
            const gItem = {
              item_id: "digital_gift_card",
              item_name: GIFT_CARD_PRODUCT_NAME,
              item_category: "Gift Card",
              item_brand: "NUvisa",
              index: purchaseItems.length,
              price: Number((giftCardTotal / giftCardCount).toFixed(2)),
              quantity: giftCardCount,
            };
            const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
            if (gCoupon) gItem.coupon = gCoupon;
            const gDiscount = computeCouponDiscountPerUnit(giftCardTotal, giftCardCount, couponAppliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null));
            if (gDiscount > 0) gItem.discount = gDiscount;
            purchaseItems.push(gItem);
          }

          window.dataLayer.push({ ecommerce: null });

          const ga4PaymentType =
            sessionStorage.getItem("ga4_payment_type") ||
            (isInsuranceOnlyAddon ? "Credit Card" : "Credit Card - Visa");
          try {
            sessionStorage.removeItem("ga4_payment_type");
          } catch {}

          const transactionValue =
            Number(insuranceMetadata?.insurancePaymentAmount) > 0
              ? Number(insuranceMetadata.insurancePaymentAmount)
              : Number(visaState.totalAmount) > 0
              ? Number(visaState.totalAmount)
              : 0;

          // Build user_data from current-session storage values.
          // For Klarna payments klarnaFormData holds the full billing form.
          // For Stripe/Apple/Google Pay only email and phone are available.
          const klarnaRaw = localStorage.getItem("klarnaFormData");
          const klarnaUser = klarnaRaw
            ? (() => {
                try {
                  return JSON.parse(klarnaRaw);
                } catch {
                  return null;
                }
              })()
            : null;

          const purchaseUserData = buildGtmUserData({
            email:
              klarnaUser?.email ||
              localStorageGateway("userEmail", localStorageEnums.GET) ||
              undefined,
            phone:
              klarnaUser?.phone ||
              localStorageGateway("userPhone", localStorageEnums.GET) ||
              undefined,
            // Address fields are only available for Klarna (billing form).
            firstName: klarnaUser?.firstName || undefined,
            lastName: klarnaUser?.lastName || undefined,
            street: klarnaUser?.address || undefined,
            city: klarnaUser?.city || undefined,
            postalCode: klarnaUser?.postalCode || undefined,
            country: klarnaUser?.country || undefined,
          });

          window.dataLayer.push({
            event: "purchase",
            ...(purchaseUserData && { user_data: purchaseUserData }),
            ecommerce: {
              transaction_id: finalApplicationId || `TXN_${Date.now()}`,
              affiliation: "NUvisa Online",
              value: Number(transactionValue.toFixed(2)),
              tax: 0,
              shipping: 0,
              currency: "GBP",
              payment_type: ga4PaymentType,
              coupon: baseCode,
              items: purchaseItems,
            },
          });
        }

        await updateVisaApplication(token, updatePayload);

        // ✅ Clean up all user-identity tracking keys after purchase fires.
        try {
          localStorageGateway("userPhone", localStorageEnums.DELETE);
          localStorageGateway("userFirstName", localStorageEnums.DELETE);
          localStorageGateway("userLastName", localStorageEnums.DELETE);
          localStorage.removeItem("klarnaFormData");
          sessionStorage.removeItem("klarnaFormDataSet");

          // Remove GA4-specific tracking keys written by StickyBottomBar
          localStorage.removeItem("saved_ga4_insurance_count");
          localStorage.removeItem("saved_ga4_coupon");

          // userEmail is kept so OrderCheckout can pre-fill the contact
          // form on the user's next visit (always visible / editable).
        } catch {}

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
