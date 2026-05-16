"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store";
import { readPaymentReturnQuery } from "@/utils/paymentReturnQuery";
import {
  setSelectedCountry,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import { setAuthId, setAuthState } from "@/store/authSlice";
import usePaymentData from "@/hooks/usePaymentData";
import { createApplication } from "@/api/visa";
import { createOrUpdateApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { decrementExpertSpotsOnSuccessfulCheckout } from "@/utils/expertSpots";
import { redeemGiftCardCode } from "@/api/giftCard";
import {
  isExplicitKlarnaRedirectFailure,
  isStripeRedirectReturn,
  resolveKlarnaRedirectSuccess,
} from "@/utils/stripeRedirectPayment";
import { resolveVisaCountryName } from "@/utils/visaCountry";
import Cookies from "js-cookie";

const PaymentSuccess = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const { getCurrentPaymentData, addPaymentToHistory } = usePaymentData();
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [paymentType, setPaymentType] = useState("application_creation");
  /** verifying_payment | creating_application | redirecting_checkout */
  const [pagePhase, setPagePhase] = useState(() => {
    if (typeof window === "undefined") return "loading";
    const params = new URLSearchParams(window.location.search);
    return params.get("payment_intent") || params.get("redirect_status")
      ? "verifying_payment"
      : "creating_application";
  });
  const hasProcessedPayment = useRef(false);

  const redirectToCheckout = () => {
    setPagePhase("redirecting_checkout");
    if (typeof window !== "undefined") {
      window.location.replace("/visa-checkout");
      return;
    }
    router.replace("/visa-checkout");
  };

  const persistAuthFromResponse = async (response) => {
    const results =
      response?.data?.data?.results ||
      response?.data?.results ||
      response?.data ||
      {};

    const token = results?.token;
    const user = results?.user;

    if (token) {
      await localStorageGateway("token", localStorageEnums.SET, token);
      await Cookies.set("token", token);
      dispatch(setAuthState(true));
    }

    if (user) {
      await Cookies.set("user", JSON.stringify(user));
      await localStorageGateway(
        "user",
        localStorageEnums.SET,
        JSON.stringify(user)
      );
      if (user.id) {
        dispatch(setAuthId(user.id));
      }
    }
  };
  useEffect(() => {
    if (!router.isReady) {
      console.log("[PaymentSuccess] waiting for router.isReady");
      return;
    }

    const storePaymentDataAndRedirect = async () => {
      if (hasProcessedPayment.current) {
        return;
      }

      const returnQuery = readPaymentReturnQuery(router);
      const {
        sessionId,
        redirectStatus,
        paymentIntentId: paymentIntentParam,
        paymentIntentClientSecret,
        paymentType: paymentTypeFromUrl,
        applicationId: applicationIdFromUrl,
        travelerIndex: travelerIndexFromUrl,
      } = returnQuery;

      const isKlarnaRedirect = isStripeRedirectReturn({
        redirectStatus,
        paymentIntentId: paymentIntentParam,
      });

      console.log("[PaymentSuccess] URL params:", {
        asPath: router.asPath,
        sessionId,
        redirectStatus,
        paymentIntentParam,
        isKlarnaRedirect,
      });

      if (
        isKlarnaRedirect &&
        !paymentIntentParam &&
        !redirectStatus &&
        !paymentIntentClientSecret
      ) {
        console.log("[PaymentSuccess] Klarna return but query not ready yet");
        return;
      }

      if (isKlarnaRedirect) {
        setPagePhase("verifying_payment");
      }

      if (isKlarnaRedirect && isExplicitKlarnaRedirectFailure(redirectStatus)) {
        hasProcessedPayment.current = true;
        try {
          sessionStorage.removeItem("nuvisa.pendingKlarnaCheckout");
          sessionStorage.removeItem("nuvisa.klarnaPaymentSucceeded");
        } catch {}
        console.log(
          "[PaymentSuccess] Klarna payment not completed (redirect_status) — checkout"
        );
        redirectToCheckout();
        return;
      }

      hasProcessedPayment.current = true;

      try {
        const currentData = await getCurrentPaymentData();

        if (isKlarnaRedirect) {
          const klarnaOutcome = await resolveKlarnaRedirectSuccess({
            redirectStatus,
            paymentIntentId: paymentIntentParam,
            paymentIntentClientSecret,
            maxPollAttempts: 5,
            pollIntervalMs: 800,
          });

          console.log("[PaymentSuccess] Klarna redirect outcome:", klarnaOutcome);

          if (!klarnaOutcome.succeeded) {
            try {
              sessionStorage.removeItem("nuvisa.pendingKlarnaCheckout");
              sessionStorage.removeItem("nuvisa.klarnaPaymentSucceeded");
            } catch {}
            console.error(
              "[PaymentSuccess] Klarna verification failed — redirecting to /visa-checkout",
              klarnaOutcome
            );
            redirectToCheckout();
            return;
          }

          try {
            sessionStorage.removeItem("nuvisa.pendingKlarnaCheckout");
            sessionStorage.setItem("nuvisa.klarnaPaymentSucceeded", "1");
          } catch {}
          console.log("[PaymentSuccess] Klarna succeeded — continuing application flow");
        }
   
        if (
          !sessionId &&
          !isKlarnaRedirect &&
          (!currentData || (!currentData.totalAmount && !currentData.applicationId))
        ) {
          setTimeout(() => router.replace("/dashboard"), 800);
          return;
        }
   
        const klarnaPaymentIntentId = paymentIntentParam || null;
   
        let paymentTypeParam = paymentTypeFromUrl || null;
        let applicationId = applicationIdFromUrl || null;
        let travelerIndex = travelerIndexFromUrl || null;
   
        let usedStoredInsuranceMetadata = null;
        if (!paymentTypeParam || !applicationId) {
          try {
            const storedMetadata = localStorage.getItem("insurancePaymentMetadata");
            if (storedMetadata) {
              const metadata = JSON.parse(storedMetadata);
              if (Date.now() - metadata.timestamp < 5 * 60 * 1000) {
                paymentTypeParam = paymentTypeParam || metadata.paymentType;
                applicationId = applicationId || metadata.applicationId;
                travelerIndex = travelerIndex || metadata.travelerIndex;
                usedStoredInsuranceMetadata = metadata;
                localStorage.removeItem("insurancePaymentMetadata");
              }
            }
          } catch (error) {
            console.error("Error retrieving stored payment metadata:", error);
          }
        }
   
        if (!paymentTypeParam) {
          try {
            if (currentData.paymentMetadata) {
              const metadata = currentData.paymentMetadata;
              if (Date.now() - (metadata.timestamp || 0) < 5 * 60 * 1000) {
                paymentTypeParam = metadata.paymentType;
              }
            }
          } catch (error) {
            console.error("Error retrieving paymentMetadata:", error);
          }
        }
   
        const SKIP_APPLICATION_TYPES = [
          "traveler_insurance",
          "additional_traveler_insurance",
          "full_payment",
          "additional_traveler",
          "gift_card",
        ];
   
        const finalPaymentType = paymentTypeParam || currentData.paymentType || "application_creation";
        const finalApplicationId = applicationId;
   
        setPaymentType(finalPaymentType);
   
        if (finalPaymentType === "gift_card") {
          setPaymentType("gift_card");
          return;
        }

        const insuranceOnlyTypes = [
          "traveler_insurance",
          "additional_traveler_insurance",
        ];

        if (insuranceOnlyTypes.includes(finalPaymentType)) {
          const embeddedPaymentIntentIdEarly =
            typeof window !== "undefined"
              ? sessionStorage.getItem("stripePaymentIntentId") || null
              : null;
          const stripePaymentIdEarly =
            sessionId ||
            klarnaPaymentIntentId ||
            embeddedPaymentIntentIdEarly ||
            null;

          if (stripePaymentIdEarly) {
            decrementExpertSpotsOnSuccessfulCheckout(stripePaymentIdEarly);
          }

          if (finalApplicationId && process.env.NEXT_PUBLIC_API_URL) {
            try {
              const postAmountRaw =
                (usedStoredInsuranceMetadata &&
                  usedStoredInsuranceMetadata.paymentAmount) ||
                currentData.totalAmount ||
                "0";
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentType: finalPaymentType,
                    applicationId: finalApplicationId,
                    travelerIndex: travelerIndex,
                    email: currentData.email,
                    amount: postAmountRaw,
                    orderId: usedStoredInsuranceMetadata?.orderId,
                    sessionId: stripePaymentIdEarly,
                  }),
                }
              );
            } catch (error) {
              console.error("Insurance payment update failed:", error);
            }
          }

          setIsCreatingApplication(false);
          return;
        }
   
        if (
          finalPaymentType === "full_payment" ||
          finalPaymentType === "additional_traveler"
        ) {
          try {
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentType: finalPaymentType,
                  applicationId: finalApplicationId,
                  travelerIndex: travelerIndex,
                  email: currentData.email,
                  amount: currentData.totalAmount,
                  sessionId: sessionId,
                }),
              }
            );
          } catch (error) {
            console.error("Error updating payment status:", error);
          }
   
          if (finalApplicationId) {
            router.replace(`/application-step/?application_id=${finalApplicationId}`);
          }
          return;
        }
   
        const embeddedPaymentIntentId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("stripePaymentIntentId") || null
            : null;
   
        const stripePaymentId = sessionId || klarnaPaymentIntentId || embeddedPaymentIntentId || null;
        const dedupePaymentId = stripePaymentId || currentData?.paymentMetadata?.paymentIntentId || null;
   
        if (embeddedPaymentIntentId && typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("stripePaymentIntentId");
          } catch {}
        }
   
        if (dedupePaymentId) {
          decrementExpertSpotsOnSuccessfulCheckout(dedupePaymentId);
        }
   
        let sessionMetadata = {};
        if (stripePaymentId && process.env.NEXT_PUBLIC_API_URL) {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/session-metadata?payment_id=${encodeURIComponent(stripePaymentId)}`
            );
            const json = await res.json();
            const meta = json?.data?.results?.metadata || json?.results?.metadata || {};
            if (meta && typeof meta === "object" && Object.keys(meta).length > 0) {
              sessionMetadata = meta;
            }
          } catch (e) {
            console.warn("Could not fetch session metadata:", e);
          }
        }
   
        const resolvedCountry = resolveVisaCountryName(
          sessionMetadata.country ||
            currentData.selectedCountry ||
            currentData.paymentMetadata?.country
        );

        const mergedData = {
          ...currentData,
          email: sessionMetadata.email || currentData.email,
          selectedCountry: resolvedCountry,
          travelers: sessionMetadata.travellers ?? currentData.travelers,
          totalAmount: sessionMetadata.amount || currentData.totalAmount,
          insurancePayment:
            sessionMetadata.insurance !== undefined
              ? sessionMetadata.insurance
              : currentData.insurancePayment,
          paymentWithoutInsurance: currentData.paymentWithoutInsurance,
          visaTypeId: sessionMetadata.visaTypeId || currentData.selectedVisaType || visaState.visaTypeId,
          amountWithDiscount: currentData.amountWithDiscount,
          storedMetadata: currentData.storedMetadata,
          paymentMetadata: currentData.paymentMetadata,
        };
   
        const paymentInfo = {
          sessionId,
          email: mergedData.email,
          selectedCountry: mergedData.selectedCountry,
          insurancePayment: mergedData.insurancePayment,
          travelers: mergedData.travelers,
          totalAmount: mergedData.totalAmount,
          paymentDate: new Date().toISOString(),
        };
   
        await addPaymentToHistory(paymentInfo);
   
        if (mergedData.selectedCountry) {
          dispatch(setSelectedCountry(mergedData.selectedCountry));
        }
        if (Number.isFinite(Number(mergedData.insurancePayment))) {
          dispatch(setInsuranceFees(Number(mergedData.insurancePayment)));
        }
        if (Number.isFinite(Number(mergedData.travelers))) {
          dispatch(setTravelers(Number(mergedData.travelers)));
        }
   
        setPagePhase("creating_application");
        setIsCreatingApplication(true);
   
        const numberOfTravelers = Number(mergedData.travelers) || 1;
   
        const hasInsurance =
          mergedData.insuranceSelected === "true" ||
          (mergedData.insuranceSelected === undefined && Number(mergedData.insurancePayment) > 0)
            ? true
            : false;
   
        const isCheckoutPayment =
          finalPaymentType === "application_creation" || (!finalPaymentType && !applicationId);
   
        const insurancePayload =
          numberOfTravelers === mergedData?.storedMetadata?.insuranceCount
            ? {
                insurance: hasInsurance,
                insuranceDetails: hasInsurance ? { selected: true } : null,
                insuranceCertificate: null,
                orderId: null,
                paymentAmount: hasInsurance ? Number(mergedData.insurancePayment) || 0 : 0,
                paidInCheckout: hasInsurance && isCheckoutPayment,
                insuranceSource: hasInsurance && isCheckoutPayment ? "checkout" : null,
                insurancePaymentCompleted: hasInsurance,
              }
            : {};
   
        const initialTravelersData = Array.from({ length: numberOfTravelers }, (_, index) => ({
          id: `traveler_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          basicDetails: {
            passportNumber: "",
            firstName: "",
            lastName: "",
            sex: "",
            dateOfBirth: "",
            placeOfBirth: "",
            passportIssuePlace: "",
            passportIssueDate: "",
            passportExpiryDate: "",
            currentAddress1: "",
            currentAddress2: "",
            state: "",
            city: "",
            pincode: "",
            passportFront: null,
            passportBack: null,
          },
          visitDetails: {
            visitingOtherSchengenCountries: [],
            firstCountryOfEntry: "",
            hasSchengenVisa: "",
            lastVisaStartDate: "",
            lastVisaEndDate: "",
            hasDigitalFingerprints: "",
            previousVisaNumber: "",
            maritalStatus: "",
            partnerFullName: "",
            partnerDateOfBirth: "",
            employmentStatus: "",
            institutionName: "",
            instituteEmail: "",
            instituteAddress: "",
            employerPhone: "",
            employerName: "",
            employerEmail: "",
            employerAddress: "",
            otherEmploymentStatus: "",
            willAnyonePayForVisit: "",
            fundingPersonName: "",
            tripFundedBy: "",
          },
          documents: { documents: {} },
          insurance: insurancePayload,
          fullPayment: {
            paymentStatus: "completed",
            paymentCompleted: true,
            paymentAmount:
              Number(
                (Number(mergedData?.amountWithDiscount || 149) / numberOfTravelers).toFixed(2)
              ) || 0,
            paymentDate: new Date().toISOString(),
            paymentMethod: "stripe",
            includeInsurance: hasInsurance,
            insuranceType: hasInsurance ? "purchase" : "none",
            paidInCheckout: isCheckoutPayment,
          },
        }));
   
        const applicationPayload = {
          type: "createApplication",
          email: mergedData.email,
          insuranceDetails:
            numberOfTravelers === mergedData?.storedMetadata?.insuranceCount
              ? null
              : {
                  paidInCheckout: {
                    noOfInsurance: mergedData?.storedMetadata?.insuranceCount || 0,
                    paymentAmount: mergedData?.storedMetadata?.insurancePaymentAmount || 0,
                  },
                  certificateCount: 0,
                  certificate: [],
                },
          country: mergedData.selectedCountry,
          amountPaid: mergedData.totalAmount?.toString(),
          paymentWithoutInsurance: Number(mergedData?.paymentWithoutInsurance),
          numberOfTravellers: numberOfTravelers,
          travelersData: initialTravelersData,
          visaTypeId: mergedData.visaTypeId || "66755c9f11e8e79f4c31d9e4",
          selectedVisaType: mergedData.visaTypeId || "66755c9f11e8e79f4c31d9e4",
          arrivalDate: visaState.arrivalDate,
          departureDate: visaState.departureDate,
          travelStartDate: visaState.arrivalDate || "",
          travelEndDate: visaState.departureDate || "",
          insurancePaymentCompleted: hasInsurance,
          initialInsurancePaidTotal: hasInsurance
            ? (Number(mergedData.insurancePayment) || 0).toString()
            : "0",
          stripePaymentId: stripePaymentId || undefined,
        };
   
        if (
          (finalPaymentType === "additional_traveler_insurance" ||
            finalPaymentType === "traveler_insurance") &&
          finalApplicationId
        ) {
          try {
            const postAmountRaw =
              (usedStoredInsuranceMetadata && usedStoredInsuranceMetadata.paymentAmount) ||
              (Number.isFinite(Number(currentData.totalAmount)) ? currentData.totalAmount : "490");
            const postOrderId =
              (usedStoredInsuranceMetadata && usedStoredInsuranceMetadata.orderId) || undefined;
            const postAmount = Number(postAmountRaw);
   
            if (travelerIndex !== null && travelerIndex !== undefined && travelerIndex !== "") {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentType: finalPaymentType,
                    travelerIndex: travelerIndex,
                    applicationId: finalApplicationId,
                    email: currentData.email,
                    amount: postAmount,
                    orderId: postOrderId,
                  }),
                }
              );
   
              await createOrUpdateApplication("", {
                ...applicationPayload,
                insurance: true,
                travelersData: initialTravelersData.map((traveler, index) =>
                  index === Number(travelerIndex)
                    ? {
                        ...traveler,
                        insurance: {
                          orderId: postOrderId || null,
                          paymentAmount: postAmount,
                          insurancePaymentCompleted: true,
                        },
                      }
                    : traveler
                ),
                insurancePaymentCompleted: true,
              });
            } else {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentType: finalPaymentType,
                    applicationId: finalApplicationId,
                    email: currentData.email,
                    amount: postAmount,
                    orderId: postOrderId,
                  }),
                }
              );
   
              await createOrUpdateApplication("", {
                ...applicationPayload,
                insurance: true,
                insurancePaymentCompleted: true,
                amountPaid: postAmount,
                orderId: postOrderId || undefined,
              });
            }
          } catch (error) {
            console.error("Error updating traveler/application insurance:", error);
          }
   
          setTimeout(() => {
            router.replace(`/application-step/?application_id=${finalApplicationId}`);
          }, 2000);
          return;
        }
   
        if (SKIP_APPLICATION_TYPES.includes(finalPaymentType) && finalPaymentType !== "application_creation") {
          return;
        }

        const pendingGiftCards = (visaState.redeemedGiftCards || []).filter(
          (card) => card.pendingRedeem
        );
        if (pendingGiftCards.length > 0 && mergedData.email) {
          for (const card of pendingGiftCards) {
            try {
              await redeemGiftCardCode(card.code, mergedData.email);
            } catch (redeemErr) {
              console.error("Gift card redeem after payment failed:", redeemErr);
            }
          }
        }
   
        const applicationResponse = await createApplication(applicationPayload);
        await persistAuthFromResponse(applicationResponse);
   
        if (applicationResponse?.status === 200 || applicationResponse?.status === 201) {
          if (typeof window !== "undefined" && window.dataLayer) {
            const purchaseItems = [];
   
            if (numberOfTravelers > 0) {
              purchaseItems.push({
                item_id: "schengen_visa",
                item_name: "Schengen visa from the UK",
                price: Number(mergedData.paymentWithoutInsurance || 0) / numberOfTravelers,
                quantity: numberOfTravelers,
              });
            }
   
            if (hasInsurance && Number(mergedData.insurancePayment) > 0) {
              const insCount = mergedData?.storedMetadata?.insuranceCount || numberOfTravelers;
              purchaseItems.push({
                item_id: "insurance_certificate",
                item_name: "Insurance Certificate",
                price: Number(mergedData.insurancePayment) / insCount,
                quantity: insCount,
              });
            }
   
            const giftCardCount = Math.max(Number(visaState.giftCardCount || 0), 0);
            if (giftCardCount > 0) {
              purchaseItems.push({
                item_id: "digital_gift_card",
                item_name: "NUvisa Digital Gift Card",
                price: (Number(visaState.giftCardFees) || 0) / giftCardCount,
                quantity: giftCardCount,
              });
            }
   
            window.dataLayer.push({ ecommerce: null });
            window.dataLayer.push({
              event: "purchase",
              ecommerce: {
                transaction_id:
                  stripePaymentId ||
                  applicationResponse?.data?.data?.results?.application?.id ||
                  `TXN_${Date.now()}`,
                value: Number(mergedData.totalAmount || 0),
                currency: "GBP",
                coupon:
                  mergedData.storedMetadata?.couponCode ||
                  visaState.appliedDiscount?.code ||
                  undefined,
                items: purchaseItems,
              },
            });
          }
   
          setTimeout(() => {
            try {
              sessionStorage.setItem("nuvisa.klarnaPaymentSucceeded", "1");
            } catch {}
            router.replace(
              "/application-step/?application_id=" +
                applicationResponse?.data?.data?.results?.application?.id
            );
          }, 2000);
        } else {
          throw new Error("Failed to create visa application");
        }
      } catch (error) {
        console.error("Error storing payment data or creating application:", error);
        setTimeout(() => {
          router.replace("/application-step");
        }, 2000);
      } finally {
        setIsCreatingApplication(false);
      }
    };
   
    storePaymentDataAndRedirect();
  }, [router.isReady, router.asPath]);

  if (
    paymentType === "traveler_insurance" ||
    paymentType === "additional_traveler_insurance"
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Insurance purchase successful!
          </h1>
          <p className="text-gray-600 mb-4">
            Your insurance payment was successful. We have updated your application
            and sent a confirmation email. No new visa application was created.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-[#7350FF] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#7350FF]/90 transition-colors"
          >
            Go to my applications
          </button>
        </div>
      </div>
    );
  }

  // Show gift card purchase confirmation
  if (paymentType === "gift_card") {
    const userEmail =
      typeof window !== "undefined"
        ? localStorageGateway("userEmail", localStorageEnums.GET) || ""
        : "";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gift Card Purchase Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              Your gift card purchase was successful!
            </p>
            {userEmail && (
              <p className="text-gray-700 mb-2">
                A confirmation email with your redemption code has been sent to{" "}
                <span className="font-semibold">{userEmail}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Please check your email for the code. The code format is:{" "}
              <span className="font-mono font-semibold">NU-VISA-XXXXXX</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/visa-checkout")}
            className="w-full bg-[#7350FF] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#7350FF]/90 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7350FF] mx-auto mb-4"></div>
        <p className="text-gray-600">
          {pagePhase === "creating_application"
            ? "Creating your visa application.."
            : pagePhase === "redirecting_checkout"
              ? "Returning to checkout..."
              : "Confirming your payment..."}
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
