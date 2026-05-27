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
import { buildGtmUserData, normalizePhoneE164, resolveCoupon, computeCouponDiscountPerUnit } from "@/utils/gtmUserData";
import {
  decrementExpertSpotsOnSuccessfulCheckout,
  decrementExpertSpotsViaApi,
} from "@/utils/expertSpots";
import { fulfillGiftCardPurchase, redeemGiftCardCode } from "@/api/giftCard";
import { buildGiftCardValidationContext } from "@/utils/giftCardEligibility";
import {
  isExplicitKlarnaRedirectFailure,
  isStripeRedirectReturn,
  resolveKlarnaRedirectSuccess,
} from "@/utils/stripeRedirectPayment";
import { resolveVisaCountryName } from "@/utils/visaCountry";
import { getPublicApiBase } from "@/utils/adminApiBase";
import { GIFT_CARD_PRODUCT_NAME } from "@/constants/productLabels";
import Cookies from "js-cookie";

const isValidAuthToken = (token) =>
  token && token !== "existing_session_reused";

const PaymentSuccess = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const { getCurrentPaymentData, addPaymentToHistory } = usePaymentData();
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [paymentType, setPaymentType] = useState("application_creation");
  const [giftCardCodes, setGiftCardCodes] = useState([]);
  const [giftCardEmailSent, setGiftCardEmailSent] = useState(true);
  const [giftCardFulfillFailed, setGiftCardFulfillFailed] = useState(false);
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

  const redirectToHome = () => {
    router.replace("/");
  };

  const persistAuthFromResponse = async (response) => {
    const results =
      response?.data?.data?.results ||
      response?.data?.results ||
      response?.data ||
      {};

    const token = results?.token;
    const user = results?.user;

    if (isValidAuthToken(token)) {
      await localStorageGateway("token", localStorageEnums.SET, token);
      await Cookies.set("token", token);
      dispatch(setAuthState(true));
    }

    if (user) {
      await Cookies.set("user", JSON.stringify(user));
      await localStorageGateway(
        "user",
        localStorageEnums.SET,
        JSON.stringify(user),
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
          "[PaymentSuccess] Klarna payment not completed (redirect_status) — checkout",
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

          console.log(
            "[PaymentSuccess] Klarna redirect outcome:",
            klarnaOutcome,
          );

          if (!klarnaOutcome.succeeded) {
            try {
              sessionStorage.removeItem("nuvisa.pendingKlarnaCheckout");
              sessionStorage.removeItem("nuvisa.klarnaPaymentSucceeded");
            } catch {}
            console.error(
              "[PaymentSuccess] Klarna verification failed — redirecting to /visa-checkout",
              klarnaOutcome,
            );
            redirectToCheckout();
            return;
          }

          try {
            sessionStorage.removeItem("nuvisa.pendingKlarnaCheckout");
            sessionStorage.setItem("nuvisa.klarnaPaymentSucceeded", "1");
          } catch {}
          console.log(
            "[PaymentSuccess] Klarna succeeded — continuing application flow",
          );
        }

        if (
          !sessionId &&
          !isKlarnaRedirect &&
          (!currentData ||
            (!currentData.totalAmount && !currentData.applicationId))
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
            const storedMetadata = localStorage.getItem(
              "insurancePaymentMetadata",
            );
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

        const finalPaymentType =
          paymentTypeParam || currentData.paymentType || "application_creation";
        const finalApplicationId = applicationId;
        const paymentTypeParts = String(finalPaymentType)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        const containsGiftCard = paymentTypeParts.includes("gift_card");
        const containsInsuranceOnly = paymentTypeParts.some((type) =>
          ["traveler_insurance", "additional_traveler_insurance"].includes(
            type
          )
        );
        const containsVisaApplication = paymentTypeParts.some((type) =>
          ["application_creation", "full_payment", "additional_traveler"].includes(
            type
          )
        );

        const inferredPaymentType = containsGiftCard && !containsVisaApplication
          ? "gift_card"
          : containsInsuranceOnly && !containsVisaApplication
            ? paymentTypeParts.includes("additional_traveler_insurance")
              ? "additional_traveler_insurance"
              : "traveler_insurance"
            : finalPaymentType;

        setPaymentType(inferredPaymentType);

        if (containsGiftCard && !containsVisaApplication) {
          const embeddedPaymentIntentId =
            typeof window !== "undefined"
              ? sessionStorage.getItem("stripePaymentIntentId") || null
              : null;
          const stripePaymentId =
            sessionId || klarnaPaymentIntentId || embeddedPaymentIntentId;

          if (stripePaymentId) {
            await decrementExpertSpotsViaApi(stripePaymentId);
          }

          let giftPaymentMeta = null;
          try {
            const storedGiftMeta = localStorage.getItem("paymentMetadata");
            if (storedGiftMeta) {
              const parsed = JSON.parse(storedGiftMeta);
              if (Date.now() - (parsed.timestamp || 0) < 5 * 60 * 1000) {
                giftPaymentMeta = parsed;
              }
            }
          } catch (metaError) {
            console.error("Error reading gift card payment metadata:", metaError);
          }

          const giftEmail =
            currentData.email ||
            giftPaymentMeta?.email ||
            (typeof window !== "undefined"
              ? localStorageGateway("userEmail", localStorageEnums.GET)
              : null);
          const giftAmount =
            giftPaymentMeta?.amount ||
            currentData.totalAmount ||
            currentData.giftCardFees;
          const giftQuantity = Math.max(
            1,
            Number(
              giftPaymentMeta?.quantity ||
                visaState.giftCardCount ||
                1,
            ),
          );

          if (giftEmail && giftAmount && getPublicApiBase()) {
            try {
              const fulfillPayload = {
                email: giftEmail,
                amount: String(giftAmount),
                quantity: giftQuantity,
              };
              if (stripePaymentId?.startsWith("cs_")) {
                fulfillPayload.stripe_session_id = stripePaymentId;
              }
              if (stripePaymentId?.startsWith("pi_")) {
                fulfillPayload.stripe_payment_intent_id = stripePaymentId;
              } else if (embeddedPaymentIntentId?.startsWith("pi_")) {
                fulfillPayload.stripe_payment_intent_id =
                  embeddedPaymentIntentId;
              }

              const fulfillResponse = await fulfillGiftCardPurchase(fulfillPayload);
              const fulfillResults =
                fulfillResponse?.data?.results ||
                fulfillResponse?.results ||
                fulfillResponse?.data ||
                {};
              const codes = Array.isArray(fulfillResults.codes)
                ? fulfillResults.codes
                : [];
              if (codes.length > 0) {
                setGiftCardCodes(codes);
              }
              if (typeof fulfillResults.emailSent === "boolean") {
                setGiftCardEmailSent(fulfillResults.emailSent);
              }
            } catch (fulfillError) {
              console.error("Gift card fulfill failed:", fulfillError);
              setGiftCardFulfillFailed(true);
            }
          } else {
            console.warn("Gift card fulfill skipped — missing email or amount", {
              giftEmail: !!giftEmail,
              giftAmount: !!giftAmount,
            });
            setGiftCardFulfillFailed(true);
          }

          try {
            localStorage.removeItem("paymentMetadata");
          } catch {}

          setIsCreatingApplication(false);
          setPagePhase("complete");
          return;
        }

        if (containsInsuranceOnly && !containsVisaApplication) {
          const embeddedPaymentIntentIdEarly =
            typeof window !== "undefined"
              ? sessionStorage.getItem("stripePaymentIntentId") || null
              : null;
          const stripePaymentIdEarly =
            sessionId ||
            klarnaPaymentIntentId ||
            embeddedPaymentIntentIdEarly ||
            null;

          if (currentData.email && getPublicApiBase()) {
            try {
              const postAmountRaw =
                (usedStoredInsuranceMetadata &&
                  usedStoredInsuranceMetadata.paymentAmount) ||
                currentData.totalAmount ||
                currentData.insurancePayment ||
                "0";
              await fetch(
                `${getPublicApiBase()}/stripe_payment/test-insurance-payment`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentType: inferredPaymentType,
                    checkoutType: "insurance_only",
                    insuranceOnly: "true",
                    applicationId: finalApplicationId || undefined,
                    travelerIndex: travelerIndex,
                    email: currentData.email,
                    amount: postAmountRaw,
                    orderId: usedStoredInsuranceMetadata?.orderId,
                    sessionId: stripePaymentIdEarly,
                    skipConfirmationEmail: Boolean(stripePaymentIdEarly?.startsWith("cs_")),
                  }),
                },
              );
            } catch (error) {
              console.error("Insurance payment update failed:", error);
            }
          }

          if (stripePaymentIdEarly) {
            await decrementExpertSpotsViaApi(stripePaymentIdEarly);
          }

          setIsCreatingApplication(false);
          setPagePhase("complete");
          return;
        }

        if (
          finalPaymentType === "full_payment" ||
          finalPaymentType === "additional_traveler"
        ) {
          try {
            await fetch(
              `${getPublicApiBase()}/stripe_payment/test-insurance-payment`,
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
              },
            );
          } catch (error) {
            console.error("Error updating payment status:", error);
          }

          if (finalApplicationId) {
            router.replace(
              `/application-step/?application_id=${finalApplicationId}`,
            );
          }
          return;
        }

        const embeddedPaymentIntentId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("stripePaymentIntentId") || null
            : null;

        const stripePaymentId =
          sessionId || klarnaPaymentIntentId || embeddedPaymentIntentId || null;
        const dedupePaymentId =
          stripePaymentId ||
          currentData?.paymentMetadata?.paymentIntentId ||
          null;

        if (embeddedPaymentIntentId && typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("stripePaymentIntentId");
          } catch {}
        }

        if (dedupePaymentId) {
          await decrementExpertSpotsViaApi(dedupePaymentId);
        }

        let sessionMetadata = {};
        if (stripePaymentId && getPublicApiBase()) {
          try {
            const res = await fetch(
              `${
                getPublicApiBase()
              }/stripe_payment/session-metadata?payment_id=${encodeURIComponent(
                stripePaymentId,
              )}`,
            );
            const json = await res.json();
            const meta =
              json?.data?.results?.metadata || json?.results?.metadata || {};
            if (
              meta &&
              typeof meta === "object" &&
              Object.keys(meta).length > 0
            ) {
              sessionMetadata = meta;
            }
          } catch (e) {
            console.warn("Could not fetch session metadata:", e);
          }
        }

        const resolvedCountry = resolveVisaCountryName(
          sessionMetadata.country ||
            currentData.selectedCountry ||
            currentData.paymentMetadata?.country,
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
          visaTypeId:
            sessionMetadata.visaTypeId ||
            currentData.selectedVisaType ||
            visaState.visaTypeId,
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

        const parsedTravelers = Number(mergedData.travelers);
        const numberOfTravelers =
          Number.isFinite(parsedTravelers) && parsedTravelers >= 0
            ? parsedTravelers
            : 0;

        const hasVisaLineItem =
          containsVisaApplication && numberOfTravelers >= 1;

        if (!hasVisaLineItem) {
          console.warn(
            "Skipping visa application creation — no visa line item in checkout",
            { finalPaymentType, numberOfTravelers },
          );
          setIsCreatingApplication(false);
          setPagePhase("complete");
          return;
        }

        const hasInsurance =
          mergedData.insuranceSelected === "true" ||
          (mergedData.insuranceSelected === undefined &&
            Number(mergedData.insurancePayment) > 0)
            ? true
            : false;

        const isCheckoutPayment =
          finalPaymentType === "application_creation" ||
          (!finalPaymentType && !applicationId);

        const insurancePayload =
          numberOfTravelers === mergedData?.storedMetadata?.insuranceCount
            ? {
                insurance: hasInsurance,
                insuranceDetails: hasInsurance ? { selected: true } : null,
                insuranceCertificate: null,
                orderId: null,
                paymentAmount: hasInsurance
                  ? Number(mergedData.insurancePayment) || 0
                  : 0,
                paidInCheckout: hasInsurance && isCheckoutPayment,
                insuranceSource:
                  hasInsurance && isCheckoutPayment ? "checkout" : null,
                insurancePaymentCompleted: hasInsurance,
              }
            : {};

        const initialTravelersData = Array.from(
          { length: numberOfTravelers },
          (_, index) => ({
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
                  (
                    Number(mergedData?.amountWithDiscount || 149) /
                    numberOfTravelers
                  ).toFixed(2),
                ) || 0,
              paymentDate: new Date().toISOString(),
              paymentMethod: "stripe",
              includeInsurance: hasInsurance,
              insuranceType: hasInsurance ? "purchase" : "none",
              paidInCheckout: isCheckoutPayment,
            },
          }),
        );

        const applicationPayload = {
          type: "createApplication",
          email: mergedData.email,
          insuranceDetails:
            numberOfTravelers === mergedData?.storedMetadata?.insuranceCount
              ? null
              : {
                  paidInCheckout: {
                    noOfInsurance:
                      mergedData?.storedMetadata?.insuranceCount || 0,
                    paymentAmount:
                      mergedData?.storedMetadata?.insurancePaymentAmount || 0,
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
              (usedStoredInsuranceMetadata &&
                usedStoredInsuranceMetadata.paymentAmount) ||
              (Number.isFinite(Number(currentData.totalAmount))
                ? currentData.totalAmount
                : "490");
            const postOrderId =
              (usedStoredInsuranceMetadata &&
                usedStoredInsuranceMetadata.orderId) ||
              undefined;
            const postAmount = Number(postAmountRaw);

            if (
              travelerIndex !== null &&
              travelerIndex !== undefined &&
              travelerIndex !== ""
            ) {
              await fetch(
                `${getPublicApiBase()}/stripe_payment/test-insurance-payment`,
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
                },
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
                    : traveler,
                ),
                insurancePaymentCompleted: true,
              });
            } else {
              await fetch(
                `${getPublicApiBase()}/stripe_payment/test-insurance-payment`,
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
                },
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
            console.error(
              "Error updating traveler/application insurance:",
              error,
            );
          }

          setTimeout(() => {
            router.replace(
              `/application-step/?application_id=${finalApplicationId}`,
            );
          }, 2000);
          return;
        }

        if (!containsVisaApplication && (containsGiftCard || containsInsuranceOnly)) {
          return;
        }

        const pendingGiftCards = (visaState.redeemedGiftCards || []).filter(
          (card) => card.pendingRedeem,
        );
        if (pendingGiftCards.length > 0 && mergedData.email) {
          const travelerCount = Number(mergedData.travelers) || Number(visaState.travelers) || 0;
          const packagePrice = Number(visaState.visaFees || 0);
          let appliedCount = 0;

          for (const card of pendingGiftCards) {
            try {
              const giftCardContext = buildGiftCardValidationContext({
                perTravelerFee:
                  travelerCount > 0 ? packagePrice / travelerCount : packagePrice,
                travelers: travelerCount,
                appliedDiscount: visaState.appliedDiscount,
                appliedGiftCards: pendingGiftCards.slice(0, appliedCount),
                packagePrice,
              });

              await redeemGiftCardCode(
                card.code,
                mergedData.email,
                giftCardContext,
              );
              appliedCount += 1;
            } catch (redeemErr) {
              console.error(
                "Gift card redeem after payment failed:",
                redeemErr,
              );
            }
          }
        }

        const applicationResponse = await createApplication(applicationPayload);
        await persistAuthFromResponse(applicationResponse);

        ////////
        if (
          applicationResponse?.status === 200 ||
          applicationResponse?.status === 201
        ) {
          // 🔥 GTM: FIRE PURCHASE EVENT 🔥
          if (typeof window !== "undefined" && window.dataLayer) {
            const ga4PaymentType =
              sessionStorage.getItem("ga4_payment_type") ||
              (isKlarnaRedirect ? "Klarna" : "Credit Card");
            try {
              sessionStorage.removeItem("ga4_payment_type");
            } catch {}

            const transactionId =
              stripePaymentId ||
              applicationResponse?.data?.data?.results?.application?.id ||
              `TXN_${Date.now()}`;

            // Primary path: use the cart snapshot saved when add_payment_info fired.
            // This guarantees purchase items/value/coupon exactly match add_payment_info.
            let savedCart = null;
            try {
              const raw = sessionStorage.getItem("nuvisa.ga4PurchaseCart");
              if (raw) {
                savedCart = JSON.parse(raw);
                // Remove immediately to prevent duplicate events on page refresh.
                sessionStorage.removeItem("nuvisa.ga4PurchaseCart");
              }
            } catch {}

            if (savedCart?.ecommerce) {
              window.dataLayer.push({ ecommerce: null });
              window.dataLayer.push({
                event: "purchase",
                ...(savedCart.user_data && { user_data: savedCart.user_data }),
                ecommerce: {
                  ...savedCart.ecommerce,
                  transaction_id: transactionId,
                  affiliation: "NUvisa Online",
                  payment_type: ga4PaymentType,
                },
              });
            } else {
              // Fallback: reconstruct from Redux/localStorage state when no snapshot
              // is found (e.g. user opened the success URL in a new tab).
              const baseCode =
                visaState.appliedDiscount?.code ||
                localStorage.getItem("saved_ga4_coupon") ||
                undefined;
              const hasCoupon = !!baseCode;
              const couponAppliedDiscount = visaState.appliedDiscount || null;

              const countryName = mergedData.selectedCountry || "Schengen";

              const insCount =
                Number(mergedData?.storedMetadata?.insuranceCount) > 0
                  ? Number(mergedData.storedMetadata.insuranceCount)
                  : Number(mergedData?.insuranceCount) > 0
                    ? Number(mergedData.insuranceCount)
                    : Number(visaState.insuranceCount) > 0
                      ? Number(visaState.insuranceCount)
                      : hasInsurance && Number(mergedData.insurancePayment) > 0
                        ? 1
                        : 0;

              const giftCardCount = Math.max(
                Number(visaState.giftCardCount || 0),
                0,
              );

              const effectiveInsCount =
                numberOfTravelers > 0
                  ? Math.min(insCount, numberOfTravelers)
                  : insCount;

              const purchaseItems = [];

              if (numberOfTravelers > 0) {
                const visaTotal = Number(mergedData.paymentWithoutInsurance) || 0;
                const vItem = {
                  item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
                  item_name: `Visa - ${countryName}`,
                  item_category: "Schengen Visa",
                  item_brand: "NUvisa",
                  price: Number((visaTotal / numberOfTravelers).toFixed(2)),
                  quantity: numberOfTravelers,
                };
                const vCoupon = resolveCoupon(numberOfTravelers >= 3, baseCode);
                if (vCoupon) vItem.coupon = vCoupon;
                const vDiscount = hasCoupon
                  ? computeCouponDiscountPerUnit(visaTotal, numberOfTravelers, couponAppliedDiscount)
                  : 0;
                if (vDiscount > 0) vItem.discount = vDiscount;
                purchaseItems.push(vItem);
              }

              if (hasInsurance && Number(mergedData.insurancePayment) > 0 && insCount > 0) {
                const insuranceTotal = Number(mergedData.insurancePayment) || 0;
                const iItem = {
                  item_id: "insurance_certificate",
                  item_name: "Insurance Certificate",
                  item_category: "Insurance",
                  item_brand: "NUvisa",
                  price: Number((insuranceTotal / insCount).toFixed(2)),
                  quantity: insCount,
                };
                const iCoupon = resolveCoupon(effectiveInsCount >= 3, baseCode);
                if (iCoupon) iItem.coupon = iCoupon;
                const iDiscount = hasCoupon
                  ? computeCouponDiscountPerUnit(insuranceTotal, insCount, couponAppliedDiscount)
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
                  price: Number((giftCardTotal / giftCardCount).toFixed(2)),
                  quantity: giftCardCount,
                };
                const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
                if (gCoupon) gItem.coupon = gCoupon;
                const gDiscount = computeCouponDiscountPerUnit(giftCardTotal, giftCardCount, couponAppliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null));
                if (gDiscount > 0) gItem.discount = gDiscount;
                purchaseItems.push(gItem);
              }

              const klarnaRaw = localStorage.getItem("klarnaFormData");
              const klarnaUser = klarnaRaw
                ? (() => { try { return JSON.parse(klarnaRaw); } catch { return null; } })()
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
                firstName: klarnaUser?.firstName || undefined,
                lastName: klarnaUser?.lastName || undefined,
                street: klarnaUser?.address || undefined,
                city: klarnaUser?.city || undefined,
                postalCode: klarnaUser?.postalCode || undefined,
                country: klarnaUser?.country || undefined,
              });

              window.dataLayer.push({ ecommerce: null });
              window.dataLayer.push({
                event: "purchase",
                ...(purchaseUserData && { user_data: purchaseUserData }),
                ecommerce: {
                  transaction_id: transactionId,
                  affiliation: "NUvisa Online",
                  value: Number(Number(mergedData.totalAmount || 0).toFixed(2)),
                  tax: 0,
                  shipping: 0,
                  currency: "GBP",
                  payment_type: ga4PaymentType,
                  coupon: baseCode,
                  items: purchaseItems,
                },
              });
            }
          }

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
              "/application-step/?application_id=" +
                applicationResponse?.data?.data?.results?.application?.id,
            );
          }, 2000);
        } else {
          throw new Error("Failed to create visa application");
        }
        /////////////////
      } catch (error) {
        console.error(
          "Error storing payment data or creating application:",
          error,
        );
        setTimeout(() => {
          if (
            paymentType === "gift_card" ||
            paymentType === "traveler_insurance" ||
            paymentType === "additional_traveler_insurance"
          ) {
            redirectToHome();
          } else {
            router.replace("/application-step");
          }
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
            Your insurance payment was successful. A confirmation email has been
            sent with your purchase details. No visa application was created for
            this order.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#7350FF] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#7350FF]/90 transition-colors"
          >
            Return to Home
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
            {giftCardCodes.length > 0 ? (
              <div className="mt-4 mb-4 rounded-lg border border-[#7350FF]/30 bg-[#7350FF]/5 p-4 text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Your redemption code{giftCardCodes.length > 1 ? "s" : ""}:
                </p>
                {giftCardCodes.map((code) => (
                  <p
                    key={code}
                    className="font-mono text-lg font-bold text-[#7350FF] tracking-wide py-1"
                  >
                    {code}
                  </p>
                ))}
                {!giftCardEmailSent && userEmail && (
                  <p className="text-sm text-amber-700 mt-3">
                    We could not deliver the confirmation email to{" "}
                    <span className="font-semibold">{userEmail}</span> (SMTP
                    connection issue). Please save the code above — you can still
                    redeem it at checkout.
                  </p>
                )}
              </div>
            ) : null}
            {userEmail && giftCardEmailSent && (
              <p className="text-gray-700 mb-2">
                A confirmation email with your redemption code has been sent to{" "}
                <span className="font-semibold">{userEmail}</span>
              </p>
            )}
            {giftCardCodes.length === 0 && (
              <p className="text-sm text-gray-500 mt-4">
                {giftCardFulfillFailed ? (
                  <>
                    We could not generate your code automatically. Please contact
                    support with your payment confirmation, or check your inbox for
                    the code. Format:{" "}
                    <span className="font-mono font-semibold">NU-VISA-XXXXXX</span>
                  </>
                ) : (
                  <>
                    Please check your email for the code. The code format is:{" "}
                    <span className="font-mono font-semibold">NU-VISA-XXXXXX</span>
                  </>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/")}
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
