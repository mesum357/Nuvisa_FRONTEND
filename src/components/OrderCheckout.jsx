"use client";

import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FaUser, FaShieldAlt, FaApple, FaGoogle } from "react-icons/fa";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { SiKlarna } from "react-icons/si";
import { calculatePaymentFees, formatCurrency } from "@/utils/currency";
import ClientOnly from "./ClientOnly";
import { useToast } from "@/contexts/ToastContext";
import QtyInput from "./QtyInput";
import {
  setAmountWithoutDiscount,
  setCouponCode,
  setGiftCardFees,
  setInsuranceFees,
  setReduxInsuranceCount,
  setTotalAmount,
  setTravelers,
} from "@/store/visaSlice";

const VisaCheckout = () => {
  const dispatch = useAppDispatch();
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();

  // Get data from Redux store first, fallback to URL params if not available
  const visaState = useAppSelector((state) => state.visa);

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
  let travelDays = 1;
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
    travelDays = 1;
  }
  const userEmail = localStorageGateway("userEmail", localStorageEnums.GET);

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
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");
  const [emailNewsOffers, setEmailNewsOffers] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [couponCode, setCouponCodeLocal] = useState(visaState.couponCode || "");
  const [insuranceCouponCode, setInsuranceCouponCode] = useState();
  const [appliedDiscount, setAppliedDiscount] = useState(
    visaState.appliedDiscount || null
  );
  const [appliedInsuranceDiscount, setAppliedInsuranceDiscount] =
    useState(null);
  const [insuranceCouponError, setInsuranceCouponError] = useState("");
  const [couponError, setCouponError] = useState("");

  const { showSuccess } = useToast();

  const [requiredDocuments, setRequiredDocuments] = useState({
    passport: false,
    ukVisa: false,
    photos: false,
    bankStatements: false,
    employmentProof: false,
  });
  const [validationErrors, setValidationErrors] = useState(new Set());

  const [studentVerificationSent, setStudentVerificationSent] = useState(false);
  const [studentVerified, setStudentVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const verificationPollRef = useRef(null);
  const [pendingCheckoutQuery, setPendingCheckoutQuery] = useState(null);

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
          } catch { }

          if (
            pendingCheckoutQuery &&
            (selectedPaymentMethod === "apple" ||
              selectedPaymentMethod === "google")
          ) {
            window.location.href = `/payment/${selectedPaymentMethod}`;
          } else if (pendingCheckoutQuery) {
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
          } catch { }

          if (
            pendingCheckoutQuery &&
            (selectedPaymentMethod === "apple" ||
              selectedPaymentMethod === "google")
          ) {
            window.location.href = `/payment/${selectedPaymentMethod}`;
          } else if (pendingCheckoutQuery) {
            window.location.href = `/visa-checkout`;
          }
        }
      } catch { }
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
            setAppliedDiscount({
              code: "STUDENT10",
              percentage: 10,
              description: "Student discount",
            });
            setCouponCodeLocal("STUDENT10");
          }
        }
      }
    } catch { }
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
        setAppliedDiscount(null);
        setCouponCodeLocal("");
        setCouponError("");
      }
    } else {
      if (
        (!appliedDiscount ||
          (appliedDiscount && appliedDiscount.code !== "GROUP20")) &&
        !groupAutoApplied
      ) {
        setAppliedDiscount({
          code: "GROUP20",
          percentage: 20,
          description: "Group discount (3+ travellers)",
        });
        setCouponCodeLocal("GROUP20");
      }
    }
  }, [travelers]);

  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [useShippingAddress, setUseShippingAddress] = useState(false);

  // Billing address state
  const [billingCountry, setBillingCountry] = useState("United Kingdom");
  const [billingFirstName, setBillingFirstName] = useState("");
  const [billingLastName, setBillingLastName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingApartment, setBillingApartment] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingPhoneError, setBillingPhoneError] = useState("");

  const [groupAutoApplied, setGroupAutoApplied] = useState(false);
  const [_showStudentModal, _setShowStudentModal] = useState(false);
  const [_studentEmail, _setStudentEmail] = useState("");
  const [_studentOtp, _setStudentOtp] = useState("");
  const [_isVerifyingOtp, _setIsVerifyingOtp] = useState(false);

  // Card validation errors
  const [cardErrors, setCardErrors] = useState({});

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
      discountAmount: Math.round(calculatedDiscountAmount),
    };

    setAppliedDiscount(discountWithAmount);
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
    setAppliedDiscount(null);
    setCouponError("");
  };

  // Card validation and formatting functions
  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpirationDate = (value) => {
    // Remove all non-digit characters
    const v = value.replace(/\D/g, "");
    // Add slash after 2 digits
    if (v.length >= 2) {
      return v.substring(0, 2) + " / " + v.substring(2, 4);
    }
    return v;
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

  const validateCardDetails = () => {
    const errors = {};

    if (!cardNumber.replace(/\s/g, "")) {
      errors.cardNumber = "Card number is required";
    } else if (cardNumber.replace(/\s/g, "").length < 13) {
      errors.cardNumber = "Card number is invalid";
    }

    if (!expirationDate.replace(/\s|\//g, "")) {
      errors.expirationDate = "Expiration date is required";
    } else if (expirationDate.replace(/\s|\//g, "").length !== 4) {
      errors.expirationDate = "Expiration date is invalid";
    }

    if (!securityCode) {
      errors.securityCode = "Security code is required";
    } else if (securityCode.length < 3) {
      errors.securityCode = "Security code is invalid";
    }

    if (!nameOnCard.trim()) {
      errors.nameOnCard = "Name on card is required";
    }

    // Billing address validation (only if not using shipping address)
    if (!useShippingAddress) {
      if (!billingFirstName.trim()) {
        errors.billingFirstName = "First name is required";
      }
      if (!billingLastName.trim()) {
        errors.billingLastName = "Last name is required";
      }
      if (!billingAddress.trim()) {
        errors.billingAddress = "Address is required";
      }
      if (!billingCity.trim()) {
        errors.billingCity = "City is required";
      }
      if (billingCountry === "United Kingdom") {
        if (!billingPostcode.trim()) {
          errors.billingPostcode = "Postcode is required";
        } else if (!isValidUKPostcode(billingPostcode)) {
          errors.billingPostcode =
            "Please enter a valid UK postcode (e.g. SW1A 1AA)";
        }
      }
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailBlur = () => {
    if (!email) {
      setEmailError("Email is required for checkout");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email for checkout");
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

  const handlePostcodeBlur = () => {
    if (!postcode) {
      setPostcodeError("Postcode is required for checkout");
      return;
    }
    if (!isValidUKPostcode(postcode)) {
      setPostcodeError("Please enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }
    setPostcodeError("");
  };

  const handleCardFieldBlur = () => {
    validateCardDetails();
  };

  const handleBillingFieldBlur = () => {
    validateCardDetails();
  };

  const expectedVisaFeesTotal = baseVisaFee * travelers;
  let visaFeesTotal = 0;
  if (
    Number.isFinite(Number(visaState.visaFees)) &&
    Number(visaState.visaFees) === expectedVisaFeesTotal
  ) {
    visaFeesTotal = Number(visaState.visaFees);
  } else if (travelers === 0) {
    visaFeesTotal = 0;
  } else {
    visaFeesTotal = expectedVisaFeesTotal;
  }

  const insuranceFees = includeInsurance ? insuranceFeesTotal : 0;
  const giftCardFees = Number(visaState.giftCardFees) || 0;
  const insuranceWithDiscount =
    appliedInsuranceDiscount && includeInsurance
      ? insuranceFees -
      (insuranceFees * appliedInsuranceDiscount.percentage) / 100
      : insuranceFees;
  const visaFeesWithDiscount = appliedDiscount
    ? visaFeesTotal - (visaFeesTotal * appliedDiscount.percentage) / 100
    : visaFeesTotal;
  const eVisaFees = 0; // Currently free
  const subtotal = visaFeesTotal + insuranceFees + giftCardFees + eVisaFees;
  const total =
    visaFeesWithDiscount + insuranceWithDiscount + giftCardFees + eVisaFees;
  const insuranceDiscountAmount =
    appliedInsuranceDiscount && includeInsurance
      ? (insuranceFees * appliedInsuranceDiscount.percentage) / 100
      : 0;
  const discountAmount =
    insuranceDiscountAmount +
    (appliedDiscount ? (visaFeesTotal * appliedDiscount.percentage) / 100 : 0);

  const discountedSubtotal = subtotal - discountAmount;

  // Calculate original price and savings (for display purposes)
  const originalPrice = visaState.insuranceOnly ? 0 : baseVisaFee * travelers;
  const savings = originalPrice - visaFeesTotal; // Any savings from discounts

  // Calculate dynamic values based on user selections in EUR
  const visaFeesEUR = calculatePaymentFees(visaFeesTotal, "EUR");
  const discountedVisaFeesEUR =
    visaFeesEUR - (visaFeesEUR * appliedDiscount?.percentage) / 100;

  // Calculate discounted insurance fees
  const baseInsuranceFeesEUR = includeInsurance
    ? appliedInsuranceDiscount
      ? calculatePaymentFees(insuranceFees, "EUR") -
      (calculatePaymentFees(insuranceFees, "EUR") *
        appliedInsuranceDiscount.percentage) /
      100
      : calculatePaymentFees(insuranceFees, "EUR")
    : 0;
  const discountedInsuranceFeesEUR =
    appliedInsuranceDiscount && includeInsurance
      ? baseInsuranceFeesEUR -
      (baseInsuranceFeesEUR * appliedInsuranceDiscount.percentage) / 100
      : baseInsuranceFeesEUR;

  const _giftCardFeesEUR = calculatePaymentFees(giftCardFees, "EUR");
  const eVisaFeesEUR = 0; // Currently free
  const subtotalEUR = calculatePaymentFees(subtotal, "EUR");

  const discountAmountEUR = calculatePaymentFees(discountAmount, "EUR");
  const discountedSubtotalEUR = calculatePaymentFees(discountedSubtotal, "EUR");

  const _originalPriceEUR = calculatePaymentFees(originalPrice, "EUR");
  const _savingsEUR = calculatePaymentFees(savings, "EUR");
  const totalAmountEUR = discountedSubtotalEUR;

  const handleProceedToCheckout = async () => {
    await localStorageGateway(
      "paymentAmount",
      localStorageEnums.SET,
      String(totalAmountEUR)
    );

    await localStorageGateway(
      "insurancePaymentMetadata",
      localStorageEnums.SET,
      String(
        JSON.stringify({
          insuranceCount: includeInsurance ? insuranceCount : 0,
          insurancePaymentAmount: discountedInsuranceFeesEUR,
        })
      )
    );

    await localStorageGateway(
      "insurancePayment",
      localStorageEnums.SET,
      String(discountedInsuranceFeesEUR)
    );
    await localStorageGateway(
      "insuranceSelected",
      localStorageEnums.SET,
      includeInsurance ? true : false
    );
    await localStorageGateway(
      "travelers",
      localStorageEnums.SET,
      String(travelers)
    );

    dispatch(setAmountWithoutDiscount(Number(subtotalEUR)));
    dispatch(setTotalAmount(Number(totalAmountEUR)));
    dispatch(setInsuranceFees(Number(discountedInsuranceFeesEUR)));
    dispatch(setGiftCardFees(Number(giftCardFees)));
    dispatch(setCouponCode(couponCode.trim().toUpperCase()));
    dispatch(setTravelers(Number(travelers)));

    await localStorageGateway(
      "paymentWithoutInsurance",
      localStorageEnums.SET,
      String(visaFeesEUR)
    );

    await localStorageGateway(
      "paymentWithDiscount",
      localStorageEnums.SET,
      String(discountedSubtotalEUR - insuranceFees)
    );

    if (cretingDynamicCheckout) return;

    if (!email) {
      setEmailError("Email is required for checkout");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email for checkout");
      return;
    }

    if (!postcode) {
      setPostcodeError("Postcode is required for checkout");
      return;
    }

    if (postcode && !isValidUKPostcode(postcode)) {
      setPostcodeError("Please enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }

    if (phone && String(phone).trim() && !isValidPhone(phone)) {
      setPhoneError(
        "Please enter a valid phone number (10 digits or 11 digits starting with 0)"
      );
      return;
    }

    if (
      billingPhone &&
      String(billingPhone).trim() &&
      !isValidPhone(billingPhone)
    ) {
      setBillingPhoneError(
        "Please enter a valid phone number (10 digits or 11 digits starting with 0)"
      );
      return;
    }

    // Validate card details if stripe payment is selected
    if (selectedPaymentMethod === "stripe") {
      const isCardValid = validateCardDetails();
      if (!isCardValid) {
        return;
      }
    }

    setEmailError("");
    setPostcodeError("");

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

    const statusResult = await handleCreateDynamicCheckoutSession({
      email: email,
      amount: String(totalAmountEUR),
      travellers: String(travelers),
      country: String(selectedCountry || ""),
      insurance: includeInsurance ? true : false, // Simple boolean conversion
      phone: phone,
      postcode: postcode,
      paymentMethod: selectedPaymentMethod,
      visaTypeId: visaTypeId || visaState.visaTypeId || "",
      currency: "EUR",
      noOfInsurance: insuranceCount,
      insurancePaymentAmount: discountedInsuranceFeesEUR,
    });

    const results = statusResult.data;

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

    const redirectUrl = results.data.results.url;
    if (redirectUrl) {
      window.location.href = redirectUrl; // Redirect user to stripe checkout
    }
  };

  const handleInsuranceChange = (increment) => {
    const newValue = insuranceCount + increment;
    if (newValue >= 1 && newValue <= travelers) {
      setInsuranceCount(newValue);
      dispatch(setReduxInsuranceCount(Number(newValue)));

      if (newValue > 0 && !includeInsurance) {
        setIncludeInsurance(true);
      }
    }
  };

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
            setAppliedDiscount({
              code: "STUDENT10",
              percentage: 10,
              description: "Student discount",
            });
            setCouponCodeLocal("STUDENT10");
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);


  // Apple Pay click handler
  const handleApplePayClick = async () => {
    // Validate required documents for express payment
    // if (!validateRequiredDocuments()) return;

    // Check if student discount requires verification
    if (
      appliedDiscount &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified
    ) {
      if (!userEmail || !validateEmail(userEmail)) {
        setEmailError(
          "Please enter a valid student email before using Apple Pay"
        );
        return;
      }

      const verificationSent = await sendStudentVerification(
        userEmail,
        "/visa-checkout"
      );
      if (verificationSent) {
        // Store pending payment data to process after verification
        setPendingCheckoutQuery("proceed"); // Simple flag
        setSelectedPaymentMethod("apple");
        // The polling will handle redirecting to payment once verified
        return;
      } else {
        return; // Error already set by sendStudentVerification
      }
    }

    // Calculate payment amount with all components
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
          ? Math.round(Number(selectedVisaType.price) / 100)
          : baseVisaFee;

    let visaFees = currentBaseFee * travelers;

    // Apply discount if available
    if (appliedDiscount) {
      const discountAmount = (visaFees * appliedDiscount.percentage) / 100;
      visaFees = visaFees - discountAmount;
    }

    const insuranceFees = includeInsurance
      ? perDayInsurancePrice * travelDays * insuranceCount
      : 0;
    const giftCardFees = Number(visaState.giftCardFees) || 0;

    const totalAmount = Math.round(visaFees + insuranceFees + giftCardFees);

    // Check if Apple Pay is supported at all
    if (!window.ApplePaySession) {
      showAlert(
        "Apple Pay",
        "Apple Pay is not supported on this browser. Please use Safari on a supported Apple device."
      );
      return;
    }

    // Check device capability first
    const canMakePayments = ApplePaySession.canMakePayments();
    if (!canMakePayments) {
      showAlert(
        "Apple Pay",
        "Apple Pay is not available on this device. Please ensure you have Apple Pay set up with a valid payment method."
      );
      return;
    }

    // For development/testing on localhost or non-HTTPS
    if (
      window.location.hostname === "localhost" ||
      window.location.protocol !== "https:"
    ) {
      // Simulate successful Apple Pay flow using system confirm
      const confirmed = confirm(
        `Process Apple Pay payment of £${totalAmount}?\n\nThis will redirect to payment processing page.`
      );
      if (confirmed) {
        setSelectedPaymentMethod("apple");
        await handleProceedToCheckout();
      }
      return;
    }

    try {
      // Build line items for detailed breakdown
      const lineItems = [
        {
          label: `Visa Processing Fee (${travelers} traveller${travelers > 1 ? "s" : ""})`,
          amount: Math.round(visaFees).toString(),
          type: "final",
        },
      ];

      if (includeInsurance) {
        lineItems.push({
          label: `Insurance Certificate (${insuranceCount} traveller${insuranceCount > 1 ? "s" : ""})`,
          amount: insuranceFees.toString(),
          type: "final",
        });
      }

      if (giftCardFees > 0) {
        lineItems.push({
          label: `Gift Card`,
          amount: giftCardFees.toString(),
          type: "final",
        });
      }

      if (appliedDiscount) {
        lineItems.push({
          label: `Discount (${appliedDiscount.percentage}% off)`,
          amount: `-${Math.round((currentBaseFee * travelers * appliedDiscount.percentage) / 100)}`,
          type: "final",
        });
      }

      const request = {
        countryCode: "GB",
        currencyCode: "GBP",
        supportedNetworks: ["visa", "masterCard", "amex", "discover"],
        merchantCapabilities: ["supports3DS"],
        total: {
          label: "NUvisa - Visa Application",
          amount: totalAmount.toString(),
          type: "final",
        },
        lineItems: lineItems,
      };

      const session = new ApplePaySession(3, request);

      // Flag used to avoid logging a cancellation when we are intentionally redirecting
      let suppressCancel = false;
      let redirecting = false;

      // Override oncancel immediately to prevent any spurious logs
      session.oncancel = () => {
        if (!suppressCancel && !redirecting) {
        }
      };

      session.onvalidatemerchant = async (event) => {
        try {
          // Mark that we're redirecting to prevent cancel logs
          suppressCancel = true;
          redirecting = true;

          setSelectedPaymentMethod("apple-pay");
          await handleProceedToCheckout();
        } catch (error) {
          console.error("Apple Pay merchant validation failed:", error);
          suppressCancel = true;
          redirecting = true;
          try {
            showAlert(
              "Apple Pay",
              "Apple Pay setup required. Redirecting to standard checkout..."
            );
          } catch { }

          setSelectedPaymentMethod("stripe");
          await handleProceedToCheckout();
        }
      };

      session.onpaymentauthorized = (event) => {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        try {
          const stored = localStorage.getItem("paymentMetadata");
          const pm = stored ? JSON.parse(stored) : null;
          const appId = pm?.applicationId || null;
          if (appId) {
            window.location.href = `/application-step?application_id=${encodeURIComponent(appId)}`;
          } else {
            window.location.href = "/payment-success";
          }
        } catch {
          console.error("Error parsing paymentMetadata for redirect:");
          window.location.href = "/payment-success";
        }
      };

      session.oncancel = () => {
        if (!suppressCancel) {
        } else {
          // quietly ignore cancellation caused by our intentional redirect fallback
        }
      };

      session.onerror = (error) => {
        console.error("Apple Pay session error:", error);
        showAlert(
          "Apple Pay",
          "Apple Pay error occurred. Please try a different payment method."
        );
      };

      session.begin();
    } catch (error) {
      console.error("Apple Pay initialization error:", error);
      showAlert(
        "Apple Pay",
        "Apple Pay is not available. Please try a different payment method."
      );
    }
  };

  // Google Pay click handler
  const handleGooglePayClick = async () => {
    // Validate required documents for express payment
    // if (!validateRequiredDocuments()) return;

    // Check if student discount requires verification
    if (
      appliedDiscount &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified
    ) {
      if (!userEmail || !validateEmail(userEmail)) {
        setEmailError(
          "Please enter a valid student email before using Google Pay"
        );
        return;
      }

      const verificationSent = await sendStudentVerification(
        userEmail,
        `/payment/${selectedPaymentMethod}`
      );
      if (verificationSent) {
        // Store pending payment data to process after verification
        setPendingCheckoutQuery("proceed"); // Simple flag
        setSelectedPaymentMethod("google");
        // The polling will handle redirecting to payment once verified
        return;
      } else {
        return; // Error already set by sendStudentVerification
      }
    }

    // Calculate payment amount with all components
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
          ? Math.round(Number(selectedVisaType.price) / 100)
          : baseVisaFee;

    let visaFees = currentBaseFee * travelers;

    // Apply discount if available
    if (appliedDiscount) {
      const discountAmount = (visaFees * appliedDiscount.percentage) / 100;
      visaFees = visaFees - discountAmount;
    }

    const insuranceFees = includeInsurance
      ? perDayInsurancePrice * travelDays * insuranceCount
      : 0;
    const giftCardFees = Number(visaState.giftCardFees) || 0;

    const totalAmount = Math.round(visaFees + insuranceFees + giftCardFees);

    // Check if Google Pay is available
    if (!window.google || !window.google.payments) {
      showAlert(
        "Google Pay",
        "Google Pay is not available. Please refresh the page and try again."
      );
      return;
    }

    try {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: "TEST", // Change to 'PRODUCTION' for live
        paymentDataCallbacks: {
          onPaymentAuthorized: (paymentData) => {
            return new Promise((resolve) => {
              // Process payment data

              // Here you would normally send the payment data to your server
              // For now, we'll simulate success
              resolve({ transactionState: "SUCCESS" });

              // Redirect to success page or back to existing application if present
              setTimeout(() => {
                try {
                  const stored = localStorage.getItem("paymentMetadata");
                  const pm = stored ? JSON.parse(stored) : null;
                  const appId = pm?.applicationId || null;
                  if (appId) {
                    window.location.href = `/application-step?application_id=${encodeURIComponent(appId)}`;
                  } else {
                    window.location.href = "/payment-success";
                  }
                } catch {
                  console.error("Error parsing paymentMetadata for redirect:");
                  window.location.href = "/payment-success";
                }
              }, 1000);
            });
          },
        },
      });

      // Check if Google Pay is ready
      const isReadyToPayRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX"],
            },
          },
        ],
      };

      const isReadyToPay = await paymentsClient.isReadyToPay(isReadyToPayRequest);

      if (!isReadyToPay.result) {
        showAlert(
          "Google Pay",
          "Google Pay is not available on this device or no payment methods are set up."
        );
        return;
      }

      // Build display items for detailed breakdown
      const displayItems = [
        {
          label: `Visa Processing Fee (${travelers} traveller${travelers > 1 ? "s" : ""})`,
          type: "LINE_ITEM",
          price: Math.round(visaFees).toString(),
        },
      ];

      if (includeInsurance) {
        displayItems.push({
          label: `Insurance Certificate (${insuranceCount} traveller${insuranceCount > 1 ? "s" : ""})`,
          type: "LINE_ITEM",
          price: insuranceFees.toString(),
        });
      }

      if (giftCardFees > 0) {
        displayItems.push({
          label: `Gift Card`,
          type: "LINE_ITEM",
          price: giftCardFees.toString(),
        });
      }

      if (appliedDiscount) {
        displayItems.push({
          label: `Discount (${appliedDiscount.percentage}% off)`,
          type: "LINE_ITEM",
          price: `-${Math.round((currentBaseFee * travelers * appliedDiscount.percentage) / 100)}`,
        });
      }

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["MASTERCARD", "VISA", "AMEX"],
              billingAddressRequired: true,
              billingAddressParameters: {
                format: "FULL",
                phoneNumberRequired: true,
              },
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "stripe", // Use your actual payment gateway
                "stripe:version": "2020-08-27",
                "stripe:publishableKey": "pk_test_...", // Use your actual publishable key
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: "BCR2DN4TXZQJHQBF", // Use your actual Google Pay merchant ID
          merchantName: "NUvisa",
        },
        transactionInfo: {
          totalPriceStatus: "FINAL",
          totalPriceLabel: "Total",
          totalPrice: totalAmount.toString(),
          currencyCode: "GBP",
          countryCode: "GB",
          displayItems: displayItems,
        },
        callbackIntents: ["PAYMENT_AUTHORIZATION"],
        shippingAddressRequired: false,
        shippingOptionRequired: false,
      };

      // This will show the Google Pay interface, not credit card selection
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
    } catch (error) {
      console.error("Google Pay error:", error);
      if (error.statusCode === "CANCELED") {
        return;
      }
      showAlert(
        "Google Pay",
        "Google Pay payment failed. Please try a different payment method."
      );
    }
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br  from-purple-100 to-[#f3e6ff] flex flex-col h-full">
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
                Complete your Schengen visa application
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
            {/* Apple Pay & Google Pay Buttons */}
            <div className="space-y-2">
              <h2 className="font-medium text-lg">Express Checkout</h2>
              {/* Apple Pay & Google Pay - Official Branded Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Apple Pay Button - Official Style */}
                <button
                  onClick={handleApplePayClick}
                  className="group relative flex items-center justify-center bg-black text-white! rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm"
                  style={{
                    backgroundColor: "#000",
                    minHeight: "44px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FaApple className="text-lg" />
                    <span className="font-medium tracking-wide">Pay</span>
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-lg transition-opacity duration-200"></div>
                </button>

                {/* Google Pay Button - Official Style */}
                <button
                  onClick={handleGooglePayClick}
                  className="group relative flex items-center justify-center bg-white text-gray-800 rounded-full px-6 py-3 text-sm font-medium hover:shadow-md transition-all duration-200 shadow-sm border border-gray-200"
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
                      className="flex-shrink-0"
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
                    <span className="font-medium tracking-wide text-gray-700">
                      Pay
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-30 rounded-lg transition-opacity duration-200"></div>
                </button>
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
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="name@example.com"
                    className={`w-full border ${emailError ? "border-red-400" : "border-gray-300"
                      } rounded-md p-2 text-sm  ${emailError
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
                    className={`w-full border ${phoneError
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

                <div>
                  <label
                    htmlFor="postcode"
                    className="block text-sm font-medium mb-1"
                  >
                    Postcode *
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    onBlur={handlePostcodeBlur}
                    placeholder="SW1A 1AA"
                    className={`w-full border ${postcodeError ? "border-red-400" : "border-gray-300"
                      } rounded-md p-2 text-sm  ${postcodeError
                        ? "outline-none ring-2 ring-red-400"
                        : "focus:outline-none focus:ring-2 focus:ring-black"
                      }`}
                  />
                  {postcodeError && (
                    <span className="text-sm text-red-400 mt-1">
                      {postcodeError}
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

            {/* Express Checkout Section */}
            <div className="space-y-3"></div>

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
                  className={`border rounded-md p-3 cursor-pointer ${selectedPaymentMethod === "stripe"
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
                      <div className="bg-[#7350FF] text-white px-2 py-1 rounded text-xs font-bold">
                        VISA
                      </div>
                      {/* Maestro */}
                      <div className="bg-red-500 text-white w-6 h-4 rounded flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full -ml-1"></div>
                      </div>
                      {/* Mastercard */}
                      <div className="relative w-6 h-4 flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full -ml-1"></div>
                      </div>
                      {/* American Express */}
                      <div className="bg-[#7350FF] text-white px-1 py-1 rounded text-xs font-bold">
                        AMEX
                      </div>
                      {/* +4 more */}
                      <span className="text-xs text-gray-500 font-medium">
                        +4
                      </span>
                    </div>
                  </div>

                  {selectedPaymentMethod === "stripe" && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                      <h3 className="font-medium text-lg">Card Details</h3>

                      {/* Card Number */}
                      <div>
                        <label
                          htmlFor="cardNumber"
                          className="block text-sm font-medium mb-1"
                        >
                          Card number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="cardNumber"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(formatCardNumber(e.target.value))
                            }
                            onBlur={handleCardFieldBlur}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className={`w-full border ${cardErrors.cardNumber
                              ? "border-red-400"
                              : "border-gray-300"
                              } rounded-md p-3 text-sm pr-10 ${cardErrors.cardNumber
                                ? "outline-none ring-2 ring-red-400"
                                : "focus:outline-none focus:ring-2 focus:ring-black"
                              }`}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-gray-400"
                            >
                              <rect
                                x="2"
                                y="6"
                                width="20"
                                height="12"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M6 10h12"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>
                        {cardErrors.cardNumber && (
                          <span className="text-sm text-red-400 mt-1">
                            {cardErrors.cardNumber}
                          </span>
                        )}
                      </div>

                      {/* Expiration Date and Security Code Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="expirationDate"
                            className="block text-sm font-medium mb-1"
                          >
                            Expiration date (MM / YY)
                          </label>
                          <input
                            type="text"
                            id="expirationDate"
                            value={expirationDate}
                            onChange={(e) =>
                              setExpirationDate(
                                formatExpirationDate(e.target.value)
                              )
                            }
                            onBlur={handleCardFieldBlur}
                            placeholder="MM / YY"
                            maxLength={7}
                            className={`w-full border ${cardErrors.expirationDate
                              ? "border-red-400"
                              : "border-gray-300"
                              } rounded-md p-3 text-sm ${cardErrors.expirationDate
                                ? "outline-none ring-2 ring-red-400"
                                : "focus:outline-none focus:ring-2 focus:ring-black"
                              }`}
                          />
                          {cardErrors.expirationDate && (
                            <span className="text-sm text-red-400 mt-1">
                              {cardErrors.expirationDate}
                            </span>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="securityCode"
                            className="block text-sm font-medium mb-1"
                          >
                            Security code
                            <svg
                              className="inline ml-1 w-4 h-4 text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </label>
                          <input
                            type="text"
                            id="securityCode"
                            value={securityCode}
                            onChange={(e) =>
                              setSecurityCode(
                                e.target.value.replace(/\D/g, "").slice(0, 4)
                              )
                            }
                            onBlur={handleCardFieldBlur}
                            placeholder="123"
                            maxLength={4}
                            className={`w-full border ${cardErrors.securityCode
                              ? "border-red-400"
                              : "border-gray-300"
                              } rounded-md p-3 text-sm ${cardErrors.securityCode
                                ? "outline-none ring-2 ring-red-400"
                                : "focus:outline-none focus:ring-2 focus:ring-black"
                              }`}
                          />
                          {cardErrors.securityCode && (
                            <span className="text-sm text-red-400 mt-1">
                              {cardErrors.securityCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Name on Card */}
                      <div>
                        <label
                          htmlFor="nameOnCard"
                          className="block text-sm font-medium mb-1"
                        >
                          Name on card
                        </label>
                        <input
                          type="text"
                          id="nameOnCard"
                          value={nameOnCard}
                          onChange={(e) => setNameOnCard(e.target.value)}
                          onBlur={handleCardFieldBlur}
                          placeholder="John Doe"
                          className={`w-full border ${cardErrors.nameOnCard
                            ? "border-red-400"
                            : "border-gray-300"
                            } rounded-md p-3 text-sm ${cardErrors.nameOnCard
                              ? "outline-none ring-2 ring-red-400"
                              : "focus:outline-none focus:ring-2 focus:ring-black"
                            }`}
                        />
                        {cardErrors.nameOnCard && (
                          <span className="text-sm text-red-400 mt-1">
                            {cardErrors.nameOnCard}
                          </span>
                        )}
                      </div>

                      {/* Use Shipping Address Checkbox */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useShippingAddress"
                          checked={useShippingAddress}
                          onChange={(e) =>
                            setUseShippingAddress(e.target.checked)
                          }
                          className="h-4 w-4 border-gray-300 rounded"
                        />
                        <label htmlFor="useShippingAddress" className="text-sm">
                          Use shipping address as billing address
                        </label>
                      </div>

                      {/* Billing Address Section */}
                      {!useShippingAddress && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-lg">
                            Billing address
                          </h4>
                          {/* Country/Region */}
                          <div>
                            <label
                              htmlFor="billingCountry"
                              className="block text-sm font-medium mb-1"
                            >
                              Country/Region
                            </label>
                            <select
                              id="billingCountry"
                              value={billingCountry}
                              onChange={(e) =>
                                setBillingCountry(e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              <option value="United Kingdom">
                                United Kingdom
                              </option>
                              <option value="United States">
                                United States
                              </option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Spain">Spain</option>
                              <option value="Italy">Italy</option>
                            </select>
                          </div>
                          {/* First Name and Last Name Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="billingFirstName"
                                className="block text-sm font-medium mb-1"
                              >
                                First name
                              </label>
                              <input
                                type="text"
                                id="billingFirstName"
                                value={billingFirstName}
                                onChange={(e) =>
                                  setBillingFirstName(e.target.value)
                                }
                                onBlur={handleBillingFieldBlur}
                                className={`w-full border ${cardErrors.billingFirstName
                                  ? "border-red-400"
                                  : "border-gray-300"
                                  } rounded-md p-3 text-sm ${cardErrors.billingFirstName
                                    ? "outline-none ring-2 ring-red-400"
                                    : "focus:outline-none focus:ring-2 focus:ring-black"
                                  }`}
                              />
                              {cardErrors.billingFirstName && (
                                <span className="text-sm text-red-400 mt-1">
                                  {cardErrors.billingFirstName}
                                </span>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor="billingLastName"
                                className="block text-sm font-medium mb-1"
                              >
                                Last name
                              </label>
                              <input
                                type="text"
                                id="billingLastName"
                                value={billingLastName}
                                onChange={(e) =>
                                  setBillingLastName(e.target.value)
                                }
                                onBlur={handleBillingFieldBlur}
                                className={`w-full border ${cardErrors.billingLastName
                                  ? "border-red-400"
                                  : "border-gray-300"
                                  } rounded-md p-3 text-sm ${cardErrors.billingLastName
                                    ? "outline-none ring-2 ring-red-400"
                                    : "focus:outline-none focus:ring-2 focus:ring-black"
                                  }`}
                              />
                              {cardErrors.billingLastName && (
                                <span className="text-sm text-red-400 mt-1">
                                  {cardErrors.billingLastName}
                                </span>
                              )}
                            </div>
                          </div>
                          onChange={(e) => setBillingAddress(e.target.value)}
                          onBlur={handleBillingFieldBlur}
                          {/* Address */}
                          <div>
                            <label
                              htmlFor="billingAddress"
                              className="block text-sm font-medium mb-1"
                            >
                              Address
                              <svg
                                className="inline ml-1 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </label>
                            <input
                              type="text"
                              id="billingAddress"
                              value={billingAddress}
                              onChange={(e) =>
                                setBillingAddress(e.target.value)
                              }
                              className={`w-full border ${cardErrors.billingAddress
                                ? "border-red-400"
                                : "border-gray-300"
                                } rounded-md p-3 text-sm ${cardErrors.billingAddress
                                  ? "outline-none ring-2 ring-red-400"
                                  : "focus:outline-none focus:ring-2 focus:ring-black"
                                }`}
                            />
                            {cardErrors.billingAddress && (
                              <span className="text-sm text-red-400 mt-1">
                                {cardErrors.billingAddress}
                              </span>
                            )}
                          </div>
                          {/* Apartment */}
                          <div>
                            <label
                              htmlFor="billingApartment"
                              className="block text-sm font-medium mb-1"
                            >
                              Apartment, suite, etc. (optional)
                            </label>
                            <input
                              type="text"
                              id="billingApartment"
                              value={billingApartment}
                              onChange={(e) =>
                                setBillingApartment(e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          </div>
                          {/* City and Postcode Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="billingCity"
                                className="block text-sm font-medium mb-1"
                              >
                                City
                              </label>
                              <input
                                type="text"
                                id="billingCity"
                                value={billingCity}
                                onChange={(e) => setBillingCity(e.target.value)}
                                onBlur={handleBillingFieldBlur}
                                className={`w-full border ${cardErrors.billingCity
                                  ? "border-red-400"
                                  : "border-gray-300"
                                  } rounded-md p-3 text-sm ${cardErrors.billingCity
                                    ? "outline-none ring-2 ring-red-400"
                                    : "focus:outline-none focus:ring-2 focus:ring-black"
                                  }`}
                              />
                              {cardErrors.billingCity && (
                                <span className="text-sm text-red-400 mt-1">
                                  {cardErrors.billingCity}
                                </span>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor="billingPostcode"
                                className="block text-sm font-medium mb-1"
                              >
                                Postcode
                              </label>
                              <input
                                type="text"
                                id="billingPostcode"
                                value={billingPostcode}
                                onChange={(e) =>
                                  setBillingPostcode(e.target.value)
                                }
                                onBlur={(e) => {
                                  const v = String(e.target.value || "").trim();
                                  if (billingCountry === "United Kingdom") {
                                    if (!v) {
                                      setCardErrors((prev) => ({
                                        ...prev,
                                        billingPostcode: "Postcode is required",
                                      }));
                                    } else if (!isValidUKPostcode(v)) {
                                      setCardErrors((prev) => ({
                                        ...prev,
                                        billingPostcode:
                                          "Please enter a valid UK postcode (e.g. SW1A 1AA)",
                                      }));
                                    } else {
                                      setCardErrors((prev) => {
                                        const nxt = { ...prev };
                                        delete nxt.billingPostcode;
                                        return nxt;
                                      });
                                    }
                                  }
                                }}
                                className={`w-full border ${cardErrors.billingPostcode
                                  ? "border-red-400"
                                  : "border-gray-300"
                                  } rounded-md p-3 text-sm ${cardErrors.billingPostcode
                                    ? "outline-none ring-2 ring-red-400"
                                    : "focus:outline-none focus:ring-2 focus:ring-black"
                                  }`}
                              />
                              {cardErrors.billingPostcode && (
                                <span className="text-sm text-red-400 mt-1">
                                  {cardErrors.billingPostcode}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Phone */}
                          <div>
                            <label
                              htmlFor="billingPhone"
                              className="block text-sm font-medium mb-1"
                            >
                              Phone (optional)
                              <svg
                                className="inline ml-1 w-4 h-4 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </label>
                            <input
                              type="tel"
                              id="billingPhone"
                              value={billingPhone}
                              onChange={(e) => setBillingPhone(e.target.value)}
                              placeholder="e.g. 0123456789"
                              className={`w-full border ${billingPhoneError
                                ? "border-red-400"
                                : "border-gray-300"
                                } rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black`}
                            />
                            {billingPhoneError && (
                              <span className="text-sm text-red-400 mt-1">
                                {billingPhoneError}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`border rounded-md p-3 cursor-pointer ${selectedPaymentMethod === "klarna"
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
                  {selectedPaymentMethod === "klarna" && (
                    <p className="text-xs text-gray-600 mt-2 ml-6">
                      Pay in 3 interest-free payments or spread the cost over 24
                      months
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div
                    className={`border rounded-md p-3 cursor-pointer transition-all ${selectedPaymentMethod === "apple"
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
                      <FaApple className="text-lg" />
                      <span className="text-sm font-medium">Apple Pay</span>
                      {selectedPaymentMethod === "apple" && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-auto">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`border rounded-md p-3 cursor-pointer ${selectedPaymentMethod === "google"
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
                      <FaGoogle className="text-lg" />
                      <span className="text-sm font-medium">Google Pay</span>
                      {selectedPaymentMethod === "google" && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-auto">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={
                  cretingDynamicCheckout ||
                  (appliedDiscount &&
                    appliedDiscount.description &&
                    appliedDiscount.description
                      .toLowerCase()
                      .includes("student") &&
                    !studentVerified)
                }
                onClick={handleProceedToCheckout}
                className={`w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-900 transition-colors ${cretingDynamicCheckout ||
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
                {cretingDynamicCheckout ? (
                  "Processing..."
                ) : appliedDiscount &&
                  appliedDiscount.description &&
                  appliedDiscount.description
                    .toLowerCase()
                    .includes("student") &&
                  !studentVerified ? (
                  "Verify your email to continue"
                ) : selectedPaymentMethod === "apple" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FaApple />
                    <span>
                      Pay {formatCurrency(totalAmountEUR, "EUR")} with Apple Pay
                    </span>
                  </div>
                ) : selectedPaymentMethod === "google" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FaGoogle />
                    <span>
                      Pay {formatCurrency(totalAmountEUR, "EUR")} with Google
                      Pay
                    </span>
                  </div>
                ) : selectedPaymentMethod === "klarna" ? (
                  <div className="flex items-center justify-center space-x-2">
                    <SiKlarna />
                    <span>
                      Pay {formatCurrency(totalAmountEUR, "EUR")} with Klarna
                    </span>
                  </div>
                ) : (
                  `Complete Order`
                )}
              </button>
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
              <span className={appliedDiscount && "line-through"}>
                {formatCurrency(visaFeesEUR, "EUR")}
              </span>

              {appliedDiscount && (
                <span className="text-sm font-medium">
                  {formatCurrency(discountedVisaFeesEUR, "EUR")}
                </span>
              )}
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
                <span className="text-sm">Insurance certificate</span>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <QtyInput
                  value={insuranceCount}
                  onIncrement={() => handleInsuranceChange(1)}
                  onDecrement={() => handleInsuranceChange(-1)}
                  min={1}
                />
                <div className="flex item-center gap-2">
                  {appliedInsuranceDiscount && (
                    <span className="line-through">
                      {formatCurrency(
                        insuranceFeesPerTraveller * insuranceCount,
                        "EUR"
                      )}
                    </span>
                  )}
                  <span className={`text-sm `}>
                    {includeInsurance
                      ? formatCurrency(baseInsuranceFeesEUR, "EUR")
                      : formatCurrency(0, "EUR")}
                  </span>
                </div>
              </div>
            </div>
            {includeInsurance && (
              <p className="text-xs text-gray-400">
                NEWVOU400 (Included for {insuranceCount} traveler
                {travelers > 1 ? "s" : ""})
              </p>
            )}

            {/* E visa card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HiOutlineDeviceMobile />
                <span className="text-sm">Digital gift card</span>
              </div>
              <span className="text-sm">
                {formatCurrency(eVisaFeesEUR, "EUR")}
              </span>
            </div>

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
              <span>{formatCurrency(discountAmountEUR, "EUR")}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-gilroy-bold text-xl pt-2 border-t border-gray-700">
              <span>Total</span>
              <span>{formatCurrency(total, "EUR")} EUR</span>
            </div>

            <div className="space-y-3">
              <h2 className="font-medium text-lg">Discount Code</h2>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCodeLocal(e.target.value.toUpperCase())
                      }
                      placeholder="Enter coupon code (e.g., STUDENT10)"
                      className={`w-full border ${couponError ? "border-red-400" : "border-gray-300"
                        } rounded-md p-2 text-sm ${couponError
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
            <div className="bg-green-600 text-white rounded-md p-3 text-sm text-center font-medium">
              ✓ 100% risk-free - Get your visa or full refund
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
};

export default VisaCheckout;
