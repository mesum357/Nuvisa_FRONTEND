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
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { SiKlarna } from "react-icons/si";
import { calculatePaymentFees, formatCurrency } from "@/utils/currency";
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
  setReduxInsuranceCount,
  setTotalAmount,
  setTravelers,
} from "@/store/visaSlice";
import StripeProvider from "./StripeProvider";
import StripeElementsCheckout from "./StripeElementsCheckout";
import ExpressPaymentRequestButton from "./ExpressPaymentRequestButton";
import KlarnaForm from "./KlarnaForm";
import { useRouter } from "next/router";

const DEFAULT_REQUIRED_DOCUMENTS = {
  passport: false,
  ukVisa: false,
  photos: false,
  bankStatements: false,
  employmentProof: false,
};

const REQUIRED_DOCUMENT_FIELDS = Object.keys(DEFAULT_REQUIRED_DOCUMENTS);
const DOCUMENTS_ERROR_MESSAGE =
  "Please confirm all required documents before continuing.";

const VisaCheckout = () => {
  const dispatch = useAppDispatch();
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();
  const { content: sliderContent, loading: sliderLoading } = useSliderContent();

  // Get data from Redux store first, fallback to URL params if not available
  const visaState = useAppSelector((state) => state.visa);
  const recommendedItems = visaState.recommendedItems || {};

  const [insuranceCount, setInsuranceCount] = useState(
    visaState.insuranceCount
  );
  // Use dynamic visa fee from selected visa type if available, otherwise fallback to base fee
  const baseVisaFee =
    visaState.selectedVisaType && visaState.selectedVisaType.priceGBP
      ? Number(visaState.selectedVisaType.priceGBP)
      : visaState.selectedVisaType && visaState.selectedVisaType.price
      ? Math.round(Number(visaState.selectedVisaType.price) / 100)
      : 129;

  const selectedCountry = visaState.selectedCountry;
  const selectedVisaType = visaState.selectedVisaType;
  const visaTypeId = visaState.visaTypeId;

  const [travelers, setTravelersLocal] = useState(
    visaState.travelers !== undefined && visaState.travelers !== null
      ? Number(visaState.travelers)
      : 1
  );

  const handleTravelersChange = (newCount) => {
    if (insuranceCount > newCount) {
      setInsuranceCount(newCount);
    }
    setTravelersLocal(newCount);
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
    [visaState.requiredDocuments]
  );

  const perDayInsurancePrice = 2; // EUR per day per traveller
  const insuranceFeesPerTraveller = perDayInsurancePrice * travelDays; // EUR per traveller
  const insuranceFeesTotal = insuranceFeesPerTraveller * insuranceCount; // total EUR
  const [includeInsurance, setIncludeInsurance] = useState(
    visaState.recommendedItems?.insuranceCertificate || false
  );
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

  const { showSuccess, showError } = useToast();

  const [studentVerificationSent, setStudentVerificationSent] = useState(false);
  const [studentVerified, setStudentVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const verificationPollRef = useRef(null);
  const expressPaymentButtonRef = useRef(null);
  const [pendingCheckoutQuery, setPendingCheckoutQuery] = useState(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState({
    applePay: false,
    googlePay: false,
  });
  const hasCheckedAvailabilityRef = useRef(false);
  const selectedPaymentMethodRef = useRef(selectedPaymentMethod);

  // Inline Stripe Payment Form
  const [showInlineStripeForm, setShowInlineStripeForm] = useState(false);
  // Klarna Form
  const [showKlarnaForm, setShowKlarnaForm] = useState(false);
  const [isKlarnaSubmitting, setIsKlarnaSubmitting] = useState(false);
  const router = useRouter();

  // Auto-show payment form when payment method is selected and email is valid
  useEffect(() => {
    const shouldShowForm =
      selectedPaymentMethod === "stripe" &&
      email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (shouldShowForm && !showInlineStripeForm) {
      setShowInlineStripeForm(true);
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
  }, [selectedPaymentMethod, email, showInlineStripeForm]);

  // Update ref when selection changes
  useEffect(() => {
    selectedPaymentMethodRef.current = selectedPaymentMethod;
  }, [selectedPaymentMethod]);

  // Auto-show Klarna form when Klarna is selected
  useEffect(() => {
    if (selectedPaymentMethod === "klarna" && !showKlarnaForm) {
      setShowKlarnaForm(true);
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
    returnTo = "/visa-checkout"
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
      emailToVerify.toLowerCase().includes(domain)
    );

    if (!isEducationalEmail) {
      setEmailError(
        "Please use your educational institution email address (.edu, .ac.uk, etc.)"
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

    setTimeout(() => {
      if (verificationPollRef.current) {
        clearInterval(verificationPollRef.current);
        verificationPollRef.current = null;
      }
    }, 10 * 60 * 1000);
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
              })
            );
            setCouponCodeLocal("STUDENT10");
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (insuranceCount >= 3) {
      setAppliedInsuranceDiscount({
        code: "GROUP20",
        percentage: 20,
        description: "Group discount on insurance",
      });
      setInsuranceCouponCode("GROUP20");
      setCouponError("");
      showSuccess("Insurance group-20 applied — 20% off for 3+ insurances");
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
  }, [insuranceCount, appliedDiscount]);

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
          })
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
  const applyCouponCode = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

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

    const discount = availableDiscounts[couponCode.toUpperCase()];

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
        `This coupon requires at least ${discount.requiresMinTravellers} travellers`
      );
      return;
    }

    // Apply immediately
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
        ? Math.round(Number(selectedVisaType.price) / 100)
        : 129; // baseFee
    const currentVisaFees = currentBaseFee * travelers;
    const calculatedDiscountAmount =
      (currentVisaFees * discount.percentage) / 100;

    const discountWithAmount = {
      ...discount,
      code: couponCode.toUpperCase(),
      discountAmount: Math.round(calculatedDiscountAmount),
    };

    dispatch(setAppliedDiscount(discountWithAmount));
    setCouponError("");
    // If user manually applied GROUP20, mark it as manual (not auto-applied)
    if (couponCode.toUpperCase() === "GROUP20") {
      setGroupAutoApplied(false);
    }

    if (couponCode.toUpperCase() === "STUDENT10") {
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
  const [includeGiftCard, setIncludeGiftCard] = useState(
    visaState.recommendedItems?.giftCard || false
  );
  const [giftCardCount, setGiftCardCount] = useState(
    visaState.giftCardCount || 1
  );

  const isDocumentsValid = useMemo(() => {
    const missingDocs = REQUIRED_DOCUMENT_FIELDS.filter(
      (field) => !requiredDocuments[field]
    );

    if (missingDocs.length === 0) {
      return true;
    }

    const insuranceOnlyCheckout =
      (recommendedItems.insuranceCertificate || includeInsurance) &&
      !(recommendedItems.giftCard || includeGiftCard) &&
      missingDocs.length === REQUIRED_DOCUMENT_FIELDS.length;

    return insuranceOnlyCheckout;
  }, [requiredDocuments, recommendedItems, includeInsurance, includeGiftCard]);

  const ensureDocumentsAreConfirmed = useCallback(() => {
    if (!isDocumentsValid) {
      showError(DOCUMENTS_ERROR_MESSAGE);
      return false;
    }
    return true;
  }, [isDocumentsValid, showError]);

  const validateBeforeExpressPayment = useCallback(() => {
    if (!isDocumentsValid) {
      showError(DOCUMENTS_ERROR_MESSAGE);
      return DOCUMENTS_ERROR_MESSAGE;
    }
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
  }, [isDocumentsValid, appliedDiscount, studentVerified, showError]);

  const handleGiftCardChange = (increment) => {
    const newValue = giftCardCount + increment;
    if (newValue >= 1) {
      setGiftCardCount(newValue);

      if (newValue > 0 && !includeGiftCard) {
        setIncludeGiftCard(true);
      } else if (newValue === 0 && includeGiftCard) {
        setIncludeGiftCard(false);
      }
    }
  };

  const handleInsuranceChange = (increment) => {
    const proposed = insuranceCount + increment;
    if (proposed < 1) return;
    const cappedValue = Math.min(proposed, travelers);
    if (cappedValue !== insuranceCount) {
      setInsuranceCount(cappedValue);
      dispatch(setReduxInsuranceCount(Number(cappedValue)));
      if (cappedValue > 0 && !includeInsurance) {
        setIncludeInsurance(true);
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
    // Email is only required for credit card payment
    if (selectedPaymentMethod === "stripe") {
      if (!email) {
        setEmailError("Email is required for credit card payment");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError("Please enter a valid email for checkout");
        return;
      }
    }
    // For other payment methods, validate format if email is provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      return;
    }
    setEmailError("");
  };

  const handlePhoneBlur = () => {
    if (!phone || !phone.trim()) {
      setPhoneError("");
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(
        "Please enter a valid phone number (10 digits or 11 digits starting with 0, e.g. 0123456789)"
      );
    } else {
      setPhoneError("");
    }
  };

  // SUBTOTAL: Original prices (no discounts applied)
  const originalVisaFees = 200 * travelers; // £200 per traveler
  const originalInsuranceFees = includeInsurance ? 45 * insuranceCount : 0; // £45 per insurance
  const originalGiftCardFees = includeGiftCard ? 245 * giftCardCount : 0; // £245 per gift card
  const eVisaFees = 0; // Currently free
  const subtotal =
    originalVisaFees + originalInsuranceFees + originalGiftCardFees + eVisaFees;

  // TOTAL: Start with discounted base prices
  const baseDiscountedVisaFees = 129 * travelers; // £129 per traveler
  const baseDiscountedInsuranceFees = includeInsurance
    ? 30 * insuranceCount
    : 0; // £30 per insurance
  const baseDiscountedGiftCardFees = includeGiftCard ? 159 * giftCardCount : 0; // £159 per gift card

  // Calculate individual component discounts
  let visaDiscountPercentage = 0;
  let insuranceDiscountPercentage = 0;
  let giftCardDiscountPercentage = 0;

  // Check if any component qualifies for quantity discount (3+)
  // Note: Insurance count cannot exceed traveler count (insurance certificates are for travelers)
  const effectiveInsuranceCount = Math.min(insuranceCount, travelers);

  const travelersQualify = travelers >= 3;
  const insuranceQualify = effectiveInsuranceCount >= 3;
  const giftCardQualify = giftCardCount >= 3;

  // Apply quantity-based discounts (20% for 3+ items)
  if (travelersQualify) visaDiscountPercentage += 20;
  if (insuranceQualify) insuranceDiscountPercentage += 20;
  if (giftCardQualify) giftCardDiscountPercentage += 20;

  // Apply coupon discounts
  if (appliedDiscount) {
    console.log("Applied Discount:", appliedDiscount); // Debug log
    if (appliedDiscount.code === "GROUP20") {
      // GROUP20: Only applies if travelers >= 3 AND at least one other component >= 3
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        // Apply 20% to all components that have 3+ items
        if (travelersQualify)
          visaDiscountPercentage = Math.max(visaDiscountPercentage, 20);
        if (insuranceQualify)
          insuranceDiscountPercentage = Math.max(
            insuranceDiscountPercentage,
            20
          );
        if (giftCardQualify)
          giftCardDiscountPercentage = Math.max(giftCardDiscountPercentage, 20);
      }
    } else if (appliedDiscount.code === "STUDENT10") {
      console.log("Applying STUDENT10 discount"); // Debug log
      // STUDENT10: Adds 10% to ALL components (stacks with quantity discounts)
      visaDiscountPercentage += 10;
      if (includeInsurance) insuranceDiscountPercentage += 10;
      if (includeGiftCard) giftCardDiscountPercentage += 10;
    }
  }

  console.log("Final discount percentages:", {
    // Debug log
    visa: visaDiscountPercentage,
    insurance: insuranceDiscountPercentage,
    giftCard: giftCardDiscountPercentage,
  });

  // Calculate discount amounts
  const visaDiscountAmount =
    (baseDiscountedVisaFees * visaDiscountPercentage) / 100;
  const insuranceDiscountAmount = includeInsurance
    ? (baseDiscountedInsuranceFees * insuranceDiscountPercentage) / 100
    : 0;
  const giftCardDiscountAmount = includeGiftCard
    ? (baseDiscountedGiftCardFees * giftCardDiscountPercentage) / 100
    : 0;

  // Calculate final amounts after discounts
  const finalVisaFees = baseDiscountedVisaFees - visaDiscountAmount;
  const finalInsuranceFees =
    baseDiscountedInsuranceFees - insuranceDiscountAmount;
  const finalGiftCardFees = baseDiscountedGiftCardFees - giftCardDiscountAmount;

  const total =
    finalVisaFees + finalInsuranceFees + finalGiftCardFees + eVisaFees;

  // YOU SAVE: Subtotal minus Total
  const totalSavingsAmount = subtotal - total;

  // Calculate EUR values for display
  const subtotalEUR = calculatePaymentFees(subtotal, "EUR");
  const totalEUR = calculatePaymentFees(total, "EUR");
  const totalSavingsEUR = calculatePaymentFees(totalSavingsAmount, "EUR");

  // Individual component EUR values (final amounts after discounts)
  const visaFeesEUR = calculatePaymentFees(finalVisaFees, "EUR");
  const discountedVisaFeesEUR = visaFeesEUR;

  const baseInsuranceFeesEUR = calculatePaymentFees(finalInsuranceFees, "EUR");
  const discountedInsuranceFeesEUR = baseInsuranceFeesEUR;

  const giftCardFeesEUR = calculatePaymentFees(finalGiftCardFees, "EUR");

  // Strike-through prices (original prices)
  const travellerStrikeTotal = originalVisaFees;
  const insuranceStrikeTotal = originalInsuranceFees;
  const giftCardStrikeTotal = originalGiftCardFees;

  const travellerStrikeEUR = calculatePaymentFees(travellerStrikeTotal, "EUR");
  const insuranceStrikeEUR = calculatePaymentFees(insuranceStrikeTotal, "EUR");
  const giftCardStrikeEUR = calculatePaymentFees(giftCardStrikeTotal, "EUR");

  const eVisaFeesEUR = 0; // Currently free
  const totalAmountEUR = totalEUR;

  // GBP display values for the UI
  const travellerStrikeGBP = travellerStrikeTotal; // already in GBP units
  const visaFeesGBPDisplay = Math.round(finalVisaFees);

  // Insurance display value in EUR (after discounts)
  const displayInsuranceEUR = discountedInsuranceFeesEUR;

  // Gift card display value in EUR
  const _giftCardFeesEUR = giftCardFeesEUR;

  // Discount amount in EUR (for display purposes)
  const totalCouponDiscount =
    visaDiscountAmount + insuranceDiscountAmount + giftCardDiscountAmount;
  const discountAmountEUR = calculatePaymentFees(totalCouponDiscount, "EUR");

  // Variables for Apple Pay and other payment methods
  const visaFees = finalVisaFees;
  const insuranceFees = finalInsuranceFees;
  const giftCardFees = finalGiftCardFees;
  const currentBaseFee = 129; // Current base fee per traveler
  const totalAmount = total;

  // Check available payment methods from ExpressPaymentRequestButton
  useEffect(() => {
    const checkAvailableMethods = () => {
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

  // Validate selected payment method - only clear if method is confirmed unavailable
  // Only validate when availability changes, not when user selects (to avoid immediate deselection)
  useEffect(() => {
    if (!hasCheckedAvailabilityRef.current) return; // Don't validate until Stripe has initialized

    // Add a small delay to ensure availability state is stable
    const timeoutId = setTimeout(() => {
      const currentSelection = selectedPaymentMethodRef.current;
      if (!currentSelection) return;

      if (expressPaymentButtonRef.current?.getAvailableMethods) {
        const methods = expressPaymentButtonRef.current.getAvailableMethods();
        if (methods) {
          // Only clear if explicitly false (confirmed unavailable)
          if (currentSelection === "apple" && methods.applePay === false) {
            setSelectedPaymentMethod("");
          } else if (
            currentSelection === "google" &&
            methods.googlePay === false
          ) {
            setSelectedPaymentMethod("");
          }
        }
      }
    }, 500); // Short delay to ensure state is stable

    return () => clearTimeout(timeoutId);
  }, [availablePaymentMethods]); // Only validate when availability changes, NOT on selection

  const handleProceedToCheckout = async () => {
    localStorageGateway(
      "paymentAmount",
      localStorageEnums.SET,
      String(totalAmountEUR)
    );

    localStorageGateway(
      "insurancePaymentMetadata",
      localStorageEnums.SET,
      String(
        JSON.stringify({
          insuranceCount: includeInsurance ? insuranceCount : 0,
          insurancePaymentAmount: discountedInsuranceFeesEUR,
        })
      )
    );

    localStorageGateway(
      "insurancePayment",
      localStorageEnums.SET,
      String(discountedInsuranceFeesEUR)
    );
    localStorageGateway(
      "insuranceSelected",
      localStorageEnums.SET,
      includeInsurance ? true : false
    );
    localStorageGateway("travelers", localStorageEnums.SET, String(travelers));

    dispatch(setAmountWithoutDiscount(Number(subtotalEUR)));
    dispatch(setTotalAmount(Number(totalAmountEUR)));
    dispatch(setInsuranceFees(Number(discountedInsuranceFeesEUR)));
    dispatch(setGiftCardFees(Number(giftCardFees)));
    dispatch(setCouponCode(couponCode.trim().toUpperCase()));
    dispatch(setTravelers(Number(travelers)));

    localStorageGateway(
      "paymentWithoutInsurance",
      localStorageEnums.SET,
      String(visaFeesEUR)
    );

    localStorageGateway(
      "paymentWithDiscount",
      localStorageEnums.SET,
      String(totalEUR - discountedInsuranceFeesEUR)
    );

    if (cretingDynamicCheckout) return;

    if (!ensureDocumentsAreConfirmed()) {
      return;
    }

    // Email is only required for credit card payment
    // For other payment methods (Apple Pay, Google Pay, Klarna), email is optional
    if (selectedPaymentMethod === "stripe") {
      if (!email) {
        setEmailError("Email is required for credit card payment");
        return;
      }
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email for checkout");
        return;
      }
    } else {
      // For other payment methods, validate format if email is provided
      if (email && !validateEmail(email)) {
        setEmailError("Please enter a valid email");
        return;
      }
    }

    // Validate country is set
    const countryToUse = selectedCountry || visaState.selectedCountry || "";
    if (!countryToUse || countryToUse.trim() === "") {
      alert("Please select a destination country to continue with checkout");
      return;
    }

    if (phone && String(phone).trim() && !isValidPhone(phone)) {
      setPhoneError(
        "Please enter a valid phone number (10 digits or 11 digits starting with 0)"
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

    // For Stripe card, validate email first, then show inline payment form
    if (selectedPaymentMethod === "stripe") {
      // Email is required for credit card
      if (!email) {
        setEmailError("Email is required for credit card payment");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError("Please enter a valid email for checkout");
        return;
      }
      setEmailError("");
      setShowInlineStripeForm(true);
      // Scroll to the payment form
      setTimeout(() => {
        const formElement = document.getElementById("inline-stripe-form");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    // For Klarna, show Klarna form
    if (selectedPaymentMethod === "klarna") {
      setShowKlarnaForm(true);
      // Scroll to the Klarna form
      setTimeout(() => {
        const formElement = document.getElementById("klarna-form-container");
        if (formElement) {
          formElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    // For Apple Pay or Google Pay, trigger express payment
    if (
      selectedPaymentMethod === "apple" ||
      selectedPaymentMethod === "google"
    ) {
      const expressButtonContainer = document.querySelector(
        '[data-express-payment="true"]'
      );
      const paymentButton =
        expressButtonContainer?.querySelector("button") || null;
      if (paymentButton) {
        paymentButton.click();
        return;
      }

      const triggerResult =
        expressPaymentButtonRef.current?.triggerPaymentRequest?.();
      if (!triggerResult?.success) {
        const fallbackMessage =
          triggerResult?.message ||
          "Apple Pay / Google Pay is not available on this device. Please select another payment method.";
        showError(fallbackMessage);
      }
      return;
    }

    try {
      // For other payment methods, use hosted checkout (redirect)
      const statusResult = await handleCreateDynamicCheckoutSession({
        email: email,
        amount: String(totalAmountEUR),
        travellers: String(travelers),
        country: countryToUse, // Use validated country
        insurance: includeInsurance ? true : false, // Simple boolean conversion
        phone: phone,
        paymentMethod: selectedPaymentMethod,
        visaTypeId: visaTypeId || visaState.visaTypeId || "",
        currency: "GBP",
        noOfInsurance: insuranceCount,
        insurancePaymentAmount: discountedInsuranceFeesEUR,
        uiMode: "hosted", // Always hosted for other methods
      });

      const results = statusResult?.data;

      if (/^2\d{2}$/.test(statusResult?.status)) {
        const returnedToken = results?.data?.results?.token;
        const returnedUser = results?.data?.results?.user;

        if (returnedToken) {
          await localStorageGateway(
            "token",
            localStorageEnums.SET,
            returnedToken
          );
          await Cookies.set("token", returnedToken);
          dispatch(setAuthState(true));
        }

        if (returnedUser) {
          await Cookies.set("user", JSON.stringify(returnedUser));
          await localStorageGateway(
            "user",
            localStorageEnums.SET,
            JSON.stringify(returnedUser)
          );

          if (returnedUser.id) {
            dispatch(setAuthId(returnedUser.id));
          }
        }
        dispatch(setAmountWithoutDiscount(Number(visaFeesEUR)));

        await localStorageGateway("userEmail", localStorageEnums.SET, email);
      }

      // For non-Stripe methods, always redirect to hosted checkout
      const redirectUrl =
        results?.data?.results?.url || results?.results?.url || results?.url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error("No redirect URL returned from checkout session");
        alert("Failed to initialize payment. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to process payment. Please try again.");
    }
  };

  // Initialize embedded Stripe checkout

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
          setStudentVerificationSent(false);

          // Pre-fill user email field if it's empty so user sees which address was verified
          try {
            if (!_studentEmail && payload.email)
              _setStudentEmail(payload.email);
          } catch {
            /* ignore */
          }

          // Auto-apply STUDENT10 if not already applied
          if (
            !appliedDiscount ||
            (appliedDiscount && appliedDiscount.code !== "STUDENT10")
          ) {
            dispatch(
              setAppliedDiscount({
                code: "STUDENT10",
                percentage: 10,
                description: "Student discount",
              })
            );
            setCouponCodeLocal("STUDENT10");
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
                  className="object-contain"
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
                  <span className="flex items-center gap-1">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
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
                  <ExpressPaymentRequestButton
                    ref={expressPaymentButtonRef}
                    amount={totalAmount}
                    currency="GBP"
                    email={email}
                    travellers={travelers}
                    country={selectedCountry || visaState.selectedCountry || ""}
                    includeInsurance={includeInsurance}
                    insuranceCount={insuranceCount}
                    insurancePaymentAmount={discountedInsuranceFeesEUR}
                    visaTypeId={visaTypeId || visaState.visaTypeId || ""}
                    paymentType="application_creation"
                    onBeforePayment={validateBeforeExpressPayment}
                  />
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
                    Email {selectedPaymentMethod === "stripe" ? "*" : ""}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  or pay with card
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-medium text-lg">Payment Method</h2>
              <div className="space-y-2">
                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    selectedPaymentMethod === "stripe"
                      ? "border-black bg-gray-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod("stripe")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={selectedPaymentMethod === "stripe"}
                        onChange={(e) =>
                          setSelectedPaymentMethod(e.target.value)
                        }
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Credit card</span>
                    </div>

                    {/* Payment Method Icons */}
                    <div className="flex items-center space-x-1">
                      {/* Visa */}
                      <Image
                        src="/image/visa.sxIq5Dot.svg"
                        width={45}
                        height={45}
                        alt="Visa"
                      />
                      <Image
                        src="/image/mastercard.1c4_lyMp (1).svg"
                        width={45}
                        height={45}
                        alt="Visa"
                      />
                      <Image
                        src="/image/Amex Card.svg"
                        width={55}
                        height={55}
                        alt="Visa"
                      />
                      <Image
                        src="/image/DGN_AcceptanceMark_FC_Hrz_RGB (1).jpg"
                        width={40}
                        height={40}
                        alt="Visa"
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

                  {selectedPaymentMethod === "stripe" &&
                    !showInlineStripeForm &&
                    email &&
                    validateEmail(email) && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-600 mb-3">
                          Click "Continue to Payment" below to enter your card
                          details
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <span>Secure payment powered by Stripe</span>
                        </div>
                      </div>
                    )}

                  {/* Inline Stripe Payment Form */}
                  {selectedPaymentMethod === "stripe" &&
                    showInlineStripeForm && (
                      <div
                        id="inline-stripe-form"
                        className="mt-6 p-6 bg-white border-2 border-[#7350FF] rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Enter Card Details
                          </h3>
                          <button
                            onClick={() => setShowInlineStripeForm(false)}
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
                            email={email}
                            amount={totalAmountEUR}
                            travelers={travelers}
                            country={
                              selectedCountry || visaState.selectedCountry || ""
                            }
                            insurance={includeInsurance}
                            visaTypeId={
                              visaTypeId || visaState.visaTypeId || ""
                            }
                            currency="GBP"
                            paymentType="application_creation"
                            noOfInsurance={insuranceCount}
                            insurancePaymentAmount={discountedInsuranceFeesEUR}
                            hideSubmitButton={true}
                          />
                        </StripeProvider>
                      </div>
                    )}
                </div>

                <div
                  className={`border rounded-md p-3 cursor-pointer ${
                    selectedPaymentMethod === "klarna"
                      ? "border-black bg-gray-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod("klarna")}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="payment"
                      value="klarna"
                      checked={selectedPaymentMethod === "klarna"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="h-4 w-4"
                    />
                    <SiKlarna className="text-lg text-pink-500" />
                    <span className="text-sm font-medium">Klarna Pay</span>
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
                          onClick={() => setShowKlarnaForm(false)}
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
                        amount={totalAmountEUR}
                        travelers={travelers}
                        country={
                          selectedCountry || visaState.selectedCountry || ""
                        }
                        insurance={includeInsurance}
                        visaTypeId={visaTypeId || visaState.visaTypeId || ""}
                        insuranceCount={insuranceCount}
                        insurancePaymentAmount={discountedInsuranceFeesEUR}
                        paymentType="application_creation"
                        applicationId={undefined}
                        travelerIndex={undefined}
                        onCreateCheckoutSession={
                          handleCreateDynamicCheckoutSession
                        }
                        onSubmittingChange={setIsKlarnaSubmitting}
                        onSuccess={(data) => {
                          console.log("Klarna form submitted:", data);
                        }}
                        onError={(error) => {
                          console.error("Klarna form error:", error);
                          showSuccess(
                            "Error creating Klarna checkout. Please try again."
                          );
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Apple Pay Option - Only show if available (or in development mode) */}
                {(availablePaymentMethods.applePay ||
                  process.env.NODE_ENV === "development" ||
                  process.env.NEXT_PUBLIC_NODE_ENV === "development") && (
                  <div
                    className={`border rounded-md p-3 cursor-pointer ${
                      selectedPaymentMethod === "apple"
                        ? "border-black bg-gray-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("apple")}
                  >
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
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-black"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      <span className="text-sm font-medium">Apple Pay</span>
                    </div>
                  </div>
                )}

                {/* Google Pay Option - Only show if available (or in development mode) */}
                {(availablePaymentMethods.googlePay ||
                  process.env.NODE_ENV === "development" ||
                  process.env.NEXT_PUBLIC_NODE_ENV === "development") && (
                  <div
                    className={`border rounded-md p-3 cursor-pointer ${
                      selectedPaymentMethod === "google"
                        ? "border-black bg-gray-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("google")}
                  >
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
                      <svg
                        width="20"
                        height="20"
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
                      <span className="text-sm font-medium">Google Pay</span>
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
                onClick={() => {
                  // If card form is shown, trigger form submission
                  if (
                    selectedPaymentMethod === "stripe" &&
                    showInlineStripeForm
                  ) {
                    const form = document.getElementById("stripe-payment-form");
                    if (form) {
                      form.requestSubmit();
                    }
                  } else if (
                    selectedPaymentMethod === "klarna" &&
                    showKlarnaForm
                  ) {
                    // Trigger Klarna form submission
                    const klarnaForm = document.getElementById(
                      "klarna-payment-form"
                    );
                    if (klarnaForm) {
                      klarnaForm.requestSubmit();
                    }
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
                    <span>
                      Pay {formatCurrency(totalAmountEUR, "EUR")} with Klarna
                    </span>
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
                  `Pay ${formatCurrency(totalAmountEUR, "EUR")}`
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

          <div className="bg-black text-white p-6 md:p-10 md:pr-10 xl:pr-40 space-y-4">
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
                    setTravelersLocal(2);
                  } else if (!e.target.checked && travelers > 1) {
                    setTravelersLocal(1);
                  }
                }}
              />
              <label htmlFor="addTravellers" className="text-sm">
                Add additional travellers
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaUser className="text-lg" />
                <span className="text-sm">Travellers</span>
              </div>

              <QtyInput
                onIncrement={(val) => handleTravelersChange(val)}
                onDecrement={(val) => handleTravelersChange(val)}
                value={travelers}
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <span className="line-through">
                {formatCurrency(travellerStrikeGBP, "GBP")}
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(visaFeesGBPDisplay, "GBP")}
              </span>
            </div>

            {/* Insurance */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  setIncludeInsurance(!includeInsurance);
                  setInsuranceCount(1);
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
                  min={1}
                />
                <div className="flex item-center gap-2">
                  <span className="line-through">
                    {formatCurrency(insuranceStrikeEUR, "EUR")}
                  </span>
                  <span className={`text-sm `}>
                    {includeInsurance
                      ? formatCurrency(displayInsuranceEUR, "EUR")
                      : formatCurrency(0, "EUR")}
                  </span>
                </div>
              </div>
            </div>
            {includeInsurance && (
              <p className="text-xs text-gray-400">
                (Included for {insuranceCount} traveler
                {travelers > 1 ? "s" : ""})
              </p>
            )}

            {/* E visa card */}
            {/* Digital Gift Card */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  setIncludeGiftCard(!includeGiftCard);
                  if (!includeGiftCard) {
                    setGiftCardCount(1);
                  }
                }}
              >
                <input
                  type="checkbox"
                  id="giftCard"
                  checked={includeGiftCard}
                  onChange={(e) => {
                    setIncludeGiftCard(e.target.checked);
                    if (e.target.checked && giftCardCount === 0) {
                      setGiftCardCount(1);
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
                  min={1}
                />
                <div className="flex items-center gap-2">
                  {includeGiftCard && (
                    <span className="line-through">
                      {formatCurrency(giftCardStrikeEUR, "EUR")}
                    </span>
                  )}
                  <span className="text-sm">
                    {includeGiftCard
                      ? formatCurrency(_giftCardFeesEUR, "EUR")
                      : formatCurrency(0, "EUR")}
                  </span>
                </div>
              </div>
            </div>
            {includeGiftCard && (
              <p className="text-xs text-gray-400">
                Digital gift card for {giftCardCount}
                {giftCardCount > 1 ? "s" : ""}
              </p>
            )}

            {/* Subtotal */}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalEUR, "EUR")}</span>
            </div>

            {/* Discount */}
            {/* {appliedDiscount && (
              <div className="flex justify-between text-sm text-green-400">
                <span>
                  {appliedDiscount.description} (-{appliedDiscount.percentage}%)
                </span>
                <span>-{formatCurrency(discountAmountEUR, "EUR")}</span>
              </div>
            )} */}

            {/* You Save */}
            <div className="flex justify-between text-sm text-green-400">
              <span>You save</span>
              <span>{formatCurrency(totalSavingsEUR, "EUR")}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-gilroy-bold text-xl pt-2 border-t border-gray-700">
              <span>Total</span>
              <span>{formatCurrency(totalEUR, "EUR")} EUR</span>
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
                      {sliderContent["free_offer_banner_text"] ||
                        "Free Auto-booking appointment and concierge assistance ends soon - Until Jan 2026."}
                    </span>
                  </div>
                </div>
                <div className="p-4 max-sm:p-3">
                  <div className="grid grid-cols-3 gap-3 max-sm:gap-2">
                    {/* Slot 1 */}
                    <div className="text-center">
                      <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                        {sliderContent["slot1_label"] || "Oct slots"}
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
                        {sliderContent["slot2_label"] || "Nov slots"}
                      </div>
                      <div className="bg-[#5a3ddb] rounded-full p-2 max-sm:p-1.5">
                        <div className="text-xs text-white font-semibold max-sm:text-xs">
                          {sliderContent["slot2_status"] || "< 10 left!"}
                        </div>
                      </div>
                    </div>

                    {/* Slot 3 */}
                    <div className="text-center">
                      <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                        {sliderContent["slot3_label"] || "Dec slots"}
                      </div>
                      <div className="bg-[#1e1e27] rounded-full p-2 max-sm:p-1.5">
                        <div className="text-xs text-white font-semibold max-sm:text-xs">
                          {sliderContent["slot3_status"] || "45% reserved"}
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
                        couponError ? "border-red-400" : "border-gray-300"
                      } rounded-md p-2 text-sm ${
                        couponError
                          ? "outline-none ring-2 ring-red-400"
                          : "focus:outline-none focus:ring-2 focus:ring-black"
                      }`}
                      disabled={appliedDiscount}
                    />
                  </div>
                  {!appliedDiscount ? (
                    <button
                      onClick={applyCouponCode}
                      className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-900 transition-colors"
                    >
                      Apply
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
