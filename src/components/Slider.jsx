"use client";
import { getCountryConfig } from "@/constants/countryConfig";
import { useAppDispatch } from "@/store";
import {
  setInsuranceFees,
  setSelectedCountry as setReduxSelectedCountry,
  setTravelers as setReduxTravelers,
  setVisaFees,
  setSelectedVisaType,
  setArrivalDate,
  setDepartureDate,
  setRequiredDocuments,
  setRecommendedItems,
  setAppliedDiscount,
  setCouponCode,
  setUserEmail,
  setSelectedPaymentMethod,
  setGiftCardFees,
  setTotalAmount,
  setInsuranceOnly,
} from "@/store/visaSlice";
import ClientOnly from "./ClientOnly";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Home,
  MedalIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import QtyInput from "./QtyInput";
import "react-datepicker/dist/react-datepicker.css";
import { FaApple } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import { CommonDatePicker } from "@/ui/date-picker";

const CountrySlider = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showError, showSuccess } = useToast();
  const MIN_SAFE_DAYS_BEFORE_TRAVEL = 15;

  // Sample country data with images and names
  const countries = [
    {
      id: 1,
      name: "Paris, France",
      image:
        "https://images.unsplash.com/photo-1431274172761-fca41d930114?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      id: 2,
      name: "Rome, Italy",
      image:
        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1592&q=80",
    },
    {
      id: 3,
      name: "Barcelona, Spain",
      image:
        "https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      id: 4,
      name: "Berlin, Germany",
      image:
        "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      id: 5,
      name: "Amsterdam, Netherlands",
      image:
        "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      id: 6,
      name: "Prague, Czech Republic",
      image:
        "https://images.unsplash.com/photo-1519677100203-a0e668c92439?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      id: 7,
      name: "Vienna, Austria",
      image:
        "https://images.unsplash.com/photo-1516550893923-42d28e5677af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80",
    },
    {
      id: 8,
      name: "Athens, Greece",
      image:
        "https://images.unsplash.com/photo-1555993539-1732b0258235?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
  ];

  const schengenCountries = [
    "France",
    "Germany",
    "Italy",
    "Spain",
    "Netherlands",
    "Belgium",
    "Austria",
    "Greece",
    "Portugal",
    "Switzerland",
    "Norway",
    "Sweden",
    "Denmark",
    "Finland",
    "Iceland",
    "Poland",
    "Czech Republic",
    "Hungary",
    "Slovakia",
    "Slovenia",
    "Estonia",
    "Latvia",
    "Lithuania",
    "Malta",
    "Luxembourg",
    "Liechtenstein",
  ];

  const [travelers, setTravelersLocal] = useState(1);
  const [_isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountryLocal] = useState("France");
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [insuranceDays, setInsuranceDays] = useState(0);
  const [giftCardCount, setGiftCardCount] = useState(1);
  // Default arrival = today + 15 days, default departure = arrival + 15 days
  const computeDefaultArrival = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 15);
    return d;
  };

  const initialArrivalDate = computeDefaultArrival();
  const computeDefaultDeparture = (arrival) => {
    const d = new Date(arrival);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 14);
    return d;
  };

  const initialDepartureDate = computeDefaultDeparture(initialArrivalDate);

  const [arrivalDate, setArrivalDateLocal] = useState(() => initialArrivalDate);
  const [departureDate, setDepartureDateLocal] = useState(
    () => initialDepartureDate
  );
  const [dateValidationErrors, setDateValidationErrors] = useState({});
  const [_selectedOptions, setSelectedOptions] = useState({
    approvalRate: true,
    riskFree: true,
    getHelp: true,
  });
  const [validationErrors, setValidationErrors] = useState(new Set());
  const [selectedVisaType, _setSelectedVisaType] = useState(null);
  const [selectedPaymentMethod, setSelectedLocalPaymentMethod] = useState("");

  const [couponCode, setCouponCodeLocal] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedDiscount, setAppliedDiscountLocal] = useState(null);
  const [groupAutoApplied, setGroupAutoApplied] = useState(false);
  const [_showStudentModal, _setShowStudentModal] = useState(false);
  const [pendingCheckoutQuery, setPendingCheckoutQuery] = useState(null);
  const [_studentEmail, _setStudentEmail] = useState("");
  const [studentVerificationSent, setStudentVerificationSent] = useState(false);
  const [_studentOtp, _setStudentOtp] = useState("");
  const [studentVerified, setStudentVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [_isVerifyingOtp, _setIsVerifyingOtp] = useState(false);

  // Keep a ref to the polling interval so we can clear it from other places
  const verificationPollRef = useRef(null);

  const [userEmail, setUserEmailLocal] = useState("");
  const [emailError, setEmailError] = useState("");
  const [documentsAccordionOpen, setDocumentsAccordionOpen] = useState(false);

  // Helper function to safely parse duration from visa type
  const parseDurationDays = (durationString) => {
    if (!durationString) return null;

    // Handle common invalid/placeholder values
    if (
      durationString.includes("-1") ||
      durationString.toLowerCase().includes("invalid")
    ) {

      return 90; // Default fallback for Schengen visas
    }

    const matches = durationString.match(/-?\d+/);
    let days = matches ? Math.abs(parseInt(matches[0])) : null;

    // If we got a negative or zero value, use default
    if (days <= 0) {

      days = 90;
    }

    return days;
  };
  const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

  const getCountryParam = (countryVal) => {
    const raw = countryVal?.name || countryVal || "";
    if (!raw) return "";
    return raw.includes(",") ? raw.split(", ")[1] : raw;
  };

  const tripDaysInclusive = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Normalize times to midnight to avoid DST/partial day issues
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate - startDate;
    // Add 1 to be inclusive of both start and end dates
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  // Helper function to sanitize duration strings before storing in Redux
  const _sanitizeDurationString = (duration) => {
    if (
      !duration ||
      duration.includes("-1") ||
      duration.toLowerCase().includes("invalid")
    ) {
      return "90 days"; // Default for Schengen visas
    }
    return String(duration);
  };

  // Function to validate dates against visa type constraints
  const validateDates = (arrival, departure, visaType) => {
    const errors = {};

    if (!arrival) {
      return errors;
    }

    const arrivalDate = new Date(arrival);
    const _departureDate = new Date(departure);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (arrivalDate < today) {
      errors.pastDate = "Arrival date cannot be in the past";
      return errors; // Early return for past date errors
    }

    // Check if arrival date is in the past

    const minTravelDate = new Date();
    minTravelDate.setHours(0, 0, 0, 0);
    minTravelDate.setDate(minTravelDate.getDate() + 15);

    if (arrivalDate < minTravelDate) {
      errors.tooClose =
        "Your travel dates are too close, embassies take up to 15 days after your visa appointment. You can still proceed with your application if your dates are flexible.";
    }

    if (departure) {
      const departureDate = new Date(departure);

      // Basic date validation
      if (arrivalDate >= departureDate) {
        errors.dateOrder = "Departure date must be after arrival date";
      } else {
        // Calculate trip duration only if dates are in the correct order
        const tripDuration = Math.ceil(
          (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
        );

        // Visa type specific validation
        if (visaType && visaType.duration_permitted) {
          const maxDays = parseDurationDays(visaType.duration_permitted);

          if (maxDays && tripDuration > maxDays) {
            errors.exceedsLimit = `Trip duration (${tripDuration} days) exceeds visa limit (${maxDays} days)`;
          }
        } else {
          // Default limit for Schengen visas when no visa type is selected
          const defaultMaxDays = 90;
          if (tripDuration > defaultMaxDays) {
            errors.exceedsLimit = `Trip duration (${tripDuration} days) exceeds default limit (${defaultMaxDays} days)`;
          }
        }
      }
    }

    return errors;
  };

  // Handle date changes with validation and Redux updates
  const handleArrivalDateChange = (date) => {
    const safeDate = isValidDate(date) ? date : null;
    setArrivalDateLocal(safeDate);
    const dateString = safeDate ? safeDate.toISOString().split("T")[0] : "";
    dispatch(setArrivalDate(dateString));

    if (safeDate) {
      const minDeparture = new Date(safeDate);
      minDeparture.setDate(minDeparture.getDate() + 15);

      if (!departureDate || departureDate < minDeparture) {
        setDepartureDateLocal(minDeparture);
        dispatch(setDepartureDate(minDeparture.toISOString().split("T")[0]));
      }
    }

    const errors = validateDates(safeDate, departureDate, selectedVisaType);
    setDateValidationErrors(errors);
    if (safeDate && (departureDate || (safeDate && initialDepartureDate))) {
      const errors2 = validateDates(safeDate, departureDate, selectedVisaType);
      setDateValidationErrors(errors2);
    }

    if (
      selectedVisaType &&
      selectedVisaType.duration_permitted &&
      safeDate &&
      departureDate
    ) {
      const maxDays = parseDurationDays(selectedVisaType.duration_permitted);
      const currentTripDays = Math.ceil(
        (departureDate - safeDate) / (1000 * 60 * 60 * 24)
      );

      // If current trip exceeds limit, adjust departure date to max allowed
      if (maxDays && currentTripDays > maxDays) {
        const newDepartureDate = new Date(
          safeDate.getTime() + (maxDays - 1) * 24 * 60 * 60 * 1000
        );
        setDepartureDateLocal(newDepartureDate);
        dispatch(
          setDepartureDate(newDepartureDate.toISOString().split("T")[0])
        );
      }
    }
  };

  const handleDepartureDateChange = (date) => {
    const safeDate = isValidDate(date) ? date : null;
    setDepartureDateLocal(safeDate);
    const dateString = safeDate ? safeDate.toISOString().split("T")[0] : "";
    dispatch(setDepartureDate(dateString));

    const errors = validateDates(arrivalDate, safeDate, selectedVisaType);
    setDateValidationErrors(errors);

    // Validate dates only if both dates exist
    if (arrivalDate && safeDate) {
      const errors2 = validateDates(arrivalDate, safeDate, selectedVisaType);
      setDateValidationErrors(errors2);
    }
  }; // Revalidate dates when visa type changes
  useEffect(() => {
    if (selectedVisaType) {
      const errors = validateDates(
        arrivalDate,
        departureDate,
        selectedVisaType
      );
      setDateValidationErrors(errors);

      // Auto-adjust departure date if it exceeds the new visa type's duration limit
      if (selectedVisaType.duration_permitted && arrivalDate && departureDate) {
        const maxDays = parseDurationDays(selectedVisaType.duration_permitted);
        const currentTripDays = Math.ceil(
          (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
        );

        if (maxDays && currentTripDays > maxDays) {
          const newDepartureDate = new Date(
            arrivalDate.getTime() + (maxDays - 1) * 24 * 60 * 60 * 1000
          );
          setDepartureDateLocal(newDepartureDate);
          dispatch(
            setDepartureDate(newDepartureDate.toISOString().split("T")[0])
          );
        }
      }
    }
  }, [selectedVisaType, arrivalDate, departureDate]);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDayClassName = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const safeDateThreshold = new Date();
    safeDateThreshold.setHours(0, 0, 0, 0);
    safeDateThreshold.setDate(today.getDate() + MIN_SAFE_DAYS_BEFORE_TRAVEL);

    if (date < safeDateThreshold && date >= today) {
      return "dangerous-date";
    }
    if (date >= today) {
      return "comfortable-date";
    }
  };

  useEffect(() => {
    try {
      const arrivalStr = getLocalDateString(initialArrivalDate);
      const departureStr = getLocalDateString(initialDepartureDate);
      dispatch(setArrivalDate(arrivalStr));
      dispatch(setDepartureDate(departureStr));

      const errors = validateDates(
        initialArrivalDate,
        initialDepartureDate,
        selectedVisaType
      );
      setDateValidationErrors(errors);
    } catch { }
  }, []);

  let maxDepartureDate = null;
  if (arrivalDate) {
    maxDepartureDate = new Date(arrivalDate);

    const visaTypeDuration = selectedVisaType
      ? parseDurationDays(selectedVisaType.duration_permitted)
      : 90;
    const maxStayDuration = visaTypeDuration || 90;

    maxDepartureDate.setDate(arrivalDate.getDate() + maxStayDuration - 1);
  }

  const [requiredDocuments, setRequiredDocumentsLocal] = useState(() => ({
    passport: false,
    ukVisa: false,
    photos: false,
    bankStatements: false,
    employmentProof: false,
    insurance: false,
  }));

  const [recommendedItems, setRecommendedItemsLocal] = useState(() => ({
    insuranceCertificate: false,
    giftCard: false,
  }));

  // Handle pre-selected country from URL parameters
  useEffect(() => {
    if (router.query.selectedCountry) {
      const countryFromUrl = router.query.selectedCountry;
      if (schengenCountries.includes(countryFromUrl)) {
        setSelectedCountryLocal(countryFromUrl);
        dispatch(setReduxSelectedCountry(String(countryFromUrl)));
      }
    }
  }, [router.query.selectedCountry, dispatch]);

  const toggleRequiredDocument = (documentKey) => {
    setRequiredDocumentsLocal((prev) => {
      const next = { ...prev, [documentKey]: !prev[documentKey] };
      return next;
    });
    // Keep accordion open for better UX - let users manually close it
    // Clear validation error when document is checked
    if (!requiredDocuments[documentKey]) {
      setValidationErrors((prev) => {
        const newErrors = new Set(prev);
        newErrors.delete(documentKey);
        return newErrors;
      });
    }
  };

  const toggleRecommendedItem = (itemKey) => {
    setRecommendedItemsLocal((prev) => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      return next;
    });
    if (itemKey === "giftCard" && recommendedItems.giftCard) {
      setGiftCardCount(1);
      dispatch(setGiftCardFees(1));
      return;
    }
    // If unchecking insurance certificate, reset days to 0
    if (itemKey === "insuranceCertificate" && recommendedItems[itemKey]) {
      setInsuranceDays(0);
    }
    // If checking insurance certificate and days is 0, set to calculated days from dates
    else if (
      itemKey === "insuranceCertificate" &&
      !recommendedItems[itemKey] &&
      insuranceDays === 0
    ) {
      if (arrivalDate && departureDate) {
        const diffDays = tripDaysInclusive(arrivalDate, departureDate);

        // Calculate maximum allowed days based on visa type
        let maxAllowedDays = 90; // Default
        if (selectedVisaType && selectedVisaType.duration_permitted) {
          maxAllowedDays =
            parseDurationDays(selectedVisaType.duration_permitted) || 90;
        }

        // Use the smaller of trip duration or visa limit
        const allowedDays = Math.min(diffDays, maxAllowedDays);
        setInsuranceDays(allowedDays);
      } else {
        setInsuranceDays(0); // Default to 1 day when no dates provided
      }
    }
  };

  const _toggleOption = (option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const [baseFee] = useState(159);

  const perDayInsurancePrice = 2;

  const computedInsuranceTotal =
    recommendedItems.insuranceCertificate && insuranceDays > 0
      ? perDayInsurancePrice * insuranceDays * travelers
      : 0;

  const tooltips = {
    sticker:
      "A visa sticker is a physical visa label attached to your passport. It contains your personal details, visa type, validity period, and number of entries allowed.",
    duration:
      "30 days is the standard duration for this visa type. This means you can stay in the Schengen area for up to 30 days within the visa validity period.",
    term: "Short-term visas are typically issued for visits under 90 days. They're commonly used for tourism, business trips, or visiting family/friends.",
    entry:
      "Multiple entry allows you to enter the country multiple times during the visa validity period without needing to apply for a new visa each time.",
  };

  const _handleTravelerChange = (increment) => {
    const newValue = travelers + increment;
    if (newValue >= 1) {
      setTravelersLocal(newValue);
      dispatch(setReduxTravelers(Number(newValue)));
    }
  };

  const selectCountry = (country) => {
    setSelectedCountryLocal(country);
    setIsCountryOpen(false);

    // Update Redux state without redirecting
    const countryName = typeof country === "object" ? country.name : country;

    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    dispatch(setReduxSelectedCountry(String(countryName)));
    dispatch(setVisaFees(Number(countryConfig.visaFee)));
    dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
    dispatch(setReduxTravelers(Number(1)));
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const startTimer = () => {
      return setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const isLastSlide = prevIndex === countries.length - 1;
          return isLastSlide ? 0 : prevIndex + 1;
        });
      }, 5000);
    };

    timerRef.current = startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [countries.length]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? countries.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    resetTimer();
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === countries.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    resetTimer();
  };

  const _handleInsuranceChange = (increment) => {
    const newValue = insuranceDays + increment;

    // Calculate maximum allowed days based on visa type or dates
    let maxAllowedDays = 90; // Default

    if (selectedVisaType && selectedVisaType.duration_permitted) {
      maxAllowedDays =
        parseDurationDays(selectedVisaType.duration_permitted) || 90;
    }

    // If dates are selected, use the actual trip duration as upper limit
    if (arrivalDate && departureDate) {
      const tripDuration = tripDaysInclusive(arrivalDate, departureDate);
      maxAllowedDays = Math.min(maxAllowedDays, tripDuration);
    }

    // Ensure new value doesn't exceed limits
    const clampedValue = Math.min(Math.max(newValue, 1), maxAllowedDays);

    if (clampedValue !== insuranceDays) {
      setInsuranceDays(clampedValue);
      // Update the recommended items state based on days value
      if (clampedValue > 0 && !recommendedItems.insuranceCertificate) {
        setRecommendedItemsLocal((prev) => ({
          ...prev,
          insuranceCertificate: true,
        }));
      } else if (clampedValue === 0 && recommendedItems.insuranceCertificate) {
        setRecommendedItemsLocal((prev) => ({
          ...prev,
          insuranceCertificate: false,
        }));
      }
    }
  };

  const handleGiftCardChange = (increment) => {
    const newValue = giftCardCount + increment;
    if (newValue >= 1) {
      setGiftCardCount(newValue);
      // Update the recommended items state
      if (newValue > 0 && !recommendedItems.giftCard) {
        setRecommendedItemsLocal((prev) => ({ ...prev, giftCard: true }));
      } else if (newValue === 0 && recommendedItems.giftCard) {
        setRecommendedItemsLocal((prev) => ({ ...prev, giftCard: false }));
      }
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const isLastSlide = prevIndex === countries.length - 1;
        return isLastSlide ? 0 : prevIndex + 1;
      });
    }, 5000);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculateFinalPrice = () => {
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
          ? Math.round(Number(selectedVisaType.price) / 100)
          : baseFee;

    const basePrice = currentBaseFee * travelers;
    const insuranceCost = recommendedItems.insuranceCertificate && insuranceDays > 0
      ? perDayInsurancePrice * insuranceDays * travelers
      : 0;
    const giftCardCost = recommendedItems.giftCard ? 188 * giftCardCount : 0;

    const totalPrice = basePrice + insuranceCost + giftCardCost;

    if (appliedDiscount) {
      const discountAmount = (totalPrice * appliedDiscount.percentage) / 100;
      return totalPrice - discountAmount;
    }

    return totalPrice;
  };

  const calculateDiscountedInsurancePrice = () => {
    const originalPrice = computedInsuranceTotal;
    if (appliedDiscount && originalPrice > 0) {
      const discountAmount = (originalPrice * appliedDiscount.percentage) / 100;
      return originalPrice - discountAmount;
    }
    return originalPrice;
  };

  const calculateDiscountedGiftCardPrice = () => {
    const originalPrice = 188 * giftCardCount;
    if (appliedDiscount && originalPrice > 0) {
      const discountAmount = (originalPrice * appliedDiscount.percentage) / 100;
      return originalPrice - discountAmount;
    }
    return originalPrice;
  };

  const calculateOriginalPrice = () => {
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
          ? Math.round(Number(selectedVisaType.price) / 100)
          : baseFee;

    const baseOriginalPrice = Math.round(currentBaseFee * 1.25) * travelers;
    const insuranceOriginalPrice = recommendedItems.insuranceCertificate && insuranceDays > 0
      ? Math.round(perDayInsurancePrice * insuranceDays * travelers * 1.25)
      : 0;
    const giftCardOriginalPrice = recommendedItems.giftCard ? 245 * giftCardCount : 0;

    return baseOriginalPrice + insuranceOriginalPrice + giftCardOriginalPrice;
  };

  // Apply coupon immediately (no verification at apply time)
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
      SAVE10: {
        description: "Save 10%",
        percentage: 10,
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
          : 159; // baseFee
    const currentVisaFees = currentBaseFee * travelers;
    const calculatedDiscountAmount =
      (currentVisaFees * discount.percentage) / 100;

    const discountWithAmount = {
      ...discount,
      discountAmount: Math.round(calculatedDiscountAmount),
    };

    setAppliedDiscountLocal(discountWithAmount);
    setCouponError("");
    // If user manually applied GROUP20, mark it as manual (not auto-applied)
    if (couponCode.toUpperCase() === "GROUP20") {
      setGroupAutoApplied(false);
    }

    if (discount && discount.description.toLowerCase().includes("student")) {
    }
  };

  const removeCoupon = () => {
    setAppliedDiscountLocal(null);
    setCouponCodeLocal("");
    setCouponError("");
    // email verification reset not required
  };

  // Auto-apply or remove GROUP20 when traveler count changes
  useEffect(() => {
    try {
      const currentCode = (couponCode || "").toUpperCase();
      const _isGroupApplied =
        appliedDiscount &&
        appliedDiscount.percentage === 20 &&
        (appliedDiscount.description || "").toLowerCase().includes("group");

      if (travelers >= 3) {
        // Only auto-apply if there is no coupon currently applied
        if (!appliedDiscount) {
          // Calculate the discount amount based on current visa fees
          const currentBaseFee =
            selectedVisaType && selectedVisaType.priceGBP
              ? Number(selectedVisaType.priceGBP)
              : selectedVisaType && selectedVisaType.price
                ? Math.round(Number(selectedVisaType.price) / 100)
                : 159; // baseFee
          const currentVisaFees = currentBaseFee * travelers;
          const calculatedDiscountAmount = (currentVisaFees * 20) / 100;

          const groupDiscount = {
            description: "Group discount (3+ travellers)",
            percentage: 20,
            requiresMinTravellers: 3,
            discountAmount: Math.round(calculatedDiscountAmount),
          };
          setAppliedDiscountLocal(groupDiscount);
          setCouponCodeLocal("GROUP20");
          setCouponError("");
          setGroupAutoApplied(true);
          showSuccess &&
            showSuccess("Group-20 applied — 20% off for 3+ travellers");
        }
      } else {
        // If travelers dropped below 3 and we auto-applied the group discount, remove it
        if (groupAutoApplied) {
          setAppliedDiscountLocal(null);
          // Only clear couponCode if it was the auto-applied GROUP20
          if (currentCode === "GROUP20") setCouponCodeLocal("");
          setGroupAutoApplied(false);
          showSuccess &&
            showSuccess("Group-20 removed — fewer than 3 travellers");
        }
        // If the user manually had GROUP20 applied but now travelers < 3, show an error when they try to proceed (existing validation handles this)
      }
    } catch {
      // ignore
    }
  }, [travelers]);

  useEffect(() => {
    if (arrivalDate && departureDate) {
      const diffDays = tripDaysInclusive(arrivalDate, departureDate);

      let maxAllowedDays = 90; // Default
      if (selectedVisaType && selectedVisaType.duration_permitted) {
        maxAllowedDays =
          parseDurationDays(selectedVisaType.duration_permitted) || 90;
      }

      // Use the smaller of trip duration or visa limit
      const allowedDays = Math.min(diffDays, maxAllowedDays);

      if (
        allowedDays !== insuranceDays &&
        recommendedItems.insuranceCertificate
      ) {
        setInsuranceDays(allowedDays);
      }
    }
  }, [
    arrivalDate,
    departureDate,
    recommendedItems.insuranceCertificate,
    selectedVisaType,
    insuranceDays, // Added to dependency array
  ]);

  const handleGetVisa = async () => {
    const requiredFields = [
      "passport",
      "ukVisa",
      "photos",
      "bankStatements",
      "employmentProof",
    ];
    const missingDocs = requiredFields.filter(
      (field) => !requiredDocuments[field]
    );

    // Check if only insurance is selected (insurance-only checkout)
    const hasOnlyInsurance =
      recommendedItems.insuranceCertificate &&
      !recommendedItems.giftCard &&
      missingDocs.length === requiredFields.length;

    // If there are missing required docs and it's not insurance-only checkout, block and highlight
    if (missingDocs.length > 0 && !hasOnlyInsurance) {
      setValidationErrors(new Set(missingDocs));
      return;
    }

    // If a student discount is applied, require email verification before proceeding
    if (
      appliedDiscount &&
      appliedDiscount.description &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified
    ) {
      if (!userEmail || !validateEmail(userEmail)) {
        setEmailError(
          "Please enter a valid student email before proceeding to checkout"
        );
        return;
      }

      const verificationSent = await sendStudentVerification(userEmail, "/get-the-visa");
      if (verificationSent) {
        setPendingCheckoutQuery("proceed"); // Simple flag
        setSelectedLocalPaymentMethod("stripe");
        // Polling/verification effect will handle redirect after verification
        return;
      } else {
        return; // sendStudentVerification will have shown error
      }
    }

    // Use selected visa type fees if available, otherwise fallback to baseFee
    // Use the GBP price if available, otherwise convert from INR
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
          ? Math.round(Number(selectedVisaType.price) / 100)
          : baseFee;

    let visaFees = hasOnlyInsurance ? 0 : currentBaseFee * travelers;

    // Apply discount if available
    let discountAmount = 0;
    if (appliedDiscount) {
      discountAmount = (visaFees * appliedDiscount.percentage) / 100;
      visaFees = visaFees - discountAmount;
    }

    const insuranceFees = recommendedItems.insuranceCertificate
      ? perDayInsurancePrice * insuranceDays * travelers
      : 0;
    const giftCardFees = recommendedItems.giftCard ? 188 * giftCardCount : 0;
    const totalAmount = Math.round(visaFees + insuranceFees + giftCardFees);

    const countryName = getCountryParam(selectedCountry) || "Germany";

    dispatch(setReduxSelectedCountry(String(countryName)));
    dispatch(setVisaFees(Number(visaFees)));
    dispatch(setInsuranceFees(Number(insuranceFees)));
    dispatch(setReduxTravelers(Number(travelers)));
    dispatch(setRequiredDocuments(requiredDocuments || {}));
    dispatch(setRecommendedItems(recommendedItems || {}));
    dispatch(setAppliedDiscount(appliedDiscount || null));
    dispatch(setCouponCode(couponCode || ""));
    dispatch(setUserEmail(userEmail || ""));
    dispatch(setSelectedPaymentMethod(selectedPaymentMethod || "stripe"));
    dispatch(setGiftCardFees(giftCardFees || 0));
    dispatch(setTotalAmount(totalAmount || 0));
    dispatch(setInsuranceOnly(hasOnlyInsurance || false));

    // Store selected visa type information
    if (selectedVisaType) {
      dispatch(
        setSelectedVisaType({
          id: String(selectedVisaType.id || ""),
          name: String(selectedVisaType.name || ""),
          type: String(selectedVisaType.type || selectedVisaType.name || ""),
          subType: selectedVisaType.subType
            ? String(selectedVisaType.subType)
            : null,
          price: Number(selectedVisaType.price || 0),
          priceGBP: Number(selectedVisaType.priceGBP || 0),
          currency: String(selectedVisaType.currency || "INR"),
          purpose: Array.isArray(selectedVisaType.purpose)
            ? selectedVisaType.purpose.map((p) => String(p)).filter(Boolean)
            : [],
          country_symbol: String(selectedVisaType.country_symbol || ""),
          processing_time: String(selectedVisaType.processing_time || ""),
          validity: String(selectedVisaType.validity || ""),
          validity_period: String(selectedVisaType.validity_period || ""),
          duration_permitted: String(selectedVisaType.duration_permitted || ""),
          entries_permitted: String(selectedVisaType.entries_permitted || ""),
        })
      );
    }

    router.push(`/visa-checkout`);
  };

  // Send verification email via API
  const sendStudentVerification = async (email, returnTo = null) => {
    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email");
      return false;
    }

    // Check if email appears to be from an educational institution
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
      email.toLowerCase().includes(domain)
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
        body: JSON.stringify({ email, returnTo }),
      });

      const data = await resp.json();
      setIsSendingVerification(false);

      if (resp.ok) {
        setStudentVerificationSent(true);
        setEmailError("");
        // Start polling to check if email is verified
        startVerificationPolling(email);
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

  // Poll for email verification status
  const startVerificationPolling = (email) => {
    const pollInterval = setInterval(async () => {
      try {
        const resp = await fetch("/api/student/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await resp.json();

        if (resp.ok && data.verified) {
          setStudentVerified(true);
          setStudentVerificationSent(false); // Hide the "check inbox" message
          if (verificationPollRef.current) {
            clearInterval(verificationPollRef.current);
            verificationPollRef.current = null;
          } else {
            clearInterval(pollInterval);
          }

          // Show success toast
          try {
            if (typeof showSuccess === "function") {
              showSuccess("Email verified — student discount applied.");
            }
          } catch {
            /* ignore */
          }

          // If there's a pending payment, proceed to checkout
          if (
            pendingCheckoutQuery &&
            (selectedPaymentMethod === "apple" ||
              selectedPaymentMethod === "google")
          ) {
            router.push(`/payment/${selectedPaymentMethod}`);
          } else if (pendingCheckoutQuery) {
            router.push(`/visa-checkout`);
          } else {
            router.push("/get-the-visa");
          }
        }
      } catch {
        console.error("Error checking verification status:");
      }
    }, 3000); // Poll every 3 seconds
    verificationPollRef.current = pollInterval;

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (verificationPollRef.current) {
        clearInterval(verificationPollRef.current);
        verificationPollRef.current = null;
      }
    }, 10 * 60 * 1000);
  };

  // Listen for postMessage from verification page so we can immediately mark verified
  useEffect(() => {
    const onMessage = (e) => {
      try {
        const data = e.data || {};
        if (data && data.type === "student-email-verified") {
          // Optionally verify the email matches the one we expect (if we stored it)
          setStudentVerified(true);
          setStudentVerificationSent(false);
          // Clear any polling
          if (verificationPollRef.current) {
            clearInterval(verificationPollRef.current);
            verificationPollRef.current = null;
          }

          // Show toast
          try {
            if (typeof showSuccess === "function") {
              showSuccess("Email verified — student discount applied.");
            }
          } catch {
            /* ignore */
          }

          if (
            pendingCheckoutQuery &&
            (selectedPaymentMethod === "apple" ||
              selectedPaymentMethod === "google")
          ) {
            router.push(`/payment/${selectedPaymentMethod}`);
          } else if (pendingCheckoutQuery) {
            router.push(`/visa-checkout`);
          } else {
            router.push("/get-the-visa");
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pendingCheckoutQuery, selectedPaymentMethod, router, showSuccess]);

  // On mount, check for verified student email and auto-apply student discount if present
  useEffect(() => {
    try {
      const key = 'nuvisa.verifiedStudentEmail';
      const raw = localStorage.getItem(key);
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload && payload.email && payload.expiresAt && Date.now() < payload.expiresAt) {
          setStudentVerified(true);
          setStudentVerificationSent(false);

          // Pre-fill user email field if it's empty so user sees which address was verified
          try {
            if (!userEmail && payload.email) setUserEmailLocal(payload.email);
          } catch {
            /* ignore */
          }

          // Auto-apply STUDENT10 if not already applied
          if (!appliedDiscount || (appliedDiscount && appliedDiscount.code !== 'STUDENT10')) {
            setAppliedDiscountLocal({ code: 'STUDENT10', percentage: 10, description: 'Student discount' });
            setCouponCodeLocal('STUDENT10');
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Validate required documents before allowing express payment
  const validateRequiredDocuments = () => {
    const requiredFields = [
      "passport",
      "ukVisa",
      "photos",
      "bankStatements",
      "employmentProof",
    ];

    const missingDocs = requiredFields.filter(
      (field) => !requiredDocuments[field]
    );

    // Check if it's an insurance-only checkout (allowed even if required docs missing)
    const hasOnlyInsurance =
      recommendedItems.insuranceCertificate &&
      !recommendedItems.giftCard &&
      missingDocs.length === requiredFields.length;

    if (missingDocs.length > 0 && !hasOnlyInsurance) {
      // Mark validation errors and inform the user
      setValidationErrors(new Set(missingDocs));
      try {
        if (typeof showError === "function") {
          const pretty = missingDocs
            .map((d) =>
              d === "ukVisa" ? "UK visa" : d.replace(/([A-Z])/g, " $1")
            )
            .join(", ");
        }
      } catch {
        // ignore
      }
      return false;
    }

    return true;
  };

  // Apple Pay click handler
  const handleApplePayClick = async () => {
    // Validate required documents for express payment
    if (!validateRequiredDocuments()) return;

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

      const verificationSent = await sendStudentVerification(userEmail, "/visa-checkout");
      if (verificationSent) {
        // Store pending payment data to process after verification
        setPendingCheckoutQuery("proceed"); // Simple flag
        setSelectedLocalPaymentMethod("apple");
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
          : 159; // baseFee

    let visaFees = currentBaseFee * travelers;

    // Apply discount if available
    if (appliedDiscount) {
      const discountAmount = (visaFees * appliedDiscount.percentage) / 100;
      visaFees = visaFees - discountAmount;
    }

    const insuranceFees = recommendedItems.insuranceCertificate
      ? perDayInsurancePrice * insuranceDays * travelers
      : 0;
    const giftCardFees = recommendedItems.giftCard ? 188 * giftCardCount : 0;

    const totalAmount = Math.round(visaFees + insuranceFees + giftCardFees);

    // Check if Apple Pay is supported at all
    if (!window.ApplePaySession) {
      alert(
        "Apple Pay is not supported on this browser. Please use Safari on a supported Apple device."
      );
      return;
    }

    // Check device capability first
    const canMakePayments = ApplePaySession.canMakePayments();
    if (!canMakePayments) {
      alert(
        "Apple Pay is not available on this device. Please ensure you have Apple Pay set up with a valid payment method."
      );
      return;
    }

    // For development/testing on localhost or non-HTTPS
    if (
      window.location.hostname === "localhost" ||
      window.location.protocol !== "https:"
    ) {
      // Simulate successful Apple Pay flow
      const confirmPayment = confirm(
        `Process Apple Pay payment of £${totalAmount}?\n\n` +
        `This will redirect to payment processing page.`
      );

      if (confirmPayment) {
        // Update local selected payment method and persist to Redux, then navigate
        setSelectedLocalPaymentMethod("apple");
        dispatch(setSelectedPaymentMethod("apple"));
        router.push(`/visa-checkout`);
      }
      return;
    }

    try {
      // Build line items for detailed breakdown
      const lineItems = [
        {
          label: `Visa Processing Fee (${travelers} traveller${travelers > 1 ? "s" : ""
            })`,
          amount: Math.round(visaFees).toString(),
          type: "final",
        },
      ];

      if (recommendedItems.insuranceCertificate) {
        lineItems.push({
          label: `Insurance Certificate (${travelers} traveller${travelers > 1 ? "s" : ""
            })`,
          amount: insuranceFees.toString(),
          type: "final",
        });
      }

      if (recommendedItems.giftCard) {
        lineItems.push({
          label: `Gift Card (${giftCardCount} card${giftCardCount > 1 ? "s" : ""
            })`,
          amount: giftCardFees.toString(),
          type: "final",
        });
      }

      if (appliedDiscount) {
        lineItems.push({
          label: `Discount (${appliedDiscount.percentage}% off)`,
          amount: `-${Math.round(
            (currentBaseFee * travelers * appliedDiscount.percentage) / 100
          )}`,
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

          dispatch(setSelectedPaymentMethod("apple-pay"));
          router.push(`/visa-checkout`);
        } catch (error) {
          console.error("Apple Pay merchant validation failed:", error);
          suppressCancel = true;
          redirecting = true;
          try {
            alert(
              "Apple Pay setup required. Redirecting to standard checkout..."
            );
          } catch { }

          dispatch(setSelectedPaymentMethod("stripe"));
          router.push(`/visa-checkout`);
        }
      };

      session.onpaymentauthorized = (event) => {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        try {
          const stored = localStorage.getItem("paymentMetadata");
          const pm = stored ? JSON.parse(stored) : null;
          const appId = pm?.applicationId || null;
          if (appId) {
            router.push(
              `/application-step?application_id=${encodeURIComponent(appId)}`
            );
          } else {
            router.push("/payment-success");
          }
        } catch {
          console.error("Error parsing paymentMetadata for redirect:");
          router.push("/payment-success");
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
        alert(
          "Apple Pay error occurred. Please try a different payment method."
        );
      };

      session.begin();
    } catch (error) {
      console.error("Apple Pay initialization error:", error);
      alert(
        "Apple Pay is not available. Please try a different payment method."
      );
    }
  };

  // Google Pay click handler
  const handleGooglePayClick = async () => {
    // Validate required documents for express payment
    if (!validateRequiredDocuments()) return;

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

      const verificationSent = await sendStudentVerification(userEmail, `/payment/${selectedPaymentMethod}`);
      if (verificationSent) {
        // Store pending payment data to process after verification
        setPendingCheckoutQuery("proceed"); // Simple flag
        setSelectedLocalPaymentMethod("google");
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
          : 159; // baseFee

    let visaFees = currentBaseFee * travelers;

    // Apply discount if available
    if (appliedDiscount) {
      const discountAmount = (visaFees * appliedDiscount.percentage) / 100;
      visaFees = visaFees - discountAmount;
    }

    const insuranceFees = recommendedItems.insuranceCertificate
      ? perDayInsurancePrice * insuranceDays * travelers
      : 0;
    const giftCardFees = recommendedItems.giftCard ? 188 * giftCardCount : 0;

    const totalAmount = Math.round(visaFees + insuranceFees + giftCardFees);

    // Check if Google Pay is available
    if (!window.google || !window.google.payments) {
      alert(
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
                    router.push(
                      `/application-step?application_id=${encodeURIComponent(
                        appId
                      )}`
                    );
                  } else {
                    router.push("/payment-success");
                  }
                } catch {
                  console.error("Error parsing paymentMetadata for redirect:");
                  router.push("/payment-success");
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

      const isReadyToPay = await paymentsClient.isReadyToPay(
        isReadyToPayRequest
      );

      if (!isReadyToPay.result) {
        alert(
          "Google Pay is not available on this device or no payment methods are set up."
        );
        return;
      }

      // Build display items for detailed breakdown
      const displayItems = [
        {
          label: `Visa Processing Fee (${travelers} traveller${travelers > 1 ? "s" : ""
            })`,
          type: "LINE_ITEM",
          price: Math.round(visaFees).toString(),
        },
      ];

      if (recommendedItems.insuranceCertificate) {
        displayItems.push({
          label: `Insurance Certificate (${travelers} traveller${travelers > 1 ? "s" : ""
            })`,
          type: "LINE_ITEM",
          price: insuranceFees.toString(),
        });
      }

      if (recommendedItems.giftCard) {
        displayItems.push({
          label: `Gift Card (${giftCardCount} card${giftCardCount > 1 ? "s" : ""
            })`,
          type: "LINE_ITEM",
          price: giftCardFees.toString(),
        });
      }

      if (appliedDiscount) {
        displayItems.push({
          label: `Discount (${appliedDiscount.percentage}% off)`,
          type: "LINE_ITEM",
          price: `-${Math.round(
            (currentBaseFee * travelers * appliedDiscount.percentage) / 100
          )}`,
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
      const paymentData = await paymentsClient.loadPaymentData(
        paymentDataRequest
      );
    } catch (error) {
      console.error("Google Pay error:", error);
      if (error.statusCode === "CANCELED") {
        return;
      }
      alert(
        "Google Pay payment failed. Please try a different payment method."
      );
    }
  };

  return (
    <div className="w-full max-w-[1300px] gap-20 max-lg:flex-col flex items-start justify-center mt-5 px-5">
      <section className="w-full gap-3 flex flex-col items-start lg:max-w-[60%]">
        <section className="w-full">
          <div className="bg-[#24242D] flex justify-between text-white rounded-2xl shadow-sm p-4 max-sm:flex-col items-center">
            <h2 className="text-3xl md:text-[40px] font-gilroy-bold my-auto">
              Visa <br className="hidden sm:block" /> information
            </h2>

            <div className="flex max-sm:py-5 sm:flex-col flex-wrap gap-1">
              {/* Visa Types */}
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-[#24242D] stroke-[#24242D] mr-3 fill-white" />
                <span className="">Visa Types</span>
              </div>

              {/* Stay Duration */}
              <div className="flex items-center">
                <Home className="h-5 w-5 mr-3 text-white" />
                <span className="">Stay Duration</span>
              </div>

              {/* Term Type */}
              <div className="flex items-center">
                <ClipboardList className="h-5 w-5 text-[#24242D] stroke-[#24242D] mr-3 fill-white" />
                <span className="">Term Type</span>
              </div>

              {/* Entry */}
              <div className="flex items-center">
                <Clock className="h-5 w-5  mr-3 text-white" />
                <span className="">Entry</span>
              </div>
            </div>

            <div className="flex flex-col mr-10">
              <div className="grid gap-1">
                {/* Sticker */}
                <div
                  className="relative border-b border-dashed border-white/40 w-fit font-semibold"
                  onMouseEnter={() => setActiveTooltip("sticker")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <div className="flex items-center">
                    <span>Sticker</span>
                    {/* <HelpCircle className="ml-1 h-4 w-4 text-gray-400" /> */}
                  </div>
                  {/* <p className="text-gray-500 mt-1">30 Days</p> */}

                  {activeTooltip === "sticker" && (
                    <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm ">{tooltips.sticker}</p>
                      <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200"></div>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div
                  className="relative border-b border-dashed border-white/40 w-fit font-semibold"
                  onMouseEnter={() => setActiveTooltip("duration")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <div className="flex items-center">
                    <span>30 Days</span>
                    {/* <HelpCircle className="ml-1 h-4 w-4 text-gray-400" /> */}
                  </div>
                  {/* <p className="text-gray-500 mt-1">Short-term</p> */}

                  {activeTooltip === "duration" && (
                    <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm ">{tooltips.duration}</p>
                      <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200"></div>
                    </div>
                  )}
                </div>

                {/* Term Type */}
                <div
                  className="relative border-b border-dashed border-white/40 w-fit font-semibold"
                  onMouseEnter={() => setActiveTooltip("term")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <div className="flex items-center">
                    <span>Short Term</span>
                    {/* <HelpCircle className="ml-1 h-4 w-4 text-gray-400" /> */}
                  </div>
                  {/* <p className="text-gray-500 mt-1">Multiple</p> */}

                  {activeTooltip === "term" && (
                    <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm ">{tooltips.term}</p>
                      <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200"></div>
                    </div>
                  )}
                </div>

                {/* Entry */}
                <div
                  className="relative border-b border-dashed border-white/40 w-fit font-semibold"
                  onMouseEnter={() => setActiveTooltip("entry")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <div className="flex items-center">
                    <span>Multiple</span>
                    {/* <HelpCircle className="ml-1 h-4 w-4 text-gray-400" /> */}
                  </div>
                  {/* <p className="text-gray-500 mt-1">Multiple</p> */}

                  {activeTooltip === "entry" && (
                    <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="text-sm ">{tooltips.entry}</p>
                      <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-1 w-full ">
          {/* <h2 className="text-3xl font-gilroy-bold text-start mb-6">
            Explore Schengen Countries
          </h2> */}

          <div className="relative w-full">
            {/* Slider container */}
            <div className="overflow-hidden rounded-3xl shadow-lg">
              <div className="relative h-full w-full">
                <img
                  src={countries[currentIndex].image}
                  alt={countries[currentIndex].name}
                  className="w-full aspect-square object-cover"
                />
                {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h3 className="text-2xl font-gilroy-bold bg-[#24242D] flex items-center text-white">
                    {countries[currentIndex].name}
                  </h3>
                </div> */}
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 flex items-center text-black/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-300 z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 flex items-center text-black/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-300 z-10"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            <div className="flex justify-center gap-2 absolute bottom-5 left-1/2 -translate-x-1/2">
              {countries.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    resetTimer();
                  }}
                  className={`w-2.5 h-2.5 cursor-pointer rounded-full transition-all ${index === currentIndex ? "bg-white w-6" : "bg-white/50"
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnails for slider navigation */}
          <div className="flex justify-center gap-2 max-lg:hidden mt-8 overflow-auto w-full">
            {countries.map((country, index) => (
              <img
                key={country.id}
                src={country.image}
                alt={country.name}
                onClick={() => {
                  setCurrentIndex(index);
                  resetTimer();
                }}
                className={`w-20 aspect-square object-cover cursor-pointer rounded-xl border-2 transition-all border-white ${index === currentIndex
                  ? "border-none"
                  : "opacity-70 hover:opacity-100"
                  }`}
                style={{ boxSizing: "border-box" }}
              />
            ))}
          </div>
        </section>
      </section>
      <section className="bg-[#24242D] text-white lg:max-w-[40%] rounded-2xl p-6">
        <div className="w-full">
          {/* Header with pricing */}
          <div className="mb-6">
            <h1 className="text-3xl font-gilroy-bold mb-4">
              Schengen visa from the UK
            </h1>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-lg font-semibold line-through">
                £{calculateOriginalPrice()}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-gilroy-bold">
                  £{Math.round(calculateFinalPrice())}
                </span>
              </div>

              <div className="flex items-center gap-2 shadow-lg shadow-black/20 p-2 rounded-full">
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                  <UserIcon className="fill-white" />
                </div>
                <span className="text-xs font-gilroy-bold">Travellers</span>
                <QtyInput
                  value={travelers}
                  onChange={(next) => {
                    const n = Number(next);
                    setTravelersLocal(n);
                    dispatch(setReduxTravelers(Number(n)));
                  }}
                  min={1}
                />
              </div>

              {/* Country Selector */}
              <div className=" w-fit">
                <label htmlFor="country-select" className="sr-only">
                  Select Country
                </label>
                <select
                  id="country-select"
                  value={selectedCountry}
                  onChange={(e) => selectCountry(e.target.value)}
                  className="px-2 py-2 font-semibold rounded-full shadow-black/20 shadow-lg cursor-pointer focus:outline-none"
                >
                  {schengenCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 items-start">
            <div className="w-full">
              <CommonDatePicker
                label={"Start date"}
                selected={arrivalDate}
                onChange={handleArrivalDateChange}
                selectsStart
                startDate={arrivalDate}
                endDate={departureDate}
                minDate={new Date()}
                dayClassName={getDayClassName}
                className="!w-full bg-white/10 backdrop-blur-sm text-white rounded-lg px-4 py-3 font-semibold border-2 border-white/20 hover:border-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none"
                dateFormat="dd-MM-yyyy"
                wrapperClassName="!w-full"
                placeholderText="DD-MM-YYYY"
              />
            </div>

            <div className="w-full">
              <CommonDatePicker
                label={"End date"}
                selected={departureDate}
                onChange={handleDepartureDateChange}
                selectsEnd
                startDate={arrivalDate}
                endDate={departureDate}
                minDate={arrivalDate}
                dayClassName={getDayClassName}
                className="w-full bg-white/10 backdrop-blur-sm text-white rounded-lg px-4 py-3 font-semibold border-2 border-white/20 hover:border-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none"
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                maxDate={maxDepartureDate}
              />

              <p className="text-red-400 text-xs mt-2">
                {dateValidationErrors.exceedsLimit}
              </p>
            </div>
          </div>
          <div className="text-xs mt-2 space-y-1">
            {dateValidationErrors.pastDate && (
              <p className="text-red-400">{dateValidationErrors.pastDate}</p>
            )}
            {dateValidationErrors.dateOrder && (
              <p className="text-red-400">{dateValidationErrors.dateOrder}</p>
            )}
            {dateValidationErrors.tooClose && (
              <p className="text-red-400">{dateValidationErrors.tooClose}</p>
            )}
          </div>

          <p className="text-xs text-purple-300 mt-3">
            For a higher chance of approval, please select travel dates that are
            at least 15-20 days in the future.
          </p>
        </div>

        {/* Required Documents */}
        <ClientOnly>
          <div className="my-6">
            <div
              className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 ${validationErrors.size > 0
                ? "!bg-red-500/10 border !border-red-500 shadow-lg"
                : ""
                }`}
            >
              <h2
                className={`text-xl font-gilroy-bold p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-all duration-200`}
                onClick={() =>
                  setDocumentsAccordionOpen(!documentsAccordionOpen)
                }
              >
                <span className={`flex items-center gap-3`}>
                  <div className="w-6 h-6 rounded-full bg-[#7350FF] flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>Required Documents</span>
                  <div className="ml-2 px-2 py-1 bg-white/10 rounded-full text-xs font-medium">
                    {Object.values(requiredDocuments).filter(Boolean).length}/6
                    selected
                  </div>
                </span>
                <div
                  className={`transform transition-transform duration-300 ${documentsAccordionOpen ? "rotate-180" : "rotate-0"
                    }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </h2>

              <div
                className={`transition-all duration-300 ease-in-out ${documentsAccordionOpen
                  ? "max-h-[600px] opacity-100"
                  : "max-h-0 opacity-0"
                  }`}
              >
                <div className="px-4 pb-4">
                  <div className="h-px bg-white/10 mb-4"></div>
                  <div className="grid grid-cols-1 gap-3">
                    <div
                      className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border ${requiredDocuments.passport
                        ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                        : validationErrors.has("passport")
                          ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                      onClick={() => toggleRequiredDocument("passport")}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all ${requiredDocuments.passport
                          ? "bg-[#7350FF] border-2 border-[#7350FF]"
                          : "bg-transparent border-2 border-white/40"
                          }`}
                      >
                        {requiredDocuments.passport && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">Passport</span>
                        <p className="text-sm text-white/70 mt-1">
                          Minimum 6 months validity required
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border ${requiredDocuments.ukVisa
                        ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                        : validationErrors.has("ukVisa")
                          ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                      onClick={() => toggleRequiredDocument("ukVisa")}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all ${requiredDocuments.ukVisa
                          ? "bg-[#7350FF] border-2 border-[#7350FF]"
                          : "bg-transparent border-2 border-white/40"
                          }`}
                      >
                        {requiredDocuments.ukVisa && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">UK Visa</span>
                        <p className="text-sm text-white/70 mt-1">
                          Minimum 6 months validity required
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border ${requiredDocuments.photos
                        ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                        : validationErrors.has("photos")
                          ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                      onClick={() => toggleRequiredDocument("photos")}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all ${requiredDocuments.photos
                          ? "bg-[#7350FF] border-2 border-[#7350FF]"
                          : "bg-transparent border-2 border-white/40"
                          }`}
                      >
                        {requiredDocuments.photos && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">
                          Passport-Sized Photographs
                        </span>
                        <p className="text-sm text-white/70 mt-1">
                          Two 35mm x 45mm photos required
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border ${requiredDocuments.bankStatements
                        ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                        : validationErrors.has("bankStatements")
                          ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                      onClick={() => toggleRequiredDocument("bankStatements")}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all ${requiredDocuments.bankStatements
                          ? "bg-[#7350FF] border-2 border-[#7350FF]"
                          : "bg-transparent border-2 border-white/40"
                          }`}
                      >
                        {requiredDocuments.bankStatements && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">
                          Bank Statements
                        </span>
                        <p className="text-sm text-white/70 mt-1">
                          Last 3 months showing sufficient funds £50–£80/day per
                          person
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border ${requiredDocuments.employmentProof
                        ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                        : validationErrors.has("employmentProof")
                          ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                      onClick={() => toggleRequiredDocument("employmentProof")}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all ${requiredDocuments.employmentProof
                          ? "bg-[#7350FF] border-2 border-[#7350FF]"
                          : "bg-transparent border-2 border-white/40"
                          }`}
                      >
                        {requiredDocuments.employmentProof && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">
                          Employment Proof
                        </span>
                        <p className="text-sm text-white/70 mt-1">
                          Last 3 months payslips, or uni enrollment letter if
                          student
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border ${requiredDocuments.insurance
                        ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                        : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                      onClick={() => toggleRequiredDocument("insurance")}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all ${requiredDocuments.insurance
                          ? "bg-[#7350FF] border-2 border-[#7350FF]"
                          : "bg-transparent border-2 border-white/40"
                          }`}
                      >
                        {requiredDocuments.insurance && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">
                          Insurance Certificate
                        </span>
                        <p className="text-sm text-white/70 mt-1">
                          Must be valid for the entire duration of stay
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ClientOnly>

        {/* Recommended */}
        <div className="mb-6">
          <h2 className="text-xl font-gilroy-bold mb-4">Recommended</h2>

          {/* Insurance Certificate */}
          <div className="shadow-xl shadow-black/10 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="cursor-pointer rounded  transition-colors flex-1">
                <div className="flex items-center space-x-2">
                  <div
                    onClick={() =>
                      toggleRecommendedItem("insuranceCertificate")
                    }
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${recommendedItems.insuranceCertificate
                        ? "bg-[#7350FF] border border-transparent"
                        : "bg-white border border-gray-500"
                        }`}
                    >
                      {recommendedItems.insuranceCertificate && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span className="font-medium">Insurance certificate</span>
                  </div>
                  <ClientOnly
                    fallback={
                      <div className="flex items-center space-x-2 mt-1 ml-6">
                        <span className="text-lg font-semibold line-through">
                          £{Math.round(400 * 1.25 * travelers)}
                        </span>
                        <span className="font-gilroy-bold text-2xl">
                          £{400 * travelers}
                        </span>
                      </div>
                    }
                  >
                    <div className="flex items-center space-x-2 mt-1 ml-6">
                      <span className="text-lg font-semibold line-through">
                        £{Math.round(computedInsuranceTotal * 1.25)}
                      </span>
                      <span className="font-gilroy-bold text-2xl">
                        £{Math.round(calculateDiscountedInsurancePrice())}
                      </span>
                      {appliedDiscount && computedInsuranceTotal > 0 && (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                          -{appliedDiscount.percentage}%
                        </span>
                      )}
                    </div>
                  </ClientOnly>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Days Count Controls */}
                <div className="flex items-center space-x-2">
                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsuranceChange(-1);
                    }}
                    disabled={insuranceDays <= 1}
                    className={`size-4 border border-white/50 text-white bg-transparent rounded-full flex items-center justify-center text-sm font-gilroy-bold ${
                      insuranceDays <= 1
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    -
                  </button> */}
                  <span className="mx-2">{insuranceDays} Days</span>
                  {(() => {
                    let maxAllowedDays = 90;
                    if (
                      selectedVisaType &&
                      selectedVisaType.duration_permitted
                    ) {
                      maxAllowedDays = parseInt(
                        selectedVisaType.duration_permitted.replace(
                          /[^\d]/g,
                          ""
                        )
                      );
                    }
                    if (arrivalDate && departureDate) {
                      const tripDuration = Math.ceil(
                        (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
                      );
                      maxAllowedDays = Math.min(maxAllowedDays, tripDuration);
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Travel Dates Section */}
            <div className="mb-4">
              {selectedVisaType && selectedVisaType.duration_permitted && (
                <div className="mb-2 p-2 bg-purple-600/20 rounded-lg">
                  <p className="text-xs text-purple-200">
                    📅 Maximum stay: {selectedVisaType.duration_permitted}
                    {selectedVisaType.validity_period &&
                      ` | Visa valid for: ${selectedVisaType.validity_period}`}
                  </p>
                </div>
              )}
              {!selectedVisaType && (
                <div className="mb-2 p-2 bg-blue-600/20 rounded-lg">
                  <p className="text-xs text-blue-200">
                    📅 Default maximum stay: 90 days (Select a visa type for
                    specific limits)
                  </p>
                </div>
              )}
              <div className="flex items-end gap-8">
                <div className="flex items-center gap-2">
                  <QtyInput
                    value={travelers}
                    onChange={(next) => {
                      const n = Number(next);
                      setTravelersLocal(n);
                      dispatch(setReduxTravelers(Number(n)));
                    }}
                    min={1}
                  />
                  <label className="text-md">Travellers</label>
                </div>
              </div>
            </div>

            <div className=" rounded-xl  mb-6">
              <div className="flex items-center justify-between mb-1">
                <div className="cursor-pointer rounded  transition-colors flex-1">
                  <div className="flex items-center space-x-2">
                    <div
                      onClick={() => toggleRecommendedItem("giftCard")}
                      className="flex items-center space-x-2 cursor-pointer "
                    >
                      <div
                        className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${recommendedItems.giftCard
                          ? "bg-[#7350FF] border border-transparent"
                          : "bg-white border border-gray-500"
                          }`}
                      >
                        {recommendedItems.giftCard && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className="font-semibold">
                        NUvisa digital gift card
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 ml-6">
                      <span className="text-lg font-semibold line-through">
                        £{245 * giftCardCount}
                      </span>
                      <span className="font-gilroy-bold text-2xl">
                        £{Math.round(calculateDiscountedGiftCardPrice())}
                      </span>
                      {appliedDiscount && recommendedItems.giftCard && (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                          -{appliedDiscount.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <QtyInput
                  value={giftCardCount}
                  onIncrement={() => handleGiftCardChange(1)}
                  onDecrement={() => handleGiftCardChange(-1)}
                />
              </div>
              <p className="">
                Give the gift of unforgettable memories this Christmas! Order
                now and your digital gift card will be sent to your email
                address immediately.
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-gilroy-bold mb-4">What's Included</h2>

              <div className="space-y-4 font-gilroy-medium !font-semibold">
                <div className="flex items-center space-x-3">
                  <div className="w-10 aspect-square rounded-full flex items-center justify-center">
                    {/* <Clock className="size-6 text-white" /> */}
                    <img src="/image/calendar.jpg" alt="" />
                  </div>
                  <div>
                    <h3 className="">Secure the earliest appointment slot</h3>
                    <p className="font-semibold">(In 10 days or less)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 aspect-square rounded-full flex items-center justify-center">
                    {/* <Clock className="size-6 text-white" /> */}
                    <img
                      src="/image/flights.jpg"
                      alt=""
                      className="w-10 aspect-square"
                    />
                  </div>
                  <div>
                    <h3 className="">Flexible flights and hotels</h3>
                    <p className="">(Keeping your financials risk-free)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 min-w-10 aspect-square rounded-full flex items-center justify-center">
                    {/* <Clock className="size-6 text-white" /> */}
                    <img
                      src="/image/calendar.jpg"
                      alt=""
                      className="w-10 aspect-square"
                    />
                  </div>
                  <div>
                    <h3 className="">Complete application assistance</h3>
                    <p className="">
                      (NUVisa prepares documents and forms for submission at the
                      visa application centre)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          {validationErrors.size > 0 && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-300 text-sm font-medium">
                Confirm required documents
              </p>
            </div>
          )}

          {/* Discount Code Section */}
          <div className="space-y-3 mb-6">
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
                    className={`w-full border ${couponError ? "border-red-400" : "border-gray-500"
                      } bg-[#24242D] text-white rounded-md p-2 text-sm ${couponError
                        ? "outline-none ring-2 ring-red-400"
                        : "focus:outline-none focus:ring-2 focus:ring-purple-500"
                      }`}
                    disabled={appliedDiscount}
                  />
                </div>
                {!appliedDiscount ? (
                  <button
                    onClick={applyCouponCode}
                    className="px-4 py-2 bg-white text-black text-sm rounded-md hover:bg-gray-200 transition-colors font-medium"
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
                <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-600/20 p-2 rounded-md">
                  <span>
                    ✓ {appliedDiscount.description} (
                    {appliedDiscount.percentage}% off) applied!
                  </span>
                </div>
              )}

              <div className="text-xs text-gray-400">
                <p className="font-medium text-gray-300">
                  Available discounts:
                </p>
                <ul className="list-none mt-1 space-y-1">
                  <li>
                    • <span className="font-semibold">STUDENT10</span> - 10%
                    student discount (requires student email verification)
                  </li>
                  <li>
                    • <span className="font-semibold">GROUP20</span> - 20% group
                    discount (automatically applied when 3 or more travellers
                    are added)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email Verification Section - Shows when student discount is applied */}
          {appliedDiscount &&
            appliedDiscount.description.toLowerCase().includes("student") && (
              <div className="space-y-3 mb-6">
                <h2 className="font-medium text-lg">
                  Student Verification Required
                </h2>
                <div className="space-y-2">
                  <div className="text-sm text-yellow-300 mb-2">
                    <span className="font-medium">📧 Email Verification</span> -
                    Please verify your student email to continue with the
                    discount
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmailLocal(e.target.value)}
                        placeholder="Enter your student email (e.g., you@student.uni.ac.uk)"
                        className={`w-full border ${emailError ? "border-red-400" : "border-gray-500"
                          } bg-[#24242D] text-white rounded-md p-2 text-sm ${emailError
                            ? "outline-none ring-2 ring-red-400"
                            : "focus:outline-none focus:ring-2 focus:ring-purple-500"
                          }`}
                        disabled={studentVerified}
                      />
                    </div>
                    {!studentVerified ? (
                      <button
                        onClick={() => sendStudentVerification(userEmail)}
                        disabled={isSendingVerification || !userEmail}
                        className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {isSendingVerification ? "Sending..." : "Verify Email"}
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
                    <div className="text-sm text-green-400 bg-green-600/20 p-2 rounded-md">
                      ✓ Verification email sent! Please check your inbox and
                      click the verification link.
                    </div>
                  )}

                  {studentVerified && (
                    <div className="text-sm text-green-400 bg-green-600/20 p-2 rounded-md">
                      ✓ Student email verified! You can now proceed with the
                      student discount.
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Express Checkout Section */}
          <div className="space-y-3 mb-6">
            <h2 className="font-medium text-lg">Payment Methods</h2>

            {/* Apple Pay & Google Pay - Express Checkout */}
            <div className="space-y-2">
              <div className="text-sm text-gray-300 mb-2">
                <span className="font-medium text-green-400">
                  📱 Express Checkout
                </span>{" "}
                - Quick setup with saved payment methods
              </div>

              {/* Apple Pay & Google Pay - Official Branded Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* Apple Pay Button - Official Style */}
                <button
                  onClick={handleApplePayClick}
                  className="group relative flex items-center justify-center bg-black text-white rounded-lg px-6 py-3 text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm"
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
                  className="group relative flex items-center justify-center bg-white text-gray-800 rounded-lg px-6 py-3 text-sm font-medium hover:shadow-md transition-all duration-200 shadow-sm border border-gray-200"
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
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleGetVisa}
            className="group flex w-full justify-between items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[20px] py-3.5 rounded-full cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]"
          >
            <span className="mr-3 text-xl font-semibold">
              {selectedPaymentMethod === "stripe"
                ? "CONTINUE WITH CREDIT CARD"
                : selectedPaymentMethod === "klarna"
                  ? "CONTINUE WITH KLARNA"
                  : "CONTINUE TO CHECKOUT"}
            </span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>

          {/* Footer Info */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <MedalIcon className="size-5 text-white/70" />
              <span>99.3% Visa approval rate</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <ShieldCheckIcon className="size-5 text-white/70" />
              <span>100% Risk free - Get your visa or full refund</span>
            </div>
          </div>

          {/* Get Help Button */}
          <button className="mt-4 w-fit rounded-full border border-white text-white py-1.5 hover:border-purple-500 transition-colors text-sm px-4 cursor-pointer">
            <img
              src="/icons/whatsapp.svg"
              alt="Get Help"
              className="inline-block mr-1 size-5 text-white"
            />
            Get Help
          </button>
        </div>
      </section>
    </div>
  );
};

export default CountrySlider;
