"use client";

import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaUser, FaShieldAlt, FaApple, FaGoogle } from "react-icons/fa";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { SiKlarna } from "react-icons/si";
import {
  calculatePaymentFees,
  formatCurrency,
  validateCouponCode,
  applyCouponDiscount,
} from "@/utils/currency";
import ClientOnly from "./ClientOnly";
import QtyInput from "./QtyInput";

const VisaCheckout = () => {
  const dispatch = useAppDispatch();
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();

  // Get data from Redux store first, fallback to URL params if not available
  const visaState = useAppSelector((state) => state.visa);

  // Use dynamic visa fee from selected visa type if available, otherwise fallback to base fee
  const baseVisaFee =
    visaState.selectedVisaType && visaState.selectedVisaType.priceGBP
      ? Number(visaState.selectedVisaType.priceGBP)
      : visaState.selectedVisaType && visaState.selectedVisaType.price
      ? Math.round(Number(visaState.selectedVisaType.price) / 100)
      : 159;

  const selectedCountry = visaState.selectedCountry;
  const selectedVisaType = visaState.selectedVisaType;
  const visaTypeId = visaState.visaTypeId;

  const [travelers, setTravelers] = useState(
    visaState.travelers !== undefined && visaState.travelers !== null
      ? Number(visaState.travelers)
      : 1
  );
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
  } catch (err) {
    travelDays = 1;
  }

  const insuranceFeesPerTraveller = 2 * travelDays; // EUR per traveller
  const insuranceFeesTotal = insuranceFeesPerTraveller * travelers; // total EUR
  const [includeInsurance, setIncludeInsurance] = useState(
    visaState.recommendedItems?.insuranceCertificate || false
  );
  const [email, setEmail] = useState(visaState.userEmail || "");
  const [emailError, setEmailError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");
  const [emailNewsOffers, setEmailNewsOffers] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    visaState.selectedPaymentMethod || "stripe"
  );
  const [couponCode, setCouponCode] = useState(visaState.couponCode || "");
  const [appliedDiscount, setAppliedDiscount] = useState(
    visaState.appliedDiscount || null
  );
  const [couponError, setCouponError] = useState("");

  // Card details state
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

  // Card validation errors
  const [cardErrors, setCardErrors] = useState({});

  // Function to apply coupon code
  const applyCouponCode = async () => {
    setCouponError("");

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const currentSubtotal =
      baseVisaFee * travelers + (includeInsurance ? insuranceFeesTotal : 0);

    try {
      // Validate coupon using API
      const validationResult = await validateCouponCode(
        couponCode.toUpperCase()
      );

      if (!validationResult.valid) {
        setCouponError(validationResult.message || "Invalid coupon code");
        return;
      }

      // Apply coupon discount
      const discountAmountEUR = applyCouponDiscount(
        calculatePaymentFees(currentSubtotal, "GBP", "EUR"),
        couponCode.toUpperCase()
      );
      const finalTotalEUR = Math.max(
        0,
        calculatePaymentFees(currentSubtotal, "GBP", "EUR") - discountAmountEUR
      );

      setAppliedDiscount({
        code: couponCode.toUpperCase(),
        percentage: validationResult.discount || 10,
        description: validationResult.description || "Applied Discount",
        discountAmount: discountAmountEUR,
        finalTotal: finalTotalEUR,
      });
      setCouponError("");
    } catch (error) {
      console.error("Coupon validation error:", error);
      setCouponError("Failed to validate coupon. Please try again.");
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
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

  const isValidUKPhone = (value) => {
    if (!value) return false;
    const normalized = value.replace(/[^+0-9]/g, "");
    if (/^\+447\d{9}$/.test(normalized)) return true;
    if (/^07\d{9}$/.test(normalized)) return true;
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
    if (!isValidUKPhone(phone)) {
      setPhoneError(
        "Please enter a valid UK phone number (e.g. +44 7XXXXXXXXX or 07XXXXXXXXX)"
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
  const eVisaFees = 0; // Currently free
  const subtotal = visaFeesTotal + insuranceFees + giftCardFees + eVisaFees;

  // Calculate original price and savings (for display purposes)
  const originalPrice = visaState.insuranceOnly ? 0 : baseVisaFee * travelers;
  const savings = originalPrice - visaFeesTotal; // Any savings from discounts

  // Calculate dynamic values based on user selections in EUR
  const visaFeesEUR = calculatePaymentFees(visaFeesTotal, "EUR");
  const insuranceFeesEUR = includeInsurance
    ? calculatePaymentFees(insuranceFees, "EUR")
    : 0;
  const _giftCardFeesEUR = calculatePaymentFees(giftCardFees, "EUR");
  const eVisaFeesEUR = 0; // Currently free
  const subtotalEUR = calculatePaymentFees(subtotal, "EUR");

  const discountAmountEUR = 0;
  const discountedSubtotalEUR = subtotalEUR - discountAmountEUR;

  const _originalPriceEUR = calculatePaymentFees(originalPrice, "EUR");
  const savingsEUR = calculatePaymentFees(savings, "EUR");
  const totalAmountEUR = discountedSubtotalEUR;

  const handleProceedToCheckout = async () => {
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

    // If phone is provided, ensure it's a valid UK phone number
    if (phone && phone.trim() && !isValidUKPhone(phone)) {
      setPhoneError(
        "Please enter a valid UK phone number (e.g. +44 7XXXXXXXXX or 07XXXXXXXXX)"
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

    const statusResult = await handleCreateDynamicCheckoutSession({
      email: email,
      amount: String(totalAmountEUR),
      travellers: String(travelers),
      country: String(selectedCountry || ""),
      insurance: includeInsurance ? "true" : "false", // Simple boolean conversion
      phone: phone,
      postcode: postcode,
      paymentMethod: selectedPaymentMethod,
      visaTypeId: visaTypeId || visaState.visaTypeId || "",
      currency: "EUR",
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

      await localStorageGateway("userEmail", localStorageEnums.SET, email);
    }

    const redirectUrl = results.data.results.url;
    if (redirectUrl) {
      window.location.href = redirectUrl; // Redirect user to stripe checkout
    }
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-white flex flex-col h-full">
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

            <Image
              src="/icons/bag.svg"
              alt="Shopping bag"
              width={30}
              height={20}
              className="object-contain"
            />
          </div>
        </div>

        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-full grow">
          <div className="space-y-6 p-6 md:p-10 md:pl-10 xl:pl-40">
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
                    placeholder="+44 123 456 7890"
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
                    className={`w-full border ${
                      postcodeError ? "border-red-400" : "border-gray-300"
                    } rounded-md p-2 text-sm  ${
                      postcodeError
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
            <div className="space-y-3">
              <h2 className="font-medium text-lg">Express Checkout</h2>
              <div className="space-y-2">
                <div
                  className={`border rounded-md p-3 cursor-pointer transition-all ${
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
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
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
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
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

            {/* Coupon Code Section */}
            <div className="space-y-3">
              <h2 className="font-medium text-lg">Discount Code</h2>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter coupon code (e.g., STUDENT10)"
                      className={`w-full border ${
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
                </div>
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
                            className={`w-full border ${
                              cardErrors.cardNumber
                                ? "border-red-400"
                                : "border-gray-300"
                            } rounded-md p-3 text-sm pr-10 ${
                              cardErrors.cardNumber
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
                            className={`w-full border ${
                              cardErrors.expirationDate
                                ? "border-red-400"
                                : "border-gray-300"
                            } rounded-md p-3 text-sm ${
                              cardErrors.expirationDate
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
                            className={`w-full border ${
                              cardErrors.securityCode
                                ? "border-red-400"
                                : "border-gray-300"
                            } rounded-md p-3 text-sm ${
                              cardErrors.securityCode
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
                          className={`w-full border ${
                            cardErrors.nameOnCard
                              ? "border-red-400"
                              : "border-gray-300"
                          } rounded-md p-3 text-sm ${
                            cardErrors.nameOnCard
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
                                className={`w-full border ${
                                  cardErrors.billingFirstName
                                    ? "border-red-400"
                                    : "border-gray-300"
                                } rounded-md p-3 text-sm ${
                                  cardErrors.billingFirstName
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
                                className={`w-full border ${
                                  cardErrors.billingLastName
                                    ? "border-red-400"
                                    : "border-gray-300"
                                } rounded-md p-3 text-sm ${
                                  cardErrors.billingLastName
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
                              className={`w-full border ${
                                cardErrors.billingAddress
                                  ? "border-red-400"
                                  : "border-gray-300"
                              } rounded-md p-3 text-sm ${
                                cardErrors.billingAddress
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
                                className={`w-full border ${
                                  cardErrors.billingCity
                                    ? "border-red-400"
                                    : "border-gray-300"
                                } rounded-md p-3 text-sm ${
                                  cardErrors.billingCity
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
                                className={`w-full border ${
                                  cardErrors.billingPostcode
                                    ? "border-red-400"
                                    : "border-gray-300"
                                } rounded-md p-3 text-sm ${
                                  cardErrors.billingPostcode
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
                              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                          </div>
                        </div>
                      )}
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
                  {selectedPaymentMethod === "klarna" && (
                    <p className="text-xs text-gray-600 mt-2 ml-6">
                      Pay in 3 interest-free payments or spread the cost over 24
                      months
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={cretingDynamicCheckout}
                onClick={handleProceedToCheckout}
                className={`w-full bg-black text-white py-3 rounded-md font-semibold hover:bg-gray-900 transition-colors ${
                  cretingDynamicCheckout
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
              >
                {cretingDynamicCheckout ? (
                  "Processing..."
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
                    setTravelers(2);
                  } else if (!e.target.checked && travelers > 1) {
                    setTravelers(1);
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
                onIncrement={(val) => setTravelers(val)}
                onDecrement={(val) => setTravelers(val)}
                value={travelers}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="line-through"></span>
              <span>{formatCurrency(visaFeesEUR, "EUR")}</span>
            </div>

            {/* Insurance */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setIncludeInsurance(!includeInsurance)}
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
              <span className="text-sm">
                {includeInsurance
                  ? formatCurrency(insuranceFeesEUR, "EUR")
                  : formatCurrency(0, "EUR")}
              </span>
            </div>
            {includeInsurance && (
              <p className="text-xs text-gray-400">
                NEWVOU400 (Included for {travelers} traveler
                {travelers > 1 ? "s" : ""})
              </p>
            )}

            {/* E visa card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HiOutlineDeviceMobile />
                <span className="text-sm">E visa card</span>
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
            {appliedDiscount && (
              <div className="flex justify-between text-sm text-green-400">
                <span>
                  {appliedDiscount.description} (-{appliedDiscount.percentage}%)
                </span>
                <span>-{formatCurrency(discountAmountEUR, "EUR")}</span>
              </div>
            )}

            {/* You Save */}
            <div className="flex justify-between text-sm text-green-400">
              <span>You save</span>
              <span>{formatCurrency(0, "EUR")}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between font-gilroy-bold text-xl pt-2 border-t border-gray-700">
              <span>Total</span>
              <span>{formatCurrency(totalAmountEUR, "EUR")} EUR</span>
            </div>

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
