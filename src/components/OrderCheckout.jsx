"use client";

import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FaUser, FaShieldAlt } from "react-icons/fa";
import { FaBuildingColumns } from "react-icons/fa6";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { SiKlarna } from "react-icons/si";
import { formatCurrency } from "@/utils/currency";
import ClientOnly from "./ClientOnly";
import { useToast } from "@/contexts/ToastContext";
import QtyInput from "./QtyInput";
import { useSliderContent } from "@/hooks/useSliderContent";
import {
  setAmountWithoutDiscount,
  setAppliedDiscount,
  setCouponCode,
  setGiftCardFees,
  setInsuranceFees,
  setVisaFees,
  setReduxInsuranceCount,
  setReduxGiftCardCount,
  setTotalAmount,
  setTravelers,
  triggerDocumentValidation,
  addRedeemedGiftCard,
  removeRedeemedGiftCard,
  clearRedeemedGiftCards,
} from "@/store/visaSlice";
import StripeProvider from "./StripeProvider";
import StripeElementsCheckout from "./StripeElementsCheckout";
import ExpressPaymentRequestButton from "./ExpressPaymentRequestButton";
import KlarnaForm from "./KlarnaForm";
import { useRouter } from "next/router";
import { validateGiftCardCode } from "@/api/giftCard";
import {
  buildGiftCardValidationContext,
  formatGiftCardAppliedMessage,
  getGiftCardEligibilityError,
  parseGiftCardAmount,
  subtractGiftCardCouponDiscount,
} from "@/utils/giftCardEligibility";
import { getDynamicMonthText } from "@/utils/getDynamicMonthText";
import { getCurrentWeekSlotPercentage } from "@/utils/getCurrentWeekSlotPercentage";
import {
  resolveCheckoutPaymentType,
  canCheckoutWithoutDestinationCountry,
  hasCheckoutLineItems,
} from "@/utils/checkoutPaymentType";
import { GIFT_CARD_PRODUCT_NAME } from "@/constants/productLabels";
import {
  buildGtmUserData,
  normalizePhoneE164 as normalizePhoneE164Util,
  clearStaleGtmUserData,
  resolveCoupon,
  computeCouponDiscountPerUnit,
} from "@/utils/gtmUserData";

const DEFAULT_REQUIRED_DOCUMENTS = {
  passport: false,
  ukVisa: false,
  photos: false,
  bankStatements: false,
  employmentProof: false,
};

const REQUIRED_DOCUMENT_FIELDS = Object.keys(DEFAULT_REQUIRED_DOCUMENTS);

const VisaCheckout = () => {
  const dispatch = useAppDispatch();
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();
  const { content: sliderContent, loading: sliderLoading } = useSliderContent();
  const currentWeekReservedText = useMemo(
    () => getCurrentWeekSlotPercentage(new Date()),
    [],
  );

  // Get data from Redux store first, fallback to URL params if not available
  const visaState = useAppSelector((state) => state.visa);
  const recommendedItems = visaState.recommendedItems || {};
  const visaPriceDisplay = visaState.visaPriceDisplay;

  const [insuranceCount, setInsuranceCount] = useState(
    visaState.insuranceCount || 0,
  );
  console.log("🛡️ INITIAL Insurance Count:", visaState.insuranceCount);
  // Use the current visa fee from Redux when available, otherwise fall back to the selected visa type.
  const fallbackVisaFeePerTraveler =
    visaState.selectedVisaType && visaState.selectedVisaType.priceGBP
      ? Number(visaState.selectedVisaType.priceGBP)
      : visaState.selectedVisaType && visaState.selectedVisaType.price
        ? Math.round(Number(visaState.selectedVisaType.price) / 100)
        : 129;

  const selectedCountry = visaState.selectedCountry;
  const selectedVisaType = visaState.selectedVisaType;
  const visaTypeId = visaState.visaTypeId;
  const travelerCountForVisa = Math.max(Number(visaState.travelers || 0), 0);
  const storedVisaFees = Number(visaState.visaFees || 0);
  const currentVisaFeePerTraveler =
    storedVisaFees > 0 && travelerCountForVisa > 0
      ? storedVisaFees / travelerCountForVisa
      : fallbackVisaFeePerTraveler;
  const hasOccasionPricing = Boolean(visaPriceDisplay?.isOccasion);
  const comparisonVisaFeePerTraveler =
    Number(visaPriceDisplay?.originalPerTraveler || 0) > 0
      ? Number(visaPriceDisplay?.originalPerTraveler)
      : currentVisaFeePerTraveler;
  const traditionalVisaFeePerTraveler = Number(
    visaPriceDisplay?.traditionalPerTraveler || 0,
  );

  // Redux is the single source of truth for travelers on checkout (0 = insurance/gift-card only).
  const travelers = Math.max(Number(visaState.travelers ?? 0), 0);

  const handleTravelersChange = (newCount) => {
    const normalizedCount = Math.max(0, Number(newCount) || 0);

    if (normalizedCount > 0 && insuranceCount > normalizedCount) {
      setInsuranceCount(normalizedCount);
      dispatch(setReduxInsuranceCount(normalizedCount));
    }

    dispatch(setTravelers(normalizedCount));

    dispatch(
      setVisaFees(
        Number((currentVisaFeePerTraveler * normalizedCount).toFixed(2)),
      ),
    );
  };
  let travelDays = 15;
  try {
    const arrival = visaState.arrivalDate
      ? new Date(visaState.arrivalDate)
      : null;
    const departure = visaState.departureDate
      ? new Date(visaState.departureDate)
      : null;
    if (arrival && departure && !isNaN(arrival) && !isNaN(departure)) {
      const diffTime = Math.abs(departure.getTime() - arrival.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);
      travelDays = Math.max(1, diffDays);
    }
  } catch {
    travelDays = 15;
  }
  const userEmail = localStorageGateway("userEmail", localStorageEnums.GET);

  const requiredDocuments = useMemo(
    () => ({
      ...DEFAULT_REQUIRED_DOCUMENTS,
      ...(visaState.requiredDocuments || {}),
    }),
    [visaState.requiredDocuments],
  );

  const perDayInsurancePrice = 2; // GBP per day per traveller
  const originalPerDayInsurancePrice = 3; // Historical price for strike-throughs
  const EMBASSY_FEE_REFERENCE = [
    { label: "12+ yrs", amount: 78 },
    { label: "6 - 11 yrs", amount: 40 },
    { label: "0 - 5 yrs", amount: 0 },
  ];
  const insuranceFeesPerTraveller = perDayInsurancePrice * travelDays; // GBP per traveller
  const insuranceFeesTotal = insuranceFeesPerTraveller * insuranceCount; // total GBP
  const [includeInsurance, setIncludeInsurance] = useState(
    visaState.recommendedItems?.insuranceCertificate || false,
  );
  console.log("🔍 INITIAL Insurance:", {
    includeInsurance: visaState.recommendedItems?.insuranceCertificate || false,
    insuranceCount: visaState.insuranceCount,
  });
  const [email, setEmail] = useState(userEmail || "");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailNewsOffers, setEmailNewsOffers] = useState(false);
  const initialPaymentMethod =
    visaState.selectedPaymentMethod &&
    visaState.selectedPaymentMethod.trim() !== "" &&
    visaState.selectedPaymentMethod !== "stripe"
      ? visaState.selectedPaymentMethod
      : "";
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState(initialPaymentMethod);
  const [couponCode, setCouponCodeLocal] = useState(visaState.couponCode || "");
  const [insuranceCouponCode, setInsuranceCouponCode] = useState();
  // Read appliedDiscount from Redux instead of local state
  const appliedDiscount = visaState.appliedDiscount;
  const [appliedInsuranceDiscount, setAppliedInsuranceDiscount] =
    useState(null);
  const [insuranceCouponError, setInsuranceCouponError] = useState("");
  const [couponError, setCouponError] = useState("");
  // Load gift card state from Redux - now supports multiple cards
  const redeemedGiftCards = visaState.redeemedGiftCards || [];
  const giftCardRedeemed = redeemedGiftCards.length > 0;

  // Calculate total benefits from all redeemed gift cards
  const totalGiftCardBenefits = useMemo(() => {
    return redeemedGiftCards.reduce(
      (total, card) => ({
        freeTraveler: total.freeTraveler + (card.benefits?.freeTraveler || 0),
        freeInsurance:
          total.freeInsurance + (card.benefits?.freeInsurance || 0),
      }),
      { freeTraveler: 0, freeInsurance: 0 },
    );
  }, [redeemedGiftCards]);

  const giftCardBenefits =
    totalGiftCardBenefits.freeTraveler > 0 ||
    totalGiftCardBenefits.freeInsurance > 0
      ? totalGiftCardBenefits
      : null;
  const [isRedeemingGiftCard, setIsRedeemingGiftCard] = useState(false);

  const { showSuccess, showError } = useToast();

  const [studentVerificationSent, setStudentVerificationSent] = useState(false);
  const [studentVerified, setStudentVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const verificationPollRef = useRef(null);
  const emailInputRef = useRef(null);
  const expressPaymentButtonRef = useRef(null);
  const stripeElementsCheckoutRef = useRef(null);
  const [pendingCheckoutQuery, setPendingCheckoutQuery] = useState(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState({
    applePay: false,
    googlePay: false,
  });
  const [isExpressCheckoutRefreshing, setIsExpressCheckoutRefreshing] =
    useState(false);
  const hasCheckedAvailabilityRef = useRef(false);
  const selectedPaymentMethodRef = useRef(selectedPaymentMethod);
  const userClosedStripeFormRef = useRef(false);
  const userClosedKlarnaFormRef = useRef(false);

  // Refs to track previous values for toast notifications
  const prevTravelerCountRef = useRef(travelers);
  const prevInsuranceCountRef = useRef(insuranceCount);
  const prevGiftCardCountRef = useRef(1); // Will be updated when giftCardCount is defined
  const isInitialMountTravelerRef = useRef(true);
  const isInitialMountInsuranceRef = useRef(true);
  const isInitialMountGiftCardRef = useRef(true);

  // Inline Stripe Payment Form
  const [showInlineStripeForm, setShowInlineStripeForm] = useState(false);
  // Klarna Form
  const [showKlarnaForm, setShowKlarnaForm] = useState(false);
  const [isKlarnaSubmitting, setIsKlarnaSubmitting] = useState(false);
  const router = useRouter();

  // /////////////////////
  //////////add user info builder
  // Reusable E.164 phone normalizer — UK-aware
  // Use shared utility (keeps one source of truth for phone normalisation).
  const normalizePhoneE164 = normalizePhoneE164Util;

  /**
   * Builds user_data for Stripe / Apple Pay / Google Pay events.
   * Only includes data the user typed in the Contact Information fields THIS
   * session — never reads stale name/address from localStorage.
   * Returns undefined when there is no meaningful data to send.
   */
  const buildUserData = () =>
    buildGtmUserData({
      email: email || userEmail || undefined,
      phone,
    });

  /**
   * Builds user_data for the Klarna purchase event (onSuccess callback).
   * The `data` object comes directly from KlarnaForm's live state.
   */
  const buildKlarnaUserData = (data) =>
    buildGtmUserData({
      email: data?.email || email || userEmail || undefined,
      phone: data?.phone,
      firstName: data?.firstName,
      lastName: data?.lastName,
      street: data?.address,
      city: data?.city,
      postalCode: data?.postalCode,
      country: data?.country,
    });

  /**
   * Persists the validated GA4 ecommerce cart (items, value, coupon, currency)
   * and user_data to sessionStorage immediately when add_payment_info fires.
   * The purchase event on the success page reads this snapshot instead of
   * re-deriving items from the payment-gateway response, ensuring the two
   * events always match exactly.
   */
  const saveGa4PurchaseCart = (ecommerce, userData) => {
    try {
      sessionStorage.setItem(
        "nuvisa.ga4PurchaseCart",
        JSON.stringify({ ecommerce, user_data: userData || null }),
      );
    } catch {}
  };

  // Auto-show payment form when payment method is selected
  useEffect(() => {
    const shouldShowForm = selectedPaymentMethod === "stripe";

    if (
      shouldShowForm &&
      !showInlineStripeForm &&
      !userClosedStripeFormRef.current
    ) {
      setShowInlineStripeForm(true);
      userClosedStripeFormRef.current = false; // Reset the flag when showing
      // Scroll to the payment form after a short delay
      setTimeout(() => {
        const formElement = document.getElementById("inline-stripe-form");
        if (formElement) {
          formElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);
    } else if (!shouldShowForm && showInlineStripeForm) {
      setShowInlineStripeForm(false);
    }
  }, [selectedPaymentMethod, showInlineStripeForm]);

  // Update ref when selection changes
  useEffect(() => {
    selectedPaymentMethodRef.current = selectedPaymentMethod;
  }, [selectedPaymentMethod]);

  // Clear any user-identity data that was persisted from a previous checkout
  // session so stale values never appear in GTM events.
  useEffect(() => {
    clearStaleGtmUserData();
  }, []);

  // Auto-show Klarna form when Klarna is selected
  useEffect(() => {
    if (
      selectedPaymentMethod === "klarna" &&
      !showKlarnaForm &&
      !userClosedKlarnaFormRef.current
    ) {
      setShowKlarnaForm(true);
      userClosedKlarnaFormRef.current = false; // Reset the flag when showing
      // Scroll to the Klarna form after a short delay
      setTimeout(() => {
        const formElement = document.getElementById("klarna-form-container");
        if (formElement) {
          formElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);
    } else if (selectedPaymentMethod !== "klarna" && showKlarnaForm) {
      setShowKlarnaForm(false);
    }
  }, [selectedPaymentMethod, showKlarnaForm]);

  const sendStudentVerification = async (
    emailToVerify,
    returnTo = "/visa-checkout",
  ) => {
    if (!emailToVerify || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToVerify)) {
      setEmailError("Please enter a valid email");
      return false;
    }

    const educationalDomains = [
      ".edu",
      ".ac.uk",
      ".edu.au",
      ".edu.ca",
      ".ac.nz",
      ".edu.sg",
      ".uni-",
      ".university",
      ".college",
      ".ac.",
      ".edu.",
    ];
    const isEducationalEmail = educationalDomains.some((domain) =>
      emailToVerify.toLowerCase().includes(domain),
    );

    if (!isEducationalEmail) {
      setEmailError(
        "Please use your educational institution email address (.edu, .ac.uk, etc.)",
      );
      return false;
    }

    setIsSendingVerification(true);
    setEmailError("");

    try {
      const resp = await fetch("/api/student/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify, returnTo }),
      });

      const data = await resp.json();
      setIsSendingVerification(false);

      if (resp.ok) {
        setStudentVerificationSent(true);
        setEmailError("");
        startVerificationPolling(emailToVerify);
        return true;
      } else {
        setEmailError(data?.error || "Failed to send verification email");
        return false;
      }
    } catch {
      setIsSendingVerification(false);
      setEmailError("Network error sending verification email");
      return false;
    }
  };

  const startVerificationPolling = (emailToCheck) => {
    const pollInterval = setInterval(async () => {
      try {
        const resp = await fetch("/api/student/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToCheck }),
        });

        const data = await resp.json();

        if (resp.ok && data.verified) {
          setStudentVerified(true);
          setStudentVerificationSent(false);
          if (verificationPollRef.current) {
            clearInterval(verificationPollRef.current);
            verificationPollRef.current = null;
          } else {
            clearInterval(pollInterval);
          }

          try {
            if (typeof showSuccess === "function") {
              showSuccess("Email verified — student discount applied.");
            }
          } catch {}

          if (pendingCheckoutQuery) {
            window.location.href = `/visa-checkout`;
          }
        }
      } catch (e) {
        console.error("Error checking verification status:", e);
      }
    }, 3000);
    verificationPollRef.current = pollInterval;

    setTimeout(
      () => {
        if (verificationPollRef.current) {
          clearInterval(verificationPollRef.current);
          verificationPollRef.current = null;
        }
      },
      10 * 60 * 1000,
    );
  };

  useEffect(() => {
    const onMessage = (e) => {
      try {
        const data = e.data || {};
        if (data && data.type === "student-email-verified") {
          setStudentVerified(true);
          setStudentVerificationSent(false);
          if (verificationPollRef.current) {
            clearInterval(verificationPollRef.current);
            verificationPollRef.current = null;
          }

          try {
            if (typeof showSuccess === "function") {
              showSuccess("Email verified — student discount applied.");
            }
          } catch {}

          if (pendingCheckoutQuery) {
            window.location.href = `/visa-checkout`;
          }
        }
      } catch {}
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pendingCheckoutQuery, selectedPaymentMethod, showSuccess]);

  useEffect(() => {
    try {
      const key = "nuvisa.verifiedStudentEmail";
      const raw = localStorage.getItem(key);
      if (raw) {
        const payload = JSON.parse(raw);
        if (
          payload &&
          payload.email &&
          payload.expiresAt &&
          Date.now() < payload.expiresAt
        ) {
          setStudentVerified(true);

          if (!email) {
            setEmail(payload.email);
          }

          if (
            !appliedDiscount ||
            (appliedDiscount && appliedDiscount.code !== "STUDENT10")
          ) {
            dispatch(
              setAppliedDiscount({
                code: "STUDENT10",
                percentage: 10,
                description: "Student discount",
              }),
            );
            setCouponCodeLocal("STUDENT10");
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const reduxInsuranceCount = visaState.insuranceCount || 0;
    if (reduxInsuranceCount !== insuranceCount) {
      setInsuranceCount(reduxInsuranceCount);
    }
  }, [visaState.insuranceCount, insuranceCount]);

  // Toast notifications for crossing threshold limits - Travelers
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountTravelerRef.current) {
      prevTravelerCountRef.current = travelers;
      isInitialMountTravelerRef.current = false;
      return;
    }

    const prevTravelers = prevTravelerCountRef.current;
    const currentTravelers = travelers;

    // Only show toast if value changed and crossed the threshold
    if (prevTravelers !== currentTravelers) {
      if (prevTravelers < 3 && currentTravelers >= 3) {
        showSuccess("Group discount unlocked! 20% off for 3+ travellers");
      } else if (prevTravelers >= 3 && currentTravelers < 3) {
        showSuccess("Group discount removed — fewer than 3 travellers");
      }
      prevTravelerCountRef.current = currentTravelers;
    }
  }, [travelers, showSuccess]);

  // Toast notifications for crossing threshold limits - Insurance
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountInsuranceRef.current) {
      prevInsuranceCountRef.current = insuranceCount;
      isInitialMountInsuranceRef.current = false;
      // Still apply discount logic on mount if needed
      if (insuranceCount >= 3) {
        setAppliedInsuranceDiscount({
          code: "GROUP20",
          percentage: 20,
          description: "Group discount on insurance",
        });
        setInsuranceCouponCode("GROUP20");
        setCouponError("");
      } else {
        setAppliedInsuranceDiscount(null);
        setInsuranceCouponCode("");
        if (appliedDiscount && couponCode === "STUDENT10") {
          setAppliedInsuranceDiscount({
            code: "STUDENT10",
            percentage: 10,
            description: "Student discount",
          });
        }
      }
      return;
    }

    const prevInsurance = prevInsuranceCountRef.current;
    const currentInsurance = insuranceCount;

    // Only show toast if value changed and crossed the threshold
    if (prevInsurance !== currentInsurance) {
      if (prevInsurance < 3 && currentInsurance >= 3) {
        showSuccess(
          "Insurance group discount unlocked! 20% off for 3+ insurances",
        );
        setAppliedInsuranceDiscount({
          code: "GROUP20",
          percentage: 20,
          description: "Group discount on insurance",
        });
        setInsuranceCouponCode("GROUP20");
        setCouponError("");
      } else if (prevInsurance >= 3 && currentInsurance < 3) {
        showSuccess(
          "Insurance group discount removed — fewer than 3 insurances",
        );
        setAppliedInsuranceDiscount(null);
        setInsuranceCouponCode("");
        if (appliedDiscount && couponCode === "STUDENT10") {
          setAppliedInsuranceDiscount({
            code: "STUDENT10",
            percentage: 10,
            description: "Student discount",
          });
        }
      } else {
        // Update discount state even if not crossing threshold (for consistency)
        if (currentInsurance >= 3) {
          setAppliedInsuranceDiscount({
            code: "GROUP20",
            percentage: 20,
            description: "Group discount on insurance",
          });
          setInsuranceCouponCode("GROUP20");
          setCouponError("");
        } else {
          setAppliedInsuranceDiscount(null);
          setInsuranceCouponCode("");
          if (appliedDiscount && couponCode === "STUDENT10") {
            setAppliedInsuranceDiscount({
              code: "STUDENT10",
              percentage: 10,
              description: "Student discount",
            });
          }
        }
      }
      prevInsuranceCountRef.current = currentInsurance;
    }
  }, [insuranceCount, appliedDiscount, couponCode, showSuccess]);

  useEffect(() => {
    if (travelers < 3) {
      if (
        appliedDiscount &&
        appliedDiscount.code === "GROUP20" &&
        !groupAutoApplied
      ) {
        dispatch(setAppliedDiscount(null));
        setCouponCodeLocal("");
        setCouponError("");
      }
    } else {
      if (
        (!appliedDiscount ||
          (appliedDiscount && appliedDiscount.code !== "GROUP20")) &&
        !groupAutoApplied
      ) {
        dispatch(
          setAppliedDiscount({
            code: "GROUP20",
            percentage: 20,
            description: "Group discount (3+ travellers)",
          }),
        );
        setCouponCodeLocal("GROUP20");
      }
    }
  }, [travelers]);

  const [groupAutoApplied, setGroupAutoApplied] = useState(false);
  const [_showStudentModal, _setShowStudentModal] = useState(false);
  const [_studentEmail, _setStudentEmail] = useState("");
  const [_studentOtp, _setStudentOtp] = useState("");
  const [_isVerifyingOtp, _setIsVerifyingOtp] = useState(false);

  // Function to apply coupon code
  const applyCouponCode = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const codeUpper = couponCode.toUpperCase().trim();

    // Check if it's a gift card code (starts with NU-VISA-)
    if (codeUpper.startsWith("NU-VISA-")) {
      setIsRedeemingGiftCard(true);
      setCouponError("");

      try {
        const giftCardContext = buildGiftCardValidationContext({
          perTravelerFee: currentVisaFeePerTraveler,
          travelers,
          appliedDiscount,
          appliedGiftCards: redeemedGiftCards,
        });

        const eligibilityError = getGiftCardEligibilityError(giftCardContext);
        if (eligibilityError) {
          setCouponError(eligibilityError);
          setIsRedeemingGiftCard(false);
          return;
        }

        const validateResponse = await validateGiftCardCode(
          codeUpper,
          giftCardContext,
        );

        if (
          validateResponse.status === "ERROR" ||
          !validateResponse.data?.results?.valid
        ) {
          setCouponError(validateResponse.message || "Invalid gift card code");
          setIsRedeemingGiftCard(false);
          return;
        }

        const validateResults =
          validateResponse.data?.results || validateResponse.data || {};
        const cardAmount = parseGiftCardAmount(validateResults.giftCard?.amount);
        const quantity = validateResults.giftCard?.quantity || 1;

        if (validateResults.valid !== false) {
          const postValidateError = getGiftCardEligibilityError({
            ...giftCardContext,
            giftCardAmount: cardAmount,
          });
          if (postValidateError) {
            setCouponError(postValidateError);
            setIsRedeemingGiftCard(false);
            return;
          }

          // Check if this code is already redeemed
          const alreadyRedeemed = redeemedGiftCards.some(
            (card) => card.code === codeUpper,
          );
          if (alreadyRedeemed) {
            setCouponError("This gift card code has already been redeemed.");
            setIsRedeemingGiftCard(false);
            return;
          }

          dispatch(
            addRedeemedGiftCard({
              code: codeUpper,
              benefits: { freeTraveler: 0, freeInsurance: 0 },
              quantity,
              amount: cardAmount,
              pendingRedeem: true,
            }),
          );
          setCouponCodeLocal("");
          setCouponError("");

          showSuccess(formatGiftCardAppliedMessage(codeUpper, cardAmount));
        } else {
          setCouponError(validateResponse.message || "Invalid gift card code");
          setIsRedeemingGiftCard(false);
          return;
        }
      } catch (error) {
        console.error("Gift card redemption error:", error);
        setCouponError(
          error.message || "Failed to redeem gift card. Please try again.",
        );
        setIsRedeemingGiftCard(false);
        return;
      } finally {
        setIsRedeemingGiftCard(false);
      }
      return;
    }

    // Handle regular coupon codes
    const availableDiscounts = {
      STUDENT10: {
        description: "Student discount",
        percentage: 10,
      },
      GROUP20: {
        description: "Group discount (3+ travellers)",
        percentage: 20,
        requiresMinTravellers: 3,
      },
    };

    const discount = availableDiscounts[codeUpper];

    if (!discount) {
      setCouponError("Invalid coupon code");
      return;
    }

    // Check group requirement
    if (
      discount.requiresMinTravellers &&
      travelers < discount.requiresMinTravellers
    ) {
      setCouponError(
        `This coupon requires at least ${discount.requiresMinTravellers} travellers`,
      );
      return;
    }

    // Apply immediately
    const currentBaseFee = currentVisaFeePerTraveler;
    const currentVisaFees = currentBaseFee * travelers;
    const calculatedDiscountAmount =
      (currentVisaFees * discount.percentage) / 100;

    const discountWithAmount = {
      ...discount,
      code: codeUpper,
      discountAmount: Math.round(calculatedDiscountAmount),
    };

    dispatch(setAppliedDiscount(discountWithAmount));
    setCouponError("");
    // If user manually applied GROUP20, mark it as manual (not auto-applied)
    if (codeUpper === "GROUP20") {
      setGroupAutoApplied(false);
    }

    if (codeUpper === "STUDENT10") {
      setAppliedInsuranceDiscount({
        code: "STUDENT10",
        percentage: 10,
        description: "Student discount",
      });
    }

    if (discount && discount.description.toLowerCase().includes("student")) {
    }
  };
  const applyInsuranceCode = () => {
    if (insuranceCount >= 3) {
      setInsuranceCouponCode("GROUP20");
      setAppliedInsuranceDiscount({
        code: "GROUP20",
        percentage: 20,
        description: "Group discount on insurance",
      });
      setInsuranceCouponError("");
    } else {
      setInsuranceCouponError("This coupon requires at least 3 insurances");
      setAppliedInsuranceDiscount(null);
    }
  };

  const removeInsuranceCoupon = () => {
    setInsuranceCouponCode("");
    setAppliedInsuranceDiscount(null);
    setInsuranceCouponError("");
  };

  const removeCoupon = () => {
    setCouponCodeLocal("");
    dispatch(setAppliedDiscount(null));
    setCouponError("");
  };

  const removeGiftCard = (code) => {
    dispatch(removeRedeemedGiftCard(code));
    showSuccess(`Gift card ${code} removed.`);
  };
  const [includeGiftCard, setIncludeGiftCard] = useState(
    visaState.recommendedItems?.giftCard || false,
  );
  const [giftCardCount, setGiftCardCount] = useState(
    visaState.giftCardCount || 0,
  );
  console.log("🎁 INITIAL GiftCard:", {
    includeGiftCard: visaState.recommendedItems?.giftCard || false,
    giftCardCount: visaState.giftCardCount || 0,
  });

  // Sync local state with Redux state when it changes - Gift Card
  useEffect(() => {
    const reduxGiftCardCount = visaState.giftCardCount || 0;
    console.log("🎁 Redux gift card sync effect:", {
      reduxValue: reduxGiftCardCount,
      localValue: giftCardCount,
    });
    if (reduxGiftCardCount !== giftCardCount) {
      setGiftCardCount(reduxGiftCardCount);
    }
  }, [visaState.giftCardCount, giftCardCount]);

  // Toast notifications for crossing threshold limits - Gift Card
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountGiftCardRef.current) {
      prevGiftCardCountRef.current = giftCardCount;
      isInitialMountGiftCardRef.current = false;
      return;
    }

    const prevGiftCard = prevGiftCardCountRef.current;
    const currentGiftCard = giftCardCount;

    // Only show toast if value changed and crossed the threshold
    if (prevGiftCard !== currentGiftCard) {
      if (prevGiftCard < 3 && currentGiftCard >= 3) {
        showSuccess(
          "Gift card group discount unlocked! 20% off for 3+ gift cards",
        );
      } else if (prevGiftCard >= 3 && currentGiftCard < 3) {
        showSuccess(
          "Gift card group discount removed — fewer than 3 gift cards",
        );
      }
      prevGiftCardCountRef.current = currentGiftCard;
    }
  }, [giftCardCount, showSuccess]);

  const isDocumentsValid = useMemo(() => {
    const missingDocs = REQUIRED_DOCUMENT_FIELDS.filter(
      (field) => !requiredDocuments[field],
    );

    if (missingDocs.length === 0) {
      return true;
    }

    const hasTravelers = Number(travelers) >= 1;
    const insuranceOnlyNoTravelers =
      (recommendedItems.insuranceCertificate || includeInsurance) &&
      !(recommendedItems.giftCard || includeGiftCard) &&
      !hasTravelers &&
      missingDocs.length === REQUIRED_DOCUMENT_FIELDS.length;

    const giftCardOnlyNoTravelers =
      (recommendedItems.giftCard || includeGiftCard) &&
      !(recommendedItems.insuranceCertificate || includeInsurance) &&
      !hasTravelers &&
      missingDocs.length === REQUIRED_DOCUMENT_FIELDS.length;

    return insuranceOnlyNoTravelers || giftCardOnlyNoTravelers;
  }, [
    requiredDocuments,
    recommendedItems,
    includeInsurance,
    includeGiftCard,
    travelers,
  ]);

  const validateBeforeExpressPayment = useCallback(() => {
    // Check for required documents first
    if (!isDocumentsValid) {
      dispatch(triggerDocumentValidation());
      const message =
        "Please complete all required documents before proceeding with payment.";
      showError(message);
      return message;
    }

    // Check for student email verification if student discount is applied
    if (
      appliedDiscount &&
      appliedDiscount.description &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified
    ) {
      const message =
        "Please verify your student email before proceeding with payment.";
      showError(message);
      return message;
    }
    return null;
  }, [isDocumentsValid, appliedDiscount, studentVerified, showError, dispatch]);

  const handleGiftCardChange = (increment) => {
    const newValue = giftCardCount + increment;
    console.log("🎁 handleGiftCardChange:", {
      current: giftCardCount,
      increment,
      newValue,
      min: 0,
      passes: newValue >= 0,
    });
    if (newValue >= 0) {
      setGiftCardCount(newValue);
      dispatch(setReduxGiftCardCount(Number(newValue)));

      if (newValue > 0 && !includeGiftCard) {
        console.log("🎁 Auto-enabling gift card");
        setIncludeGiftCard(true);
      } else if (newValue === 0 && includeGiftCard) {
        console.log("🎁 Auto-disabling gift card");
        setIncludeGiftCard(false);
      }
    }
  };

  const handleInsuranceChange = (increment) => {
    const proposed = insuranceCount + increment;
    console.log("🛡️ handleInsuranceChange:", {
      current: insuranceCount,
      increment,
      proposed,
      travelers,
      min: 0,
      passes: proposed >= 0,
    });
    if (proposed < 0) return;
    const maxInsurance = travelers > 0 ? travelers : 99;
    const cappedValue = Math.min(proposed, maxInsurance);
    console.log("🛡️ cappedValue:", cappedValue);
    if (cappedValue !== insuranceCount) {
      setInsuranceCount(cappedValue);
      dispatch(setReduxInsuranceCount(Number(cappedValue)));
      if (cappedValue > 0 && !includeInsurance) {
        console.log("🛡️ Auto-enabling insurance");
        setIncludeInsurance(true);
      } else if (cappedValue === 0 && includeInsurance) {
        console.log("🛡️ Auto-disabling insurance");
        setIncludeInsurance(false);
      }
    }
  };

  const isValidPhone = (value) => {
    if (!value) return false;
    const digits = String(value).replace(/\D/g, "");
    if (digits.length === 10) return true;
    if (digits.length === 11 && digits.startsWith("0")) return true;
    return false;
  };

  const isValidUKPostcode = (value) => {
    if (!value) return false;
    const v = String(value).trim().toUpperCase();
    const normalized = v.replace(/\s+/g, "");

    const withSpace = normalized.slice(0, -3) + " " + normalized.slice(-3);

    const re =
      /^([Gg][Ii][Rr]0[Aa]{2})|((?:[A-PR-UWYZ][0-9]{1,2}|[A-PR-UWYZ][A-HK-Y][0-9]{1,2}|[A-PR-UWYZ][0-9][A-HJKPSTUW]|[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY])\s?[0-9][ABD-HJLNP-UW-Z]{2})$/i;

    return re.test(withSpace) || re.test(v) || re.test(normalized);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailBlur = () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
    } else {
      setEmailError("");
    }
  };

  const focusEmailInput = () => {
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        emailInputRef.current.focus({ preventScroll: true });
      }
    }, 0);
  };

  const validateCheckoutEmail = (
    requiredMessage = "Email is required for checkout",
    invalidMessage = "Please enter a valid email for checkout",
  ) => {
    const normalizedEmail = String(email || "").trim();

    if (!normalizedEmail) {
      setEmailError(requiredMessage);
      focusEmailInput();
      return false;
    }

    if (!validateEmail(normalizedEmail)) {
      setEmailError(invalidMessage);
      focusEmailInput();
      return false;
    }

    setEmailError("");
    return true;
  };

  const handlePhoneBlur = () => {
    if (!phone || !phone.trim()) {
      setPhoneError("");
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(
        "Please enter a valid phone number (10 digits or 11 digits starting with 0, e.g. 0123456789)",
      );
    } else {
      setPhoneError("");
    }
  };

  // SUBTOTAL: Original prices (no discounts applied)
  const originalVisaFees =
    (traditionalVisaFeePerTraveler > 0
      ? traditionalVisaFeePerTraveler
      : comparisonVisaFeePerTraveler) * travelers;
  const originalInsuranceFees = includeInsurance
    ? originalPerDayInsurancePrice * travelDays * insuranceCount
    : 0; // Dynamic strike price based on travel days
  const originalGiftCardFees = includeGiftCard ? 245 * giftCardCount : 0; // £245 per gift card
  const eVisaFees = 0; // Currently free
  const subtotal =
    originalVisaFees + originalInsuranceFees + originalGiftCardFees + eVisaFees;

  // TOTAL: Start with discounted base prices (full traveller/insurance counts)
  const baseDiscountedVisaFees = currentVisaFeePerTraveler * travelers;
  const baseDiscountedInsuranceFees = includeInsurance
    ? perDayInsurancePrice * travelDays * insuranceCount
    : 0;
  const baseDiscountedGiftCardFees = includeGiftCard ? 159 * giftCardCount : 0; // £159 per gift card

  // Check if any component qualifies for quantity discount (3+)
  // Note: Insurance count cannot exceed traveler count (insurance certificates are for travelers)
  const effectiveInsuranceCount = Math.min(insuranceCount, travelers);

  const travelersQualify = travelers >= 3;
  const insuranceQualify = effectiveInsuranceCount >= 3;
  const giftCardQualify = giftCardCount >= 3;

  // Check if student discount applies
  const hasStudentDiscount =
    appliedDiscount && appliedDiscount.code === "STUDENT10";
  const hasGroupDiscount =
    appliedDiscount && appliedDiscount.code === "GROUP20";

  // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
  let finalVisaFees = baseDiscountedVisaFees;
  let finalInsuranceFees = baseDiscountedInsuranceFees;
  let finalGiftCardFees = baseDiscountedGiftCardFees;

  // Apply 20% quantity discount first (if 3+ items)
  if (travelersQualify) {
    const quantityDiscount = (finalVisaFees * 20) / 100;
    finalVisaFees = finalVisaFees - quantityDiscount;
  }
  if (insuranceQualify && includeInsurance) {
    const quantityDiscount = (finalInsuranceFees * 20) / 100;
    finalInsuranceFees = finalInsuranceFees - quantityDiscount;
  }
  if (giftCardQualify && includeGiftCard) {
    const quantityDiscount = (finalGiftCardFees * 20) / 100;
    finalGiftCardFees = finalGiftCardFees - quantityDiscount;
  }

  // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
  // if (hasGroupDiscount) {
  //   if (travelersQualify && (insuranceQualify || giftCardQualify)) {
  //     if (travelersQualify && finalVisaFees === baseDiscountedVisaFees) {
  //       const quantityDiscount = (finalVisaFees * 20) / 100;
  //       finalVisaFees = finalVisaFees - quantityDiscount;
  //     }
  //     if (
  //       insuranceQualify &&
  //       includeInsurance &&
  //       finalInsuranceFees === baseDiscountedInsuranceFees
  //     ) {
  //       const quantityDiscount = (finalInsuranceFees * 20) / 100;
  //       finalInsuranceFees = finalInsuranceFees - quantityDiscount;
  //     }
  //     if (
  //       giftCardQualify &&
  //       includeGiftCard &&
  //       finalGiftCardFees === baseDiscountedGiftCardFees
  //     ) {
  //       const quantityDiscount = (finalGiftCardFees * 20) / 100;
  //       finalGiftCardFees = finalGiftCardFees - quantityDiscount;
  //     }
  //   }
  // }
  // ✅ FIXED — each item discounted independently based on its own qualify flag
  if (hasGroupDiscount) {
    if (travelersQualify && finalVisaFees === baseDiscountedVisaFees) {
      finalVisaFees -= (finalVisaFees * 20) / 100;
    }
    if (
      insuranceQualify &&
      includeInsurance &&
      finalInsuranceFees === baseDiscountedInsuranceFees
    ) {
      finalInsuranceFees -= (finalInsuranceFees * 20) / 100;
    }
    if (
      giftCardQualify &&
      includeGiftCard &&
      finalGiftCardFees === baseDiscountedGiftCardFees
    ) {
      finalGiftCardFees -= (finalGiftCardFees * 20) / 100;
    }
  }

  // Apply 10% student discount on already-discounted price (if student)
  if (hasStudentDiscount) {
    const studentDiscount = (finalVisaFees * 10) / 100;
    finalVisaFees = finalVisaFees - studentDiscount;
    if (includeInsurance) {
      const studentDiscount = (finalInsuranceFees * 10) / 100;
      finalInsuranceFees = finalInsuranceFees - studentDiscount;
    }
    if (includeGiftCard) {
      const studentDiscount = (finalGiftCardFees * 10) / 100;
      finalGiftCardFees = finalGiftCardFees - studentDiscount;
    }
  }

  const totalBeforeGiftCardCoupon =
    finalVisaFees + finalInsuranceFees + finalGiftCardFees + eVisaFees;
  const total = subtractGiftCardCouponDiscount(
    totalBeforeGiftCardCoupon,
    redeemedGiftCards,
  );

  const checkoutPaymentType = resolveCheckoutPaymentType({
    travelers,
    finalVisaFees,
    includeGiftCard,
    giftCardCount,
    includeInsurance,
    insuranceCount,
  });

  // YOU SAVE: Subtotal minus Total
  const totalSavingsAmount = subtotal - total;

  // All values are in GBP (no conversion needed)
  const subtotalGBP = subtotal;
  const totalSavingsGBP = totalSavingsAmount;
  const savePercent =
    subtotalGBP > 0 && Number.isFinite(totalSavingsGBP)
      ? Math.min(100, Math.max(0, (totalSavingsGBP / subtotalGBP) * 100))
      : 0;

  // Individual component GBP values (final amounts after discounts)
  const visaFeesGBP = finalVisaFees;
  const discountedVisaFeesGBP = visaFeesGBP;

  const baseInsuranceFeesGBP = finalInsuranceFees;
  const discountedInsuranceFeesGBP = baseInsuranceFeesGBP;

  const giftCardFeesGBP = finalGiftCardFees;

  // Strike-through prices (original prices)
  const travellerStrikeTotal = comparisonVisaFeePerTraveler * travelers;
  const insuranceStrikeTotal = originalInsuranceFees;
  const giftCardStrikeTotal = originalGiftCardFees;

  const travellerStrikeGBP = travellerStrikeTotal;
  const insuranceStrikeGBP = insuranceStrikeTotal;
  const giftCardStrikeGBP = giftCardStrikeTotal;

  const eVisaFeesGBP = 0; // Currently free

  // GBP display values for the UI
  const visaFeesGBPDisplay = finalVisaFees;

  // Insurance display value in GBP (after discounts)
  const displayInsuranceGBP = discountedInsuranceFeesGBP;

  // Gift card display value in GBP
  const _giftCardFeesGBP = giftCardFeesGBP;

  // Calculate individual discount amounts
  const visaDiscountAmount = originalVisaFees - finalVisaFees;
  const insuranceDiscountAmount = originalInsuranceFees - finalInsuranceFees;
  const giftCardDiscountAmount = originalGiftCardFees - finalGiftCardFees;

  const visaDiscountLabelText = useMemo(() => {
    const label = String(visaPriceDisplay?.discountedLabel || "").trim();
    if (!label) return "";
    const savedAmount = Math.max(0, visaDiscountAmount);
    if (savedAmount <= 0) return label;
    if (/[£$€₹]/.test(label)) {
      return `${label}${savedAmount.toFixed(2)}`;
    }
    return `${label} ${formatCurrency(savedAmount, "GBP")}`;
  }, [visaPriceDisplay?.discountedLabel, visaDiscountAmount]);

  // Discount amount in GBP (for display purposes)
  const totalCouponDiscount =
    visaDiscountAmount + insuranceDiscountAmount + giftCardDiscountAmount;
  const discountAmountGBP = totalCouponDiscount;

  // Variables for Apple Pay and other payment methods
  const visaFees = finalVisaFees;
  const insuranceFees = finalInsuranceFees;
  const giftCardFees = finalGiftCardFees;
  const currentBaseFee = currentVisaFeePerTraveler; // Current base fee per traveler
  const totalAmount = total;

  // GA4: begin_checkout funnel step done
  const hasTrackedBeginCheckout = useRef(false);
  // Prevents duplicate add_payment_info when user toggles between payment methods
  const hasTrackedAddPaymentInfo = useRef(false);
  useEffect(() => {
    // 1. FIXED: Fires if ANY item is in the cart
    if (
      !hasTrackedBeginCheckout.current &&
      (travelers > 0 || insuranceCount > 0 || giftCardCount > 0)
    ) {
      hasTrackedBeginCheckout.current = true;

      if (typeof window !== "undefined" && window.dataLayer) {
        const countryName = selectedCountry || "Schengen";

        // 2. FIXED: Uses strictly validated appliedDiscount, ignores raw typed-in couponCode
        // const baseCode = appliedDiscount?.code || undefined;
        const baseCode =
          appliedDiscount?.code ||
          localStorage.getItem("saved_ga4_coupon") ||
          undefined;
        // 3. FIXED: Prevents Math.min from returning 0 if travelers is 0
        const effectiveInsCount =
          travelers > 0 ? Math.min(insuranceCount, travelers) : insuranceCount;

        let ga4PaymentType = undefined;
        if (selectedPaymentMethod === "stripe") ga4PaymentType = "Credit Card";
        else if (selectedPaymentMethod === "klarna") ga4PaymentType = "Klarna";
        else if (selectedPaymentMethod === "apple")
          ga4PaymentType = "Apple Pay";
        else if (selectedPaymentMethod === "google")
          ga4PaymentType = "Google Pay";

        const checkoutItems = [];

        const hasCoupon = !!baseCode;
        const visaDiscountPerUnit = hasCoupon
          ? computeCouponDiscountPerUnit(finalVisaFees, travelers, appliedDiscount)
          : 0;
        const insDiscountPerUnit = hasCoupon
          ? computeCouponDiscountPerUnit(finalInsuranceFees, insuranceCount, appliedDiscount)
          : 0;
        const gcDiscountPerUnit = computeCouponDiscountPerUnit(finalGiftCardFees, giftCardCount, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null));

        if (travelers > 0) {
          const vItem = {
            item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
            item_name: `Visa - ${countryName}`,
            item_category: "Schengen Visa",
            item_brand: "NUvisa",
            price: Number((finalVisaFees / travelers).toFixed(2)),
            quantity: travelers,
          };
          if (visaDiscountPerUnit > 0) vItem.discount = visaDiscountPerUnit;
          const vCoupon = resolveCoupon(travelers >= 3, baseCode);
          if (vCoupon) vItem.coupon = vCoupon;
          checkoutItems.push(vItem);
        }

        if (includeInsurance && insuranceCount > 0) {
          const iItem = {
            item_id: "insurance_certificate",
            item_name: "Insurance Certificate",
            item_category: "Insurance",
            item_brand: "NUvisa",
            price: Number(
              (discountedInsuranceFeesGBP / insuranceCount).toFixed(2),
            ),
            quantity: insuranceCount,
          };
          if (insDiscountPerUnit > 0) iItem.discount = insDiscountPerUnit;
          const iCoupon = resolveCoupon(effectiveInsCount >= 3, baseCode);
          if (iCoupon) iItem.coupon = iCoupon;
          checkoutItems.push(iItem);
        }

        if (includeGiftCard && giftCardCount > 0) {
          const gItem = {
            item_id: "digital_gift_card",
            item_name: GIFT_CARD_PRODUCT_NAME,
            item_category: "Gift Card",
            item_brand: "NUvisa",
            price: Number((giftCardFees / giftCardCount).toFixed(2)),
            quantity: giftCardCount,
          };
          if (gcDiscountPerUnit > 0) gItem.discount = gcDiscountPerUnit;
          const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
          if (gCoupon) gItem.coupon = gCoupon;
          checkoutItems.push(gItem);
        }

        const anyCheckoutQualifies =
          travelers >= 3 || effectiveInsCount >= 3 || giftCardCount >= 3;
        const checkoutRootCoupon = resolveCoupon(
          anyCheckoutQualifies,
          baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined),
        );

        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: "begin_checkout",
          ecommerce: {
            currency: "GBP",
            value: Number(total.toFixed(2)),
            tax: 0,
            shipping: 0,
            payment_type: ga4PaymentType,
            coupon: checkoutRootCoupon,
            items: checkoutItems,
          },
        });
      }
    }
  }, [
    travelers,
    finalVisaFees,
    includeInsurance,
    insuranceCount,
    discountedInsuranceFeesGBP,
    includeGiftCard,
    giftCardCount,
    giftCardFees,
    total,
    appliedDiscount,
    selectedCountry, // Added to fix stale state warnings
    selectedPaymentMethod, // Added to fix stale state warnings
  ]);

  useEffect(() => {
    const isTwoTierNonOccasion =
      !hasOccasionPricing && traditionalVisaFeePerTraveler <= 0;
    console.log("[OrderCheckout][PricingDebug]", {
      country: selectedCountry,
      travelers,
      isOccasion: hasOccasionPricing,
      isTwoTierNonOccasion,
      currentVisaFeePerTraveler,
      comparisonVisaFeePerTraveler,
      traditionalVisaFeePerTraveler,
      originalVisaFees,
      finalVisaFees,
      visaDiscountAmount,
      total,
      totalSavingsAmount,
      visaPriceDisplay,
    });
  }, [
    selectedCountry,
    travelers,
    hasOccasionPricing,
    currentVisaFeePerTraveler,
    comparisonVisaFeePerTraveler,
    traditionalVisaFeePerTraveler,
    originalVisaFees,
    finalVisaFees,
    visaDiscountAmount,
    total,
    totalSavingsAmount,
    visaPriceDisplay,
  ]);

  // Check available payment methods from ExpressPaymentRequestButton
  useEffect(() => {
    const checkAvailableMethods = () => {
      if (expressPaymentButtonRef.current?.getIsRefreshingRequest) {
        const refreshing =
          expressPaymentButtonRef.current.getIsRefreshingRequest();
        setIsExpressCheckoutRefreshing(!!refreshing);
      }

      if (expressPaymentButtonRef.current?.getAvailableMethods) {
        const methods = expressPaymentButtonRef.current.getAvailableMethods();
        if (methods) {
          setAvailablePaymentMethods(methods);
          hasCheckedAvailabilityRef.current = true;
        }
      }
    };

    // Check immediately and then periodically (in case Stripe initializes later)
    checkAvailableMethods();
    const interval = setInterval(checkAvailableMethods, 1000);

    return () => clearInterval(interval);
  }, [totalAmount, travelers, includeInsurance]); // Re-check when relevant props change

  // Note: Validation removed - buttons are already conditionally rendered based on availability
  // Auto-deselection was causing UX issues where user selection was cleared after clicking

  const handleProceedToCheckout = async () => {
    localStorageGateway("paymentAmount", localStorageEnums.SET, String(total));

    // Allow zero travellers for gift-card or insurance-only checkouts
    const allowsZeroTravelers = canCheckoutWithoutDestinationCountry({
      travelers,
      finalVisaFees: visaFeesGBP,
      includeGiftCard,
      giftCardCount,
      includeInsurance,
      insuranceCount,
    });

    localStorageGateway(
      "insurancePaymentMetadata",
      localStorageEnums.SET,
      String(
        JSON.stringify({
          insuranceCount: includeInsurance ? insuranceCount : 0,
          insurancePaymentAmount: discountedInsuranceFeesGBP,
          paymentType: checkoutPaymentType,
          timestamp: Date.now(),
        }),
      ),
    );

    localStorageGateway(
      "paymentMetadata",
      localStorageEnums.SET,
      JSON.stringify({
        email: email || userEmail || "",
        amount: String(total),
        travellers: allowsZeroTravelers ? "0" : String(travelers),
        country: selectedCountry || visaState.selectedCountry || "",
        insurance: includeInsurance ? "true" : "false",
        paymentType: checkoutPaymentType,
        checkoutType:
          checkoutPaymentType === "traveler_insurance"
            ? "insurance_only"
            : checkoutPaymentType === "gift_card"
              ? "gift_card"
              : undefined,
        quantity: includeGiftCard ? giftCardCount : 0,
        noOfInsurance: includeInsurance ? insuranceCount : 0,
        insurancePaymentAmount: discountedInsuranceFeesGBP,
        timestamp: Date.now(),
        paymentDate: new Date().toISOString(),
      }),
    );

    // ✅ Save email + phone so success page user_data works for Stripe/Apple/Google Pay
    if (email || userEmail) {
      localStorageGateway(
        "userEmail",
        localStorageEnums.SET,
        email || userEmail,
      );
    }
    if (phone) {
      localStorageGateway("userPhone", localStorageEnums.SET, phone);
    } else {
      localStorageGateway("userPhone", localStorageEnums.DELETE);
    }

    // ✅ Save name fields so ApplicationStepPaymentSuccessPage user_data works
    // For Stripe/Apple/Google Pay — Klarna already saves these via klarnaFormData
    // OrderCheckout has no name form fields, so derive from email as best-effort,
    // or read from any existing klarnaFormData written in a previous session
    try {
      const existingKlarna = localStorage.getItem("klarnaFormData");
      if (existingKlarna) {
        const parsed = JSON.parse(existingKlarna);
        if (parsed.firstName) {
          localStorageGateway(
            "userFirstName",
            localStorageEnums.SET,
            parsed.firstName,
          );
        }
        if (parsed.lastName) {
          localStorageGateway(
            "userLastName",
            localStorageEnums.SET,
            parsed.lastName,
          );
        }
      }
    } catch {}

    localStorageGateway(
      "insurancePayment",
      localStorageEnums.SET,
      String(discountedInsuranceFeesGBP),
    );
    localStorageGateway(
      "insuranceSelected",
      localStorageEnums.SET,
      includeInsurance ? true : false,
    );

    const normalizedTravellersForStorage = allowsZeroTravelers
      ? "0"
      : String(travelers);
    localStorageGateway(
      "travelers",
      localStorageEnums.SET,
      normalizedTravellersForStorage,
    );

    dispatch(setAmountWithoutDiscount(Number(subtotalGBP)));
    dispatch(setTotalAmount(Number(total)));
    dispatch(setInsuranceFees(Number(discountedInsuranceFeesGBP)));
    dispatch(setGiftCardFees(Number(giftCardFees)));
    dispatch(setCouponCode(couponCode.trim().toUpperCase()));
    if (allowsZeroTravelers) {
      dispatch(setTravelers(0));
    } else {
      dispatch(setTravelers(Number(travelers)));
    }

    localStorageGateway(
      "paymentWithoutInsurance",
      localStorageEnums.SET,
      String(visaFeesGBP),
    );

    localStorageGateway(
      "paymentWithDiscount",
      localStorageEnums.SET,
      String(total - discountedInsuranceFeesGBP),
    );

    if (cretingDynamicCheckout) return;

    // Email is required before hosted checkout methods create sessions.
    if (selectedPaymentMethod === "stripe") {
      if (
        !validateCheckoutEmail(
          "Email is required for credit card payment",
          "Please enter a valid email for checkout",
        )
      ) {
        return;
      }
    } else if (selectedPaymentMethod === "klarna") {
      if (
        !validateCheckoutEmail(
          "Email is required for Klarna payment",
          "Please enter a valid email for Klarna payment",
        )
      ) {
        return;
      }
    } else {
      // For other payment methods, validate format if email is provided
      if (email && !validateEmail(email)) {
        setEmailError("Please enter a valid email");
        focusEmailInput();
        return;
      }
    }

    const countryToUse = selectedCountry || visaState.selectedCountry || "";
    const skipCountryRequirement = canCheckoutWithoutDestinationCountry({
      travelers,
      finalVisaFees,
      includeGiftCard,
      giftCardCount,
      includeInsurance,
      insuranceCount,
    });
    if (
      !skipCountryRequirement &&
      (!countryToUse || countryToUse.trim() === "")
    ) {
      alert("Please select a destination country to continue with checkout");
      return;
    }

    if (
      !hasCheckoutLineItems({
        travelers,
        finalVisaFees,
        includeGiftCard,
        giftCardCount,
        includeInsurance,
        insuranceCount,
      })
    ) {
      alert(
        "Please add at least one item (visa, insurance, or gift card) to checkout",
      );
      return;
    }

    if (phone && String(phone).trim() && !isValidPhone(phone)) {
      setPhoneError(
        "Please enter a valid phone number (10 digits or 11 digits starting with 0)",
      );
      return;
    }

    // Validate payment method selection
    if (!selectedPaymentMethod) {
      // You could add a state for payment method error if needed
      alert("Please select a payment method to continue");
      return;
    }

    // Stripe handles card validation on their hosted checkout page

    setEmailError("");

    if (
      appliedDiscount &&
      appliedDiscount.description &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified
    ) {
      const verificationSent = await sendStudentVerification(email);
      if (!verificationSent) {
        return;
      }
    }
  };

  // Helper function for alerts
  const showAlert = (title, message) => {
    alert(`${title}\n\n${message}`);
  };

  // Apple Pay / Google Pay handled by Stripe Payment Request button

  return (
    <ClientOnly>
      <div className="min-h-screen bg-linear-to-br  from-purple-100 to-[#f3e6ff] flex flex-col h-full">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
            <div className="space-y-1">
              <Link href="/" className="">
                <Image
                  src="/image/logo.png"
                  alt="NUvisa Logo"
                  width={130}
                  height={20}
                  className="h-auto w-[130px] object-contain"
                  priority
                />
              </Link>
              <p className="text-sm text-gray-700">
                Choose one payment method from the options below
              </p>
            </div>

            <Link href="/get-the-visa" className="cursor-pointer">
              <Image
                src="/icons/bag.svg"
                alt="Shopping bag"
                width={30}
                height={20}
                className="object-contain hover:opacity-80 transition-opacity"
                priority
              />
            </Link>
          </div>
        </div>

        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-full grow">
          <div className="space-y-6 p-6 md:p-10 md:pl-10 xl:pl-40">
            {/* Apple Pay / Google Pay - Express Checkout (Above Contact Information) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-lg">Express checkout</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center -gap-2">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 27 27"
                      fill="currentColor"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Apple Pay
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 18 18">
                      <g fill="none" fillRule="evenodd">
                        <path
                          fill="#4285F4"
                          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                        />
                        <path
                          fill="#34A853"
                          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                        />
                        <path
                          fill="#EA4335"
                          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                        />
                      </g>
                    </svg>
                    Google Pay
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 bg-transparent">
                <StripeProvider>
                  {/* Hidden component that handles payment logic - buttons below trigger it */}
                  <ExpressPaymentRequestButton
                    ref={expressPaymentButtonRef}
                    amount={total} // Real GBP total - matches UI exactly
                    currency="GBP"
                    visaFees={finalVisaFees}
                    insuranceFees={finalInsuranceFees}
                    giftCardFees={finalGiftCardFees}
                    travellers={travelers}
                    country={selectedCountry}
                    includeInsurance={includeInsurance}
                    insuranceCount={insuranceCount}
                    insurancePaymentAmount={discountedInsuranceFeesGBP}
                    includeGiftCard={includeGiftCard}
                    giftCardCount={giftCardCount}
                    paymentType={checkoutPaymentType}
                    onBeforePayment={validateBeforeExpressPayment}
                    // Pass all values needed for localStorage/Redux setup (same as handleProceedToCheckout)
                    subtotalGBP={subtotalGBP}
                    discountedInsuranceFeesGBP={discountedInsuranceFeesGBP}
                    visaFeesGBP={visaFeesGBP}
                    couponCode={couponCode}
                    visaTypeId={visaTypeId || visaState.visaTypeId || ""}
                    hideUI={true} // Hide the Stripe button UI
                  />

                  {/* Simple buttons that use the same trigger method as radio button */}
                  {(() => {
                    const isApplePayAvailable =
                      availablePaymentMethods.applePay ||
                      process.env.NODE_ENV === "development" ||
                      process.env.NEXT_PUBLIC_NODE_ENV === "development";
                    const isGooglePayAvailable =
                      availablePaymentMethods.googlePay ||
                      process.env.NODE_ENV === "development" ||
                      process.env.NEXT_PUBLIC_NODE_ENV === "development";
                    const availableCount =
                      (isApplePayAvailable ? 1 : 0) +
                      (isGooglePayAvailable ? 1 : 0);
                    const gridCols =
                      availableCount === 1 ? "grid-cols-1" : "grid-cols-2";
                    const isExpressPayDisabled = isExpressCheckoutRefreshing;

                    return (
                      <div
                        className={`grid ${gridCols} gap-3 max-sm:grid-cols-1 max-sm:gap-2`}
                      >
                        {/* Apple Pay Button */}
                        {isApplePayAvailable && (
                          <button
                            disabled={isExpressPayDisabled}
                            onClick={() => {
                              if (isExpressPayDisabled) {
                                showError(
                                  "Updating checkout total. Please try again in a moment.",
                                );
                                return;
                              }

                              if (
                                !expressPaymentButtonRef.current
                                  ?.triggerPaymentRequest
                              ) {
                                showError(
                                  "Payment system is not initialized. Please refresh and try again.",
                                );
                                return;
                              }

                              const validationError =
                                validateBeforeExpressPayment();
                              if (validationError) return;

                              if (
                                typeof window !== "undefined" &&
                                window.dataLayer
                              ) {
                                const countryName =
                                  selectedCountry || "Schengen";

                                const baseCode =
                                  appliedDiscount?.code || undefined;
                                const hasCoupon = !!baseCode;

                                const effectiveInsCount =
                                  travelers > 0
                                    ? Math.min(insuranceCount, travelers)
                                    : insuranceCount;

                                const paymentItems = [];

                                if (travelers > 0) {
                                  const vItem = {
                                    item_id: `visa_${countryName
                                      .toLowerCase()
                                      .replace(/\s+/g, "_")}`,
                                    item_name: `Visa - ${countryName}`,
                                    price: Number(
                                      (finalVisaFees / travelers).toFixed(2),
                                    ),
                                    quantity: travelers,
                                  };
                                  const vDiscount = hasCoupon
                                    ? computeCouponDiscountPerUnit(finalVisaFees, travelers, appliedDiscount)
                                    : 0;
                                  if (vDiscount > 0) vItem.discount = vDiscount;
                                  const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                                  if (vCoupon) vItem.coupon = vCoupon;
                                  paymentItems.push(vItem);
                                }

                                if (includeInsurance && insuranceCount > 0) {
                                  const iItem = {
                                    item_id: "insurance_certificate",
                                    item_name: "Insurance Certificate",
                                    price: Number(
                                      (
                                        discountedInsuranceFeesGBP /
                                        insuranceCount
                                      ).toFixed(2),
                                    ),
                                    quantity: insuranceCount,
                                  };
                                  const iDiscount = hasCoupon
                                    ? computeCouponDiscountPerUnit(finalInsuranceFees, insuranceCount, appliedDiscount)
                                    : 0;
                                  if (iDiscount > 0) iItem.discount = iDiscount;
                                  const iCoupon = resolveCoupon(
                                    effectiveInsCount >= 3,
                                    baseCode,
                                  );
                                  if (iCoupon) iItem.coupon = iCoupon;
                                  paymentItems.push(iItem);
                                }

                                if (includeGiftCard && giftCardCount > 0) {
                                  const gItem = {
                                    item_id: "digital_gift_card",
                                    item_name: GIFT_CARD_PRODUCT_NAME,
                                    price: Number(
                                      (giftCardFees / giftCardCount).toFixed(2),
                                    ),
                                    quantity: giftCardCount,
                                  };
                                  const gDiscount = computeCouponDiscountPerUnit(finalGiftCardFees, giftCardCount, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null));
                                  if (gDiscount > 0) gItem.discount = gDiscount;
                                  const gCoupon = resolveCoupon(
                                    giftCardCount >= 3,
                                    baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined),
                                  );
                                  if (gCoupon) gItem.coupon = gCoupon;
                                  paymentItems.push(gItem);
                                }

                                sessionStorage.setItem(
                                  "ga4_payment_type",
                                  "Apple Pay",
                                );

                                const anyApplePayQualifies =
                                  travelers >= 3 ||
                                  effectiveInsCount >= 3 ||
                                  (includeGiftCard && giftCardCount >= 3);
                                const applePayRootCoupon = resolveCoupon(
                                  anyApplePayQualifies,
                                  baseCode || (includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                                );

                                if (!hasTrackedAddPaymentInfo.current) {
                                  hasTrackedAddPaymentInfo.current = true;
                                  const applePayUserData = buildUserData();
                                  setTimeout(() => {
                                    const applePayEcommerce = {
                                      currency: "GBP",
                                      value: Number(totalAmount.toFixed(2)),
                                      tax: 0,
                                      shipping: 0,
                                      payment_type: "Apple Pay",
                                      coupon: applePayRootCoupon,
                                      items: paymentItems.map((item) => ({
                                        ...item,
                                        item_category:
                                          item.item_id ===
                                          "insurance_certificate"
                                            ? "Insurance"
                                            : item.item_id ===
                                                "digital_gift_card"
                                              ? "Gift Card"
                                              : "Schengen Visa",
                                        item_brand: "NUvisa",
                                      })),
                                    };
                                    window.dataLayer.push({ ecommerce: null });
                                    window.dataLayer.push({
                                      event: "add_payment_info",
                                      ...(applePayUserData && {
                                        user_data: applePayUserData,
                                      }),
                                      ecommerce: applePayEcommerce,
                                    });
                                    saveGa4PurchaseCart(applePayEcommerce, applePayUserData);
                                  }, 300);
                                }
                              }

                              const triggerResult =
                                expressPaymentButtonRef.current.triggerPaymentRequest();
                              if (!triggerResult?.success) {
                                const fallbackMessage =
                                  triggerResult?.message ||
                                  "Apple Pay is not available on this device. Please select another payment method.";
                                showError(fallbackMessage);
                              }
                            }}
                            className={`group relative flex items-center justify-center bg-black text-white rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 shadow-sm w-full max-sm:py-2.5 ${
                              isExpressPayDisabled
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:opacity-90"
                            }`}
                            style={{
                              backgroundColor: "#000",
                              minHeight: "44px",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <div className="flex items-center -gap-2">
                              <svg
                                width="27"
                                height="27"
                                viewBox="0 0 27 27"
                                fill="currentColor"
                                className="shrink-0"
                              >
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                              </svg>
                              <span className="font-bold tracking-wide text-white text-lg">
                                Pay
                              </span>
                            </div>
                          </button>
                        )}

                        {/* Google Pay Button */}
                        {isGooglePayAvailable && (
                          <button
                            disabled={isExpressPayDisabled}
                            onClick={() => {
                              if (isExpressPayDisabled) {
                                showError(
                                  "Updating checkout total. Please try again in a moment.",
                                );
                                return;
                              }

                              if (
                                !expressPaymentButtonRef.current
                                  ?.triggerPaymentRequest
                              ) {
                                showError(
                                  "Payment system is not initialized. Please refresh and try again.",
                                );
                                return;
                              }

                              const validationError =
                                validateBeforeExpressPayment();
                              if (validationError) return;

                              if (
                                typeof window !== "undefined" &&
                                window.dataLayer
                              ) {
                                const countryName =
                                  selectedCountry || "Schengen";

                                // 🌟 FIXED: Removed raw couponCode fallback
                                const baseCode =
                                  appliedDiscount?.code || undefined;
                                const hasCoupon = !!baseCode;

                                const effectiveInsCount =
                                  travelers > 0
                                    ? Math.min(insuranceCount, travelers)
                                    : insuranceCount;

                                const paymentItems = [];

                                if (travelers > 0) {
                                  const vItem = {
                                    item_id: `visa_${countryName
                                      .toLowerCase()
                                      .replace(/\s+/g, "_")}`,
                                    item_name: `Visa - ${countryName}`,
                                    price: Number(
                                      (finalVisaFees / travelers).toFixed(2),
                                    ),
                                    quantity: travelers,
                                  };
                                  const vDiscount = hasCoupon
                                    ? computeCouponDiscountPerUnit(finalVisaFees, travelers, appliedDiscount)
                                    : 0;
                                  if (vDiscount > 0) vItem.discount = vDiscount;
                                  const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                                  if (vCoupon) vItem.coupon = vCoupon;
                                  paymentItems.push(vItem);
                                }

                                if (includeInsurance && insuranceCount > 0) {
                                  const iItem = {
                                    item_id: "insurance_certificate",
                                    item_name: "Insurance Certificate",
                                    price: Number(
                                      (
                                        discountedInsuranceFeesGBP /
                                        insuranceCount
                                      ).toFixed(2),
                                    ),
                                    quantity: insuranceCount,
                                  };
                                  const iDiscount = hasCoupon
                                    ? computeCouponDiscountPerUnit(finalInsuranceFees, insuranceCount, appliedDiscount)
                                    : 0;
                                  if (iDiscount > 0) iItem.discount = iDiscount;
                                  const iCoupon = resolveCoupon(
                                    effectiveInsCount >= 3,
                                    baseCode,
                                  );
                                  if (iCoupon) iItem.coupon = iCoupon;
                                  paymentItems.push(iItem);
                                }

                                if (includeGiftCard && giftCardCount > 0) {
                                  const gItem = {
                                    item_id: "digital_gift_card",
                                    item_name: GIFT_CARD_PRODUCT_NAME,
                                    price: Number(
                                      (giftCardFees / giftCardCount).toFixed(2),
                                    ),
                                    quantity: giftCardCount,
                                  };
                                  const gDiscount = computeCouponDiscountPerUnit(finalGiftCardFees, giftCardCount, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null));
                                  if (gDiscount > 0) gItem.discount = gDiscount;
                                  const gCoupon = resolveCoupon(
                                    giftCardCount >= 3,
                                    baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined),
                                  );
                                  if (gCoupon) gItem.coupon = gCoupon;
                                  paymentItems.push(gItem);
                                }

                                sessionStorage.setItem(
                                  "ga4_payment_type",
                                  "Google Pay",
                                );

                                const anyGooglePayQualifies =
                                  travelers >= 3 ||
                                  effectiveInsCount >= 3 ||
                                  (includeGiftCard && giftCardCount >= 3);
                                const googlePayRootCoupon = resolveCoupon(
                                  anyGooglePayQualifies,
                                  baseCode || (includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                                );

                                if (!hasTrackedAddPaymentInfo.current) {
                                  hasTrackedAddPaymentInfo.current = true;
                                  const googlePayUserData = buildUserData();
                                  setTimeout(() => {
                                    const googlePayEcommerce = {
                                      currency: "GBP",
                                      value: Number(totalAmount.toFixed(2)),
                                      tax: 0,
                                      shipping: 0,
                                      payment_type: "Google Pay",
                                      coupon: googlePayRootCoupon,
                                      items: paymentItems.map((item) => ({
                                        ...item,
                                        item_category:
                                          item.item_id ===
                                          "insurance_certificate"
                                            ? "Insurance"
                                            : item.item_id ===
                                                "digital_gift_card"
                                              ? "Gift Card"
                                              : "Schengen Visa",
                                        item_brand: "NUvisa",
                                      })),
                                    };
                                    window.dataLayer.push({ ecommerce: null });
                                    window.dataLayer.push({
                                      event: "add_payment_info",
                                      ...(googlePayUserData && {
                                        user_data: googlePayUserData,
                                      }),
                                      ecommerce: googlePayEcommerce,
                                    });
                                    saveGa4PurchaseCart(googlePayEcommerce, googlePayUserData);
                                  }, 300);
                                }
                              }

                              const triggerResult =
                                expressPaymentButtonRef.current.triggerPaymentRequest();
                              if (!triggerResult?.success) {
                                const fallbackMessage =
                                  triggerResult?.message ||
                                  "Google Pay is not available on this device. Please select another payment method.";
                                showError(fallbackMessage);
                              }
                            }}
                            className={`group relative flex items-center justify-center bg-white text-gray-800 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 shadow-sm border border-gray-200 w-full max-sm:py-2.5 ${
                              isExpressPayDisabled
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:shadow-md"
                            }`}
                            style={{
                              minHeight: "44px",
                              background:
                                "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                className="shrink-0 max-sm:w-4 max-sm:h-4"
                              >
                                <g fill="none" fillRule="evenodd">
                                  <path
                                    fill="#4285F4"
                                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                                  />
                                  <path
                                    fill="#34A853"
                                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                                  />
                                  <path
                                    fill="#FBBC05"
                                    d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                                  />
                                  <path
                                    fill="#EA4335"
                                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                                  />
                                </g>
                              </svg>
                              <span className="font-bold tracking-wide text-gray-700 text-lg">
                                Pay
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </StripeProvider>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-medium text-lg">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1"
                  >
                    Email{" "}
                    {selectedPaymentMethod === "stripe" ||
                    selectedPaymentMethod === "klarna"
                      ? "*"
                      : ""}
                  </label>
                  <input
                    type="email"
                    id="email"
                    ref={emailInputRef}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={handleEmailBlur}
                    placeholder="name@example.com"
                    className={`w-full border ${
                      emailError ? "border-red-400" : "border-gray-300"
                    } rounded-md p-2 text-sm  ${
                      emailError
                        ? "outline-none ring-2 ring-red-400"
                        : "focus:outline-none focus:ring-2 focus:ring-black"
                    }`}
                  />
                  {emailError && (
                    <span className="text-sm text-red-400 mt-1">
                      {emailError}
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium mb-1"
                  >
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="e.g. 0123456789"
                    className={`w-full border ${
                      phoneError
                        ? "border-red-400 outline-none ring-2 ring-red-400"
                        : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    } rounded-md p-2 text-sm`}
                  />
                  {phoneError && (
                    <span className="text-sm text-red-400 mt-1">
                      {phoneError}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={emailNewsOffers}
                    onChange={(e) => setEmailNewsOffers(e.target.checked)}
                    className="h-4 w-4 border-gray-300 rounded"
                  />
                  <label htmlFor="newsletter" className="text-sm">
                    Email me with news and offers
                  </label>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>

            <div className="space-y-3 mt-10">
              <h2 className="font-medium text-lg">Payment Method</h2>
              <div className="space-y-2">
                <div
                  className={`border rounded-md p-2 cursor-pointer ${
                    selectedPaymentMethod === "stripe"
                      ? "border-black bg-gray-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => {
                    userClosedStripeFormRef.current = false;
                    setSelectedPaymentMethod("stripe");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={selectedPaymentMethod === "stripe"}
                        onChange={(e) => {
                          userClosedStripeFormRef.current = false;
                          setSelectedPaymentMethod(e.target.value);
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Credit card</span>
                    </div>

                    {/* Payment Method Icons */}
                    <div className="flex h-8 items-center space-x-2">
                      {/* Visa */}
                      <Image
                        src="/image/visa.sxIq5Dot.svg"
                        width={45}
                        height={45}
                        alt="Visa"
                        className="h-7 w-auto"
                        priority
                      />
                      <Image
                        src="/image/mastercard.1c4_lyMp (1).svg"
                        width={45}
                        height={45}
                        alt="Mastercard"
                        className="h-7 w-auto"
                        priority
                      />
                      <Image
                        src="/image/Amex Card.svg"
                        width={55}
                        height={55}
                        alt="American Express"
                        className="h-7 w-auto"
                        priority
                      />
                      <Image
                        src="/image/DGN_AcceptanceMark_FC_Hrz_RGB (1).jpg"
                        width={40}
                        height={40}
                        alt="Discover"
                        className="h-7 w-auto"
                        priority
                      />

                      {/* <div className="bg-[#7350FF] text-white px-2 py-1 rounded text-xs font-bold">
                        VISA
                      </div>
                  
                      <div className="bg-red-500 text-white w-6 h-4 rounded flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full -ml-1"></div>
                      </div>
      
                      <div className="relative w-6 h-4 flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full -ml-1"></div>
              
                      <div className="bg-[#7350FF] text-white px-1 py-1 rounded text-xs font-bold">
                        AMEX
                      </div>
               
                      <span className="text-xs text-gray-500 font-medium">
                        +4
                      </span> */}
                    </div>
                  </div>

                  {/* Inline Stripe Payment Form */}
                  {selectedPaymentMethod === "stripe" && (
                    <div
                      id="inline-stripe-form"
                      className="mt-6 p-6 bg-white border-2 border-[#7350FF] rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Enter Card Details
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            userClosedStripeFormRef.current = true;
                            setShowInlineStripeForm(false);
                            setSelectedPaymentMethod("");
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <StripeProvider>
                        <StripeElementsCheckout
                          ref={stripeElementsCheckoutRef}
                          email={email}
                          amount={total}
                          travelers={travelers}
                          country={
                            selectedCountry || visaState.selectedCountry || ""
                          }
                          insurance={includeInsurance}
                          visaTypeId={visaTypeId || visaState.visaTypeId || ""}
                          currency="GBP"
                          paymentType={checkoutPaymentType}
                          noOfInsurance={insuranceCount}
                          insurancePaymentAmount={discountedInsuranceFeesGBP}
                          hideSubmitButton={true}
                          includeGiftCard={includeGiftCard}
                          giftCardCount={giftCardCount}
                        />
                      </StripeProvider>
                    </div>
                  )}
                </div>

                <div
                  className={`border rounded-md p-2 cursor-pointer ${
                    selectedPaymentMethod === "klarna"
                      ? "border-black bg-gray-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => {
                    userClosedKlarnaFormRef.current = false;
                    setSelectedPaymentMethod("klarna");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="payment"
                        value="klarna"
                        checked={selectedPaymentMethod === "klarna"}
                        onChange={(e) => {
                          userClosedKlarnaFormRef.current = false;
                          setSelectedPaymentMethod(e.target.value);
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">
                        Klarna - Flexible payments
                      </span>
                    </div>
                    <div className="flex h-8 w-[84px] shrink-0 items-center justify-center">
                      <Image
                        src="/icons/klarna.png"
                        width={78}
                        height={39}
                        alt="Klarna"
                        className="h-7 w-auto rounded"
                      />
                    </div>
                  </div>
                  {selectedPaymentMethod === "klarna" && !showKlarnaForm && (
                    <p className="text-xs text-gray-600 mt-2 ml-6">
                      Pay in 3 interest-free payments or spread the cost over 24
                      months
                    </p>
                  )}

                  {/* Klarna Form */}
                  {selectedPaymentMethod === "klarna" && showKlarnaForm && (
                    <div
                      id="klarna-form-container"
                      className="mt-6 p-6 bg-white border-2 border-pink-500 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Complete Klarna Payment
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            userClosedKlarnaFormRef.current = true;
                            setShowKlarnaForm(false);
                            setSelectedPaymentMethod("");
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <KlarnaForm
                        email={email}
                        amount={total}
                        travelers={travelers}
                        country={
                          selectedCountry || visaState.selectedCountry || ""
                        }
                        insurance={includeInsurance}
                        visaTypeId={visaTypeId || visaState.visaTypeId || ""}
                        insuranceCount={insuranceCount}
                        insurancePaymentAmount={discountedInsuranceFeesGBP}
                        paymentType={checkoutPaymentType}
                        applicationId={undefined}
                        travelerIndex={undefined}
                        paymentWithoutInsurance={visaFeesGBP}
                        paymentWithDiscount={total - discountedInsuranceFeesGBP}
                        onCreateCheckoutSession={
                          handleCreateDynamicCheckoutSession
                        }
                        onSubmittingChange={setIsKlarnaSubmitting}
                        onSuccess={(data) => {
                          console.log("Klarna form submitted:", data);
                        }}
                        onAddPaymentInfo={(billingData) => {
                          // BUG FIX: Build cart data unconditionally so saveGa4PurchaseCart
                          // and ga4_payment_type are always persisted before the Klarna
                          // redirect.  Previously these were inside the dataLayer / dedup
                          // guards, which caused the success-page purchase event to fire
                          // with stale or no data when window.dataLayer was unavailable or
                          // hasTrackedAddPaymentInfo was already set by another method.
                          const countryName = selectedCountry || "Schengen";
                          const baseCode =
                            appliedDiscount?.code ||
                            localStorage.getItem("saved_ga4_coupon") ||
                            undefined;
                          const hasCoupon = !!baseCode;
                          const effectiveInsCount =
                            travelers > 0
                              ? Math.min(insuranceCount, travelers)
                              : insuranceCount;
                          const paymentItems = [];
                          if (travelers > 0) {
                            const vItem = {
                              item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
                              item_name: `Visa - ${countryName}`,
                              item_category: "Schengen Visa",
                              item_brand: "NUvisa",
                              price: Number(
                                (finalVisaFees / travelers).toFixed(2),
                              ),
                              quantity: travelers,
                            };
                            const vDiscount = hasCoupon
                              ? computeCouponDiscountPerUnit(finalVisaFees, travelers, appliedDiscount)
                              : 0;
                            if (vDiscount > 0) vItem.discount = vDiscount;
                            const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                            if (vCoupon) vItem.coupon = vCoupon;
                            paymentItems.push(vItem);
                          }
                          if (includeInsurance && insuranceCount > 0) {
                            const iItem = {
                              item_id: "insurance_certificate",
                              item_name: "Insurance Certificate",
                              item_category: "Insurance",
                              item_brand: "NUvisa",
                              price: Number(
                                (
                                  discountedInsuranceFeesGBP / insuranceCount
                                ).toFixed(2),
                              ),
                              quantity: insuranceCount,
                            };
                            const iDiscount = hasCoupon
                              ? computeCouponDiscountPerUnit(finalInsuranceFees, insuranceCount, appliedDiscount)
                              : 0;
                            if (iDiscount > 0) iItem.discount = iDiscount;
                            const iCoupon = resolveCoupon(
                              effectiveInsCount >= 3,
                              baseCode,
                            );
                            if (iCoupon) iItem.coupon = iCoupon;
                            paymentItems.push(iItem);
                          }
                          if (includeGiftCard && giftCardCount > 0) {
                            const gItem = {
                              item_id: "digital_gift_card",
                              item_name: GIFT_CARD_PRODUCT_NAME,
                              item_category: "Gift Card",
                              item_brand: "NUvisa",
                              price: Number(
                                (giftCardFees / giftCardCount).toFixed(2),
                              ),
                              quantity: giftCardCount,
                            };
                            const gDiscount = computeCouponDiscountPerUnit(finalGiftCardFees, giftCardCount, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null));
                            if (gDiscount > 0) gItem.discount = gDiscount;
                            const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
                            if (gCoupon) gItem.coupon = gCoupon;
                            paymentItems.push(gItem);
                          }

                          const anyKlarnaQualifies =
                            travelers >= 3 ||
                            effectiveInsCount >= 3 ||
                            (includeGiftCard && giftCardCount >= 3);
                          const klarnaRootCoupon = resolveCoupon(
                            anyKlarnaQualifies,
                            baseCode || (includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                          );
                          const klarnaUserData =
                            buildKlarnaUserData(billingData);
                          const klarnaEcommerce = {
                            currency: "GBP",
                            value: Number(total.toFixed(2)),
                            tax: 0,
                            shipping: 0,
                            payment_type: "Klarna",
                            coupon: klarnaRootCoupon,
                            items: paymentItems,
                          };

                          // Always persist for success-page purchase event regardless
                          // of dataLayer availability or GA4 dedup state.
                          sessionStorage.setItem("ga4_payment_type", "Klarna");
                          saveGa4PurchaseCart(klarnaEcommerce, klarnaUserData);

                          // GA4 add_payment_info event — only push when dataLayer exists
                          // and the dedup guard has not already fired.
                          if (
                            typeof window === "undefined" ||
                            !window.dataLayer ||
                            hasTrackedAddPaymentInfo.current
                          )
                            return;
                          hasTrackedAddPaymentInfo.current = true;
                          window.dataLayer.push({ ecommerce: null });
                          window.dataLayer.push({
                            event: "add_payment_info",
                            ...(klarnaUserData && {
                              user_data: klarnaUserData,
                            }),
                            ecommerce: klarnaEcommerce,
                          });
                        }}
                        onError={(error) => {
                          console.error("Klarna form error:", error);
                          showError(
                            "Error creating Klarna checkout. Please try again.",
                          );
                        }}
                      />
                    </div>
                  )}
                </div>

                {selectedPaymentMethod === "klarna" && showKlarnaForm && (
                  <div className="border border-gray-300 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                    You’ll be redirected to Klarna - Flexible payments to
                    complete your purchase.
                  </div>
                )}

                {/* Apple Pay Option - Only show if available (or in development mode) */}
                {(availablePaymentMethods.applePay ||
                  process.env.NODE_ENV === "development" ||
                  process.env.NEXT_PUBLIC_NODE_ENV === "development") && (
                  <div
                    className={`border rounded-md p-2 cursor-pointer ${
                      selectedPaymentMethod === "apple"
                        ? "border-black bg-gray-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("apple")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="payment"
                          value="apple"
                          checked={selectedPaymentMethod === "apple"}
                          onChange={(e) =>
                            setSelectedPaymentMethod(e.target.value)
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">Apple Pay</span>
                      </div>
                      <div className="flex h-8 w-[84px] shrink-0 items-center justify-center">
                        <Image
                          src="/icons/apple-pay.svg"
                          width={34}
                          height={34}
                          alt="Apple Pay"
                          className="h-[34px] w-[34px]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Pay Option - Only show if available (or in development mode) */}
                {(availablePaymentMethods.googlePay ||
                  process.env.NODE_ENV === "development" ||
                  process.env.NEXT_PUBLIC_NODE_ENV === "development") && (
                  <div
                    className={`border rounded-md p-2 cursor-pointer ${
                      selectedPaymentMethod === "google"
                        ? "border-black bg-gray-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("google")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="payment"
                          value="google"
                          checked={selectedPaymentMethod === "google"}
                          onChange={(e) =>
                            setSelectedPaymentMethod(e.target.value)
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">Google Pay</span>
                      </div>
                      <div className="flex h-8 w-[84px] shrink-0 items-center justify-center">
                        <svg
                          width="27"
                          height="27"
                          viewBox="0 0 18 18"
                          className="shrink-0"
                        >
                          <g fill="none" fillRule="evenodd">
                            <path
                              fill="#4285F4"
                              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                            />
                            <path
                              fill="#34A853"
                              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                            />
                            <path
                              fill="#EA4335"
                              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                            />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={
                  cretingDynamicCheckout ||
                  isKlarnaSubmitting ||
                  (appliedDiscount &&
                    appliedDiscount.description &&
                    appliedDiscount.description
                      .toLowerCase()
                      .includes("student") &&
                    !studentVerified)
                }
                onClick={async () => {
                  // If card form is shown, create PaymentIntent first, then submit
                  if (
                    selectedPaymentMethod === "stripe" &&
                    showInlineStripeForm
                  ) {
                    if (
                      !validateCheckoutEmail(
                        "Email is required for credit card payment",
                        "Please enter a valid email for checkout",
                      )
                    ) {
                      return;
                    }

                    // 🔥 FIRE ADD PAYMENT INFO EVENT HERE (STRIPE) 🔥

                    if (typeof window !== "undefined" && window.dataLayer) {
                      const countryName = selectedCountry || "Schengen";
                      // 🌟 FIXED: Verified discount with local storage state persistence fallback
                      const baseCode =
                        appliedDiscount?.code ||
                        localStorage.getItem("saved_ga4_coupon") ||
                        undefined;
                      const hasCoupon = !!baseCode;
                      const effectiveInsCount =
                        travelers > 0
                          ? Math.min(insuranceCount, travelers)
                          : insuranceCount;

                      const paymentItems = [];

                      if (travelers > 0) {
                        const vItem = {
                          item_id: `visa_${countryName
                            .toLowerCase()
                            .replace(/\s+/g, "_")}`,
                          item_name: `Visa - ${countryName}`,
                          price: Number((finalVisaFees / travelers).toFixed(2)),
                          quantity: travelers,
                        };
                        const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                        if (vCoupon) vItem.coupon = vCoupon;
                        paymentItems.push(vItem);
                      }

                      if (includeInsurance && insuranceCount > 0) {
                        const iItem = {
                          item_id: "insurance_certificate",
                          item_name: "Insurance Certificate",
                          price: Number(
                            (
                              discountedInsuranceFeesGBP / insuranceCount
                            ).toFixed(2),
                          ),
                          quantity: insuranceCount,
                        };
                        const iCoupon = resolveCoupon(effectiveInsCount >= 3, baseCode);
                        if (iCoupon) iItem.coupon = iCoupon;
                        paymentItems.push(iItem);
                      }

                      if (includeGiftCard && giftCardCount > 0) {
                        const gItem = {
                          item_id: "digital_gift_card",
                          item_name: GIFT_CARD_PRODUCT_NAME,
                          price: Number(
                            (giftCardFees / giftCardCount).toFixed(2),
                          ),
                          quantity: giftCardCount,
                        };
                        const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
                        if (gCoupon) gItem.coupon = gCoupon;
                        paymentItems.push(gItem);
                      }

                      let ga4PaymentType = "Credit Card";
                      if (selectedPaymentMethod === "klarna")
                        ga4PaymentType = "Klarna";
                      if (selectedPaymentMethod === "apple")
                        ga4PaymentType = "Apple Pay";
                      if (selectedPaymentMethod === "google")
                        ga4PaymentType = "Google Pay";

                      sessionStorage.setItem(
                        "ga4_payment_type",
                        ga4PaymentType,
                      );

                      if (!hasTrackedAddPaymentInfo.current) {
                        hasTrackedAddPaymentInfo.current = true;
                        const enrichedItems = paymentItems.map((item) => {
                          const isInsurance =
                            item.item_id === "insurance_certificate";
                          const isGiftCard =
                            item.item_id === "digital_gift_card";
                          const lineFinalFees = isInsurance
                            ? finalInsuranceFees
                            : isGiftCard
                              ? finalGiftCardFees
                              : finalVisaFees;
                          const lineQty = isInsurance
                            ? insuranceCount
                            : isGiftCard
                              ? giftCardCount
                              : travelers;
                          const discountAmt = isGiftCard
                            ? computeCouponDiscountPerUnit(lineFinalFees, lineQty, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null))
                            : hasCoupon
                              ? computeCouponDiscountPerUnit(lineFinalFees, lineQty, appliedDiscount)
                              : 0;
                          const enriched = {
                            ...item,
                            item_category: isInsurance
                              ? "Insurance"
                              : isGiftCard
                                ? "Gift Card"
                                : "Schengen Visa",
                            item_brand: "NUvisa",
                          };
                          if (discountAmt > 0) enriched.discount = discountAmt;
                          return enriched;
                        });
                        const ccUserData = buildUserData();
                        const anyCcQualifies =
                          travelers >= 3 ||
                          effectiveInsCount >= 3 ||
                          (includeGiftCard && giftCardCount >= 3);
                        const ccRootCoupon = resolveCoupon(
                          anyCcQualifies,
                          baseCode || (includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                        );
                        const ccEcommerce = {
                          currency: "GBP",
                          value: Number(total.toFixed(2)),
                          tax: 0,
                          shipping: 0,
                          payment_type: ga4PaymentType,
                          coupon: ccRootCoupon,
                          items: enrichedItems,
                        };
                        window.dataLayer.push({ ecommerce: null });
                        window.dataLayer.push({
                          event: "add_payment_info",
                          ...(ccUserData && { user_data: ccUserData }),
                          ecommerce: ccEcommerce,
                        });
                        saveGa4PurchaseCart(ccEcommerce, ccUserData);
                      }
                    }

                    // Create PaymentIntent if not already created
                    if (
                      stripeElementsCheckoutRef.current?.createPaymentIntent
                    ) {
                      const result =
                        await stripeElementsCheckoutRef.current.createPaymentIntent();
                      if (!result.success) {
                        showError(
                          result.message || "Failed to create payment intent",
                        );
                        return;
                      }
                      // Form submission will be triggered automatically after PaymentIntent is created
                    } else {
                      // Fallback: try to submit form directly
                      const form = document.getElementById(
                        "stripe-payment-form",
                      );
                      if (form) {
                        form.requestSubmit();
                      }
                    }
                  } else if (
                    selectedPaymentMethod === "klarna" &&
                    showKlarnaForm
                  ) {
                    if (
                      !validateCheckoutEmail(
                        "Email is required for Klarna payment",
                        "Please enter a valid email for Klarna payment",
                      )
                    ) {
                      return;
                    }

                    // add_payment_info for Klarna fires from KlarnaForm.onAddPaymentInfo
                    // with live, validated billing data — nothing to push here.

                    // Trigger Klarna form submission
                    const klarnaForm = document.getElementById(
                      "klarna-payment-form",
                    );
                    if (klarnaForm) {
                      klarnaForm.requestSubmit();
                    }
                  } else if (
                    selectedPaymentMethod === "apple" ||
                    selectedPaymentMethod === "google"
                  ) {
                    const validationError = validateBeforeExpressPayment();
                    if (validationError) return;

                    // 🔥 FIRE ADD PAYMENT INFO EVENT HERE (APPLE/GOOGLE PAY) 🔥
                    if (typeof window !== "undefined" && window.dataLayer) {
                      const countryName = selectedCountry || "Schengen";
                      // 🌟 FIXED: Verified discount with local storage state persistence fallback
                      const baseCode =
                        appliedDiscount?.code ||
                        localStorage.getItem("saved_ga4_coupon") ||
                        undefined;
                      const hasCoupon = !!baseCode;
                      // 🌟 FIXED: Safe insurance count calculation
                      const effectiveInsCount =
                        travelers > 0
                          ? Math.min(insuranceCount, travelers)
                          : insuranceCount;

                      const paymentItems = [];

                      if (travelers > 0) {
                        const vItem = {
                          item_id: `visa_${countryName
                            .toLowerCase()
                            .replace(/\s+/g, "_")}`,
                          item_name: `Visa - ${countryName}`,
                          price: Number((finalVisaFees / travelers).toFixed(2)),
                          quantity: travelers,
                        };
                        const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                        if (vCoupon) vItem.coupon = vCoupon;
                        paymentItems.push(vItem);
                      }

                      if (includeInsurance && insuranceCount > 0) {
                        const iItem = {
                          item_id: "insurance_certificate",
                          item_name: "Insurance Certificate",
                          price: Number(
                            (
                              discountedInsuranceFeesGBP / insuranceCount
                            ).toFixed(2),
                          ),
                          quantity: insuranceCount,
                        };
                        const iCoupon = resolveCoupon(effectiveInsCount >= 3, baseCode);
                        if (iCoupon) iItem.coupon = iCoupon;
                        paymentItems.push(iItem);
                      }

                      if (includeGiftCard && giftCardCount > 0) {
                        const gItem = {
                          item_id: "digital_gift_card",
                          item_name: GIFT_CARD_PRODUCT_NAME,
                          price: Number(
                            (giftCardFees / giftCardCount).toFixed(2),
                          ),
                          quantity: giftCardCount,
                        };
                        const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
                        if (gCoupon) gItem.coupon = gCoupon;
                        paymentItems.push(gItem);
                      }

                      const ga4PaymentType =
                        selectedPaymentMethod === "apple"
                          ? "Apple Pay"
                          : "Google Pay";
                      sessionStorage.setItem(
                        "ga4_payment_type",
                        ga4PaymentType,
                      );

                      if (!hasTrackedAddPaymentInfo.current) {
                        hasTrackedAddPaymentInfo.current = true;
                        const enrichedItems = paymentItems.map((item) => {
                          const isInsurance =
                            item.item_id === "insurance_certificate";
                          const isGiftCard =
                            item.item_id === "digital_gift_card";
                          const lineFinalFees = isInsurance
                            ? finalInsuranceFees
                            : isGiftCard
                              ? finalGiftCardFees
                              : finalVisaFees;
                          const lineQty = isInsurance
                            ? insuranceCount
                            : isGiftCard
                              ? giftCardCount
                              : travelers;
                          const discountAmt = isGiftCard
                            ? computeCouponDiscountPerUnit(lineFinalFees, lineQty, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null))
                            : hasCoupon
                              ? computeCouponDiscountPerUnit(lineFinalFees, lineQty, appliedDiscount)
                              : 0;
                          const enriched = {
                            ...item,
                            item_category: isInsurance
                              ? "Insurance"
                              : isGiftCard
                                ? "Gift Card"
                                : "Schengen Visa",
                            item_brand: "NUvisa",
                          };
                          if (discountAmt > 0) enriched.discount = discountAmt;
                          return enriched;
                        });
                        const expressUserData = buildUserData();
                        const anyExpressQualifies =
                          travelers >= 3 ||
                          effectiveInsCount >= 3 ||
                          (includeGiftCard && giftCardCount >= 3);
                        const expressRootCoupon = resolveCoupon(
                          anyExpressQualifies,
                          baseCode || (includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                        );
                        const expressEcommerce = {
                          currency: "GBP",
                          value: Number(total.toFixed(2)),
                          tax: 0,
                          shipping: 0,
                          payment_type: ga4PaymentType,
                          coupon: expressRootCoupon,
                          items: enrichedItems,
                        };
                        window.dataLayer.push({ ecommerce: null });
                        window.dataLayer.push({
                          event: "add_payment_info",
                          ...(expressUserData && {
                            user_data: expressUserData,
                          }),
                          ecommerce: expressEcommerce,
                        });
                        saveGa4PurchaseCart(expressEcommerce, expressUserData);
                      }
                    }

                    // TRIGGER Apple/Google Pay just like express button does
                    if (
                      !expressPaymentButtonRef.current?.triggerPaymentRequest
                    ) {
                      showError(
                        "Payment system is not initialized. Please refresh and try again.",
                      );
                      return;
                    }

                    const triggerResult =
                      expressPaymentButtonRef.current.triggerPaymentRequest();
                    if (!triggerResult?.success) {
                      const fallbackMessage =
                        triggerResult?.message ||
                        `${
                          selectedPaymentMethod === "apple" ? "Apple" : "Google"
                        } Pay is not available on this device. Please select another method.`;
                      showError(fallbackMessage);
                    }
                    return;
                  } else {
                    handleProceedToCheckout();
                  }
                }}
                className={`w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-900 transition-colors ${
                  cretingDynamicCheckout ||
                  (appliedDiscount &&
                    appliedDiscount.description &&
                    appliedDiscount.description
                      .toLowerCase()
                      .includes("student") &&
                    !studentVerified)
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {cretingDynamicCheckout || isKlarnaSubmitting ? (
                  "Processing..."
                ) : appliedDiscount &&
                  appliedDiscount.description &&
                  appliedDiscount.description
                    .toLowerCase()
                    .includes("student") &&
                  !studentVerified ? (
                  "Verify your email to continue"
                ) : selectedPaymentMethod === "klarna" && !showKlarnaForm ? (
                  <div className="flex items-center justify-center space-x-2">
                    <SiKlarna />
                    <span>Continue to Klarna Payment</span>
                  </div>
                ) : selectedPaymentMethod === "klarna" && showKlarnaForm ? (
                  <div className="flex items-center justify-center space-x-2">
                    <SiKlarna />
                    <span>Pay {formatCurrency(total, "GBP")} with Klarna</span>
                  </div>
                ) : selectedPaymentMethod === "apple" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span>Continue with Apple Pay</span>
                  </div>
                ) : selectedPaymentMethod === "google" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <g fill="none" fillRule="evenodd">
                        <path
                          fill="#4285F4"
                          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                        />
                        <path
                          fill="#34A853"
                          d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                        />
                        <path
                          fill="#EA4335"
                          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                        />
                      </g>
                    </svg>
                    <span>Continue with Google Pay</span>
                  </div>
                ) : selectedPaymentMethod === "stripe" &&
                  !showInlineStripeForm ? (
                  `Continue to Payment`
                ) : selectedPaymentMethod === "stripe" &&
                  showInlineStripeForm ? (
                  `Pay ${formatCurrency(total, "GBP")}`
                ) : (
                  `Complete Order`
                )}
              </button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                {" "}
                All transactions are secure and encrypted. Powered by
                <a
                  rel="stylesheet"
                  href="https://stripe.com"
                  className="ml-[3px] text-blue-400 underline"
                >
                  Stripe
                </a>
              </p>
            </div>
          </div>

          <div className="bg-black text-white p-6 md:p-10 md:pr-10 xl:pr-40 space-y-5">
            <h2 className="font-semibold text-lg" suppressHydrationWarning>
              Schengen visa from the UK
            </h2>

            <p className="text-sm text-gray-300" suppressHydrationWarning>
              {selectedCountry ? `Destination: ${selectedCountry}` : ""}
            </p>

            {selectedVisaType && (
              <div className="text-sm text-gray-300">
                <p suppressHydrationWarning>
                  Visa Type: {selectedVisaType.name || selectedVisaType.type}
                </p>
                {selectedVisaType.subType && (
                  <p className="text-xs" suppressHydrationWarning>
                    {selectedVisaType.subType}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="addTravellers"
                className="h-4 w-4 border-gray-300 rounded"
                checked={travelers > 1}
                onChange={(e) => {
                  if (e.target.checked && travelers === 1) {
                    handleTravelersChange(2);
                  } else if (!e.target.checked && travelers > 1) {
                    handleTravelersChange(1);
                  }
                }}
              />
              <label htmlFor="addTravellers" className="text-sm">
                Add additional travellers
              </label>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <FaUser className="text-lg" />
                <span className="text-sm">Travellers</span>
              </div>

              <QtyInput
                onIncrement={(val) => handleTravelersChange(val)}
                onDecrement={(val) => handleTravelersChange(val)}
                value={travelers}
                min={0}
              />
            </div>

            <div className="flex items-center gap-3 justify-end flex-wrap">
              {traditionalVisaFeePerTraveler > 0 && (
                <div className="flex flex-col items-end">
                  <span className="line-through">
                    {formatCurrency(
                      traditionalVisaFeePerTraveler * travelers,
                      "GBP",
                    )}
                  </span>
                  {visaPriceDisplay?.isOccasion &&
                    !!visaPriceDisplay?.traditionalLabel && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        {/* {visaPriceDisplay.traditionalLabel} */}
                      </span>
                    )}
                </div>
              )}
              <div className="flex flex-col items-end">
                <span className="line-through">
                  {formatCurrency(travellerStrikeGBP, "GBP")}
                </span>
                {!!visaPriceDisplay?.originalLabel && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {/* {visaPriceDisplay.originalLabel} */}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">
                  {formatCurrency(visaFeesGBPDisplay, "GBP")}
                </span>
                {!!visaPriceDisplay?.discountedLabel && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {/* {visaDiscountLabelText} */}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <Image
                  src="/image/calendar.jpg"
                  alt="Calendar"
                  width={16}
                  height={16}
                  className="w-4 h-4 object-cover"
                  priority
                />
                <span className="text-sm">Appointment fee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="line-through">
                  {formatCurrency(100, "GBP")}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(0, "GBP")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center space-x-2">
                <Image
                  src="/image/flights.jpg"
                  alt="Flights"
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-sm object-cover"
                  priority
                />
                <span className="text-sm">Concierge assistance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="line-through">
                  {formatCurrency(35, "GBP")}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(0, "GBP")}
                </span>
              </div>
            </div>

            {/* Insurance */}
            <div className="flex items-center justify-between py-1">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  console.log("🛡️ Insurance checkbox clicked:", {
                    current: includeInsurance,
                    newVal: !includeInsurance,
                  });
                  setIncludeInsurance(!includeInsurance);
                  if (!includeInsurance) {
                    setInsuranceCount(1);
                    dispatch(setReduxInsuranceCount(1));
                  } else {
                    setInsuranceCount(0);
                    dispatch(setReduxInsuranceCount(0));
                  }
                }}
              >
                <input
                  type="checkbox"
                  id="insurance"
                  checked={includeInsurance}
                  onChange={(e) => setIncludeInsurance(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded"
                />
                <FaShieldAlt />
                <span className="text-sm">Travel Insurance </span>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <QtyInput
                  value={insuranceCount}
                  onIncrement={() => handleInsuranceChange(1)}
                  onDecrement={() => handleInsuranceChange(-1)}
                  min={0}
                />
                <div className="flex item-center gap-2">
                  <span className="line-through">
                    {formatCurrency(insuranceStrikeGBP, "GBP")}
                  </span>
                  <span className={`text-sm `}>
                    {includeInsurance
                      ? formatCurrency(displayInsuranceGBP, "GBP")
                      : formatCurrency(0, "GBP")}
                  </span>
                </div>
              </div>
            </div>
            {includeInsurance && (
              <p className="text-xs text-gray-400 -mt-2">
                (Included for {insuranceCount} traveler
                {travelers > 1 ? "s" : ""})
              </p>
            )}

            <div className="pt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <FaBuildingColumns className="text-sm" />
                <span className="text-sm">Embassy fee</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pay in person to a government official during appointment
              </p>
              <div className="space-y-1">
                {EMBASSY_FEE_REFERENCE.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-400">{item.label}</span>
                    <span className="font-semibold">
                      {formatCurrency(item.amount, "GBP")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* E visa card */}
            {/* Digital Gift Card */}
            <div className="flex items-center justify-between py-1">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  console.log("🎁 GiftCard checkbox clicked:", {
                    current: includeGiftCard,
                    newVal: !includeGiftCard,
                  });
                  setIncludeGiftCard(!includeGiftCard);
                  if (!includeGiftCard) {
                    setGiftCardCount(1);
                    dispatch(setReduxGiftCardCount(1));
                  } else {
                    setGiftCardCount(0);
                    dispatch(setReduxGiftCardCount(0));
                  }
                }}
              >
                <input
                  type="checkbox"
                  id="giftCard"
                  checked={includeGiftCard}
                  onChange={(e) => {
                    console.log("🎁 GiftCard onChange:", {
                      checked: e.target.checked,
                      current: giftCardCount,
                    });
                    setIncludeGiftCard(e.target.checked);
                    if (e.target.checked && giftCardCount === 0) {
                      setGiftCardCount(1);
                      dispatch(setReduxGiftCardCount(1));
                    } else if (!e.target.checked) {
                      setGiftCardCount(0);
                      dispatch(setReduxGiftCardCount(0));
                    }
                  }}
                  className="h-4 w-4 border-gray-300 rounded"
                />
                <HiOutlineDeviceMobile className="rotate-90" />
                <span className="text-sm">Digital gift card</span>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <QtyInput
                  value={giftCardCount}
                  onIncrement={() => handleGiftCardChange(1)}
                  onDecrement={() => handleGiftCardChange(-1)}
                  min={0}
                />
                <div className="flex items-center gap-2">
                  {includeGiftCard && (
                    <span className="line-through">
                      {formatCurrency(giftCardStrikeGBP, "GBP")}
                    </span>
                  )}
                  <span className="text-sm">
                    {includeGiftCard
                      ? formatCurrency(_giftCardFeesGBP, "GBP")
                      : formatCurrency(0, "GBP")}
                  </span>
                </div>
              </div>
            </div>
            {includeGiftCard && (
              <p className="text-xs text-gray-400 -mt-2">
                Digital gift card for {giftCardCount}
              </p>
            )}

            {/* Subtotal */}
            {/* <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalGBP, "GBP")}</span>
            </div> */}

            {/* Discount */}
            {/* {appliedDiscount && (
              <div className="flex justify-between text-sm text-green-400">
                <span>
                  {appliedDiscount.description} (-{appliedDiscount.percentage}%)
                </span>
                <span>-{formatCurrency(discountAmountGBP, "GBP")}</span>
              </div>
            )} */}

            {/* You Save */}
            <div className="flex justify-between text-sm text-green-400">
              <span>You save</span>
              <span>{savePercent.toFixed(0)}%</span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-gilroy-bold text-xl pt-2 border-t border-gray-700">
              <span>Total</span>
              <span>{formatCurrency(total, "GBP")}</span>
            </div>

            {/* Free Offer Banner */}
            {sliderLoading ? (
              <div className="border rounded-3xl border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden max-sm:rounded-2xl">
                <div className="flex items-center gap-4 p-4 border-b border-white/10 max-sm:p-3 max-sm:gap-3">
                  <div className="h-4 w-4 rounded-full bg-purple-500 min-w-4 animate-pulse max-sm:h-3 max-sm:w-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded animate-pulse max-sm:h-3"></div>
                  </div>
                </div>
                <div className="p-4 max-sm:p-3">
                  <div className="grid grid-cols-3 gap-3 max-sm:gap-2">
                    {/* Loading skeleton for 3 slots */}
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="text-center">
                        <div className="h-3 bg-white/20 rounded mb-2 animate-pulse max-sm:h-2 max-sm:mb-1"></div>
                        <div className="bg-[#1e1e27] rounded-full p-2 max-sm:p-1.5">
                          <div className="h-3 bg-white/20 rounded animate-pulse max-sm:h-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-3xl border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden max-sm:rounded-2xl">
                <div className="flex items-center gap-4 p-4 border-b border-white/10 max-sm:p-3 max-sm:gap-3">
                  <div className="h-4 w-4 rounded-full bg-purple-500 min-w-4 animate-pulse max-sm:h-3 max-sm:w-3"></div>
                  <div>
                    <span className="text-sm font-medium text-white max-sm:text-xs">
                      {getDynamicMonthText(
                        (
                          sliderContent["free_offer_banner_text"] ||
                          "Free Auto-booking appointment and concierge assistance ends soon - Until {month} {year}."
                        )
                          .replace(/\s+/g, " ")
                          .trim(),
                      )}
                    </span>
                  </div>
                </div>
                <div className="p-4 max-sm:p-3">
                  <div className="grid grid-cols-3 gap-3 max-sm:gap-2">
                    {/* Slot 1 */}
                    <div className="text-center">
                      <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                        {getDynamicMonthText(sliderContent["slot1_label"], -1)}
                      </div>
                      <div className="bg-[#1e1e27] rounded-full p-2 max-sm:p-1.5">
                        <div className="text-xs text-white font-semibold max-sm:text-xs">
                          {sliderContent["slot1_status"] || "Sold out"}
                        </div>
                      </div>
                    </div>

                    {/* Slot 2 */}
                    <div className="text-center">
                      <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                        {getDynamicMonthText(sliderContent["slot2_label"], 0)}
                      </div>
                      <div className="bg-[#5a3ddb] rounded-full p-2 max-sm:p-1.5">
                        <div className="text-xs text-white font-semibold max-sm:text-xs">
                          {currentWeekReservedText}
                        </div>
                      </div>
                    </div>

                    {/* Slot 3 */}
                    <div className="text-center">
                      <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                        {getDynamicMonthText(sliderContent["slot3_label"], 1)}
                      </div>
                      <div className="bg-[#1e1e27] rounded-full p-2 max-sm:p-1.5">
                        <div className="text-xs text-white font-semibold max-sm:text-xs">
                          {sliderContent["slot3_status"]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* <h2 className="font-medium text-lg">Discount Code</h2> */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCodeLocal(e.target.value.toUpperCase())
                      }
                      placeholder="Discount Code"
                      className={`w-full border text-white placeholder-white ${
                        giftCardRedeemed || appliedDiscount
                          ? "border-green-400"
                          : couponError
                            ? "border-red-400"
                            : "border-gray-300"
                      } rounded-md p-2 text-sm ${
                        giftCardRedeemed || appliedDiscount
                          ? "outline-none ring-2 ring-green-400"
                          : couponError
                            ? "outline-none ring-2 ring-red-400"
                            : "focus:outline-none focus:ring-2 focus:ring-black"
                      }`}
                      disabled={appliedDiscount || isRedeemingGiftCard}
                    />
                  </div>
                  {!appliedDiscount ? (
                    <button
                      onClick={applyCouponCode}
                      disabled={isRedeemingGiftCard}
                      className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRedeemingGiftCard ? "Processing..." : "Apply"}
                    </button>
                  ) : (
                    <button
                      onClick={removeCoupon}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {couponError && (
                  <span className="text-sm text-red-400">{couponError}</span>
                )}

                {appliedDiscount && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                    <span>
                      ✓ {appliedDiscount.description} (
                      {appliedDiscount.percentage}% off) applied!
                    </span>
                  </div>
                )}
                {redeemedGiftCards.length > 0 && (
                  <div className="space-y-2">
                    {redeemedGiftCards.map((card) => (
                        <div
                          key={card.code}
                          className="flex items-center justify-between text-sm text-green-600 bg-green-50 p-2 rounded-md"
                        >
                          <span>
                            {formatGiftCardAppliedMessage(card.code, card.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeGiftCard(card.code)}
                            className="ml-2 text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                {isRedeemingGiftCard && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                    <span>Validating gift card code...</span>
                  </div>
                )}

                <div className="text-xs text-gray-600">
                  <p>Available discounts:</p>
                  <p>
                    • <span className="font-semibold">STUDENT10</span> - 10%
                    student discount
                  </p>
                  <p>
                    • <span className="font-semibold">GROUP20</span> - 20% group
                    discount (3 or more travellers)
                  </p>
                </div>
              </div>
            </div>

            {appliedDiscount &&
              appliedDiscount.description.toLowerCase().includes("student") && (
                <div className="space-y-3 mb-6">
                  <h2 className="font-medium text-lg">
                    Student Verification Required
                  </h2>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">📧 Email Verification</span>{" "}
                      - Please verify your student email to continue with the
                      discount
                    </div>

                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={_studentEmail}
                          onChange={(e) => _setStudentEmail(e.target.value)}
                          placeholder="Enter your student email (e.g., you@student.uni.ac.uk)"
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          disabled={studentVerified}
                        />
                      </div>
                      {!studentVerified ? (
                        <button
                          onClick={() => sendStudentVerification(_studentEmail)}
                          disabled={isSendingVerification || !_studentEmail}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isSendingVerification
                            ? "Sending..."
                            : "Verify Email"}
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-green-600 text-white text-sm rounded-md flex items-center">
                          ✓ Verified
                        </div>
                      )}
                    </div>

                    {emailError && (
                      <span className="text-sm text-red-400">{emailError}</span>
                    )}

                    {studentVerificationSent && !studentVerified && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
                        ✓ Verification email sent! Please check your inbox and
                        click the verification link.
                      </div>
                    )}

                    {studentVerified && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
                        ✓ Student email verified! You can now proceed with the
                        student discount.
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Risk Free */}
            {/* <div className="bg-green-600 text-white rounded-md p-3 text-sm text-center font-medium">
              ✓ 100% risk-free - Get your visa or full refund
            </div> */}
          </div>
        </div>
      </div>
    </ClientOnly>
  );
};

export default VisaCheckout;
