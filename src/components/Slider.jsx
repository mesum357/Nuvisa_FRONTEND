"use client";
import Image from "next/image";
import { getCountryConfig } from "@/constants/countryConfig";
import { useAppDispatch, useAppSelector } from "@/store";
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
  setReduxInsuranceCount,
  setReduxGiftCardCount,
  triggerDocumentValidation,
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
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import QtyInput from "./QtyInput";
import "react-datepicker/dist/react-datepicker.css";
import { FaApple } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import { CommonDatePicker } from "@/ui/date-picker";
import { useSliderContent } from "@/hooks/useSliderContent";
import SimpleAlert from "./SimpleAlert";
import ConfirmationModal from "./ConfirmationModal";
import StripeProvider from "./StripeProvider";
import ExpressPaymentRequestButton from "./ExpressPaymentRequestButton";

const CountrySlider = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showError, showSuccess } = useToast();
  const MIN_SAFE_DAYS_BEFORE_TRAVEL = 15;

  const { content: sliderContent } = useSliderContent();
  const visaState = useAppSelector((state) => state.visa);

  const countries = [
    {
      id: 1,
      name: "Germany",
      image: "/image/country/Germany.jpg",
    },
    {
      id: 2,
      name: "Netherlands",
      image: "/image/country/Netherlands.jpg",
    },
    {
      id: 3,
      name: "Belgium",
      image: "/image/country/Belgium.jpg",
    },
    {
      id: 4,
      name: "France",
      image: "/image/country/France.jpg",
    },
    {
      id: 5,
      name: "Italy",
      image: "/image/country/Italy.jpg",
    },
    {
      id: 6,
      name: "Bulgaria",
      image: "/image/country/Bulgaria.jpg",
    },
    {
      id: 7,
      name: "Estonia",
      image: "/image/country/Estonia.jpg",
    },
    {
      id: 8,
      name: "Hungary",
      image: "/image/country/Hungary.jpg",
    
    },
    {
      id: 9,
      name: "Portugal",
      image: "/image/country/Portugal.jpg",
    },
    {
      id: 10,
      name: "Iceland",
      image: "/image/country/Iceland.jpg",
    },
    {
      id: 11,
      name: "Poland",
      image: "/image/country/Poland.jpg",
    },
    {
      id: 12,
      name: "NORWAY",
      image: "/image/country/Norway.jpg",
    },
    {
      id: 13,
      name: "Switzerland",
      image: "/image/country/Switzerland.jpg",
    },
    {
      id: 14,
      name: "Spain",
      image: "/image/country/Spain.jpg",
    },
    {
      id: 15,
      name: "Malta",
      image: "/image/country/Malta.jpg",
    },
    {
      id: 16,
      name: "Luxembourg",
      image: "/image/country/Luxembourg.jpg",
    },
    {
      id: 17,
      name: "Greece",
      image: "/image/country/Greece.jpg",
    },
    {
      id: 18,
      name: "Finland",
      image: "/image/country/Finland.jpg",
    },
  ];

  const schengenCountries = [
    "Austria",
    "Belgium",
    "Bulgaria",
    "Czech Republic",
    "Denmark",
    "Estonia",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Hungary",
    "Iceland",
    "Italy",
    "Latvia",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Netherlands",
    "Norway",
    "Poland",
    "Portugal",
    "Romania",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
    "Switzerland",
  ];

  const [_isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountryLocal] = useState("France");
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [insuranceDays, setInsuranceDays] = useState(0);

  // Use Redux state instead of local state
  const travelers = visaState.travelers || 1;
  const insuranceCount = visaState.insuranceCount || 0;
  const giftCardCount = visaState.giftCardCount || 0;
  // Default arrival = 4 weeks from today, default departure = arrival + 14 days (15 days inclusive)
  const computeDefaultArrival = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 28); // 4 weeks from today
    return d;
  };

  const initialArrivalDate = computeDefaultArrival();
  const computeDefaultDeparture = (arrival) => {
    const d = new Date(arrival);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 14); // 14 days ahead to show 15 days inclusive
    return d;
  };

  const initialDepartureDate = computeDefaultDeparture(initialArrivalDate);

  const parsePersistedDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const persistedArrivalDate = parsePersistedDate(visaState.arrivalDate);
  const persistedDepartureDate = parsePersistedDate(visaState.departureDate);

  const [arrivalDate, setArrivalDateLocal] = useState(
    () => persistedArrivalDate || initialArrivalDate
  );
  const [departureDate, setDepartureDateLocal] = useState(() => {
    if (persistedDepartureDate) return persistedDepartureDate;
    if (persistedArrivalDate) return computeDefaultDeparture(persistedArrivalDate);
    return initialDepartureDate;
  });
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
  const [insuranceCouponCode, setInsuranceCouponCode] = useState("");
  const [insuranceCouponError, setInsuranceCouponError] = useState("");
  // Read appliedDiscount from Redux instead of local state
  const appliedDiscount = visaState.appliedDiscount;
  const [appliedInsuranceDiscount, setAppliedInsuranceDiscount] =
    useState(null);
  const [insuranceAutoApplied, setInsuranceAutoApplied] = useState(false);
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
  const expressPaymentButtonRef = useRef(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState({
    applePay: false,
    googlePay: false,
  });
  const hasCheckedAvailabilityRef = useRef(false);
  
  // Refs to track previous values for threshold crossing detection
  const prevInsuranceCountForToastRef = useRef(insuranceCount);
  const isInitialMountInsuranceToastRef = useRef(true);

  const [userEmail, setUserEmailLocal] = useState("");
  const [emailError, setEmailError] = useState("");
  const [documentsAccordionOpen, setDocumentsAccordionOpen] = useState(false);

  // Unified alert and confirm state (system schema)
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
  });
  const showAlert = (title, message) =>
    setAlertState({ isOpen: true, title, message });
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

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

  // Function to validate dates (no past dates, correct order, and visa limit)
  // Returns only one error at a time, prioritized: pastDate > dateOrder > exceedsLimit
  const validateDates = (arrival, departure, visaType) => {
    const errors = {};

    if (!arrival) {
      return errors;
    }

    const arrivalDate = new Date(arrival);
    const _departureDate = new Date(departure);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setHours(0, 0, 0, 0);
    fourWeeksFromNow.setDate(today.getDate() + 28);

    // Priority 1: Check for past dates or dates before 4 weeks
    if (arrivalDate < today) {
      errors.pastDate = "Arrival date cannot be in the past";
      return errors; // Early return - highest priority
    }

    if (arrivalDate < fourWeeksFromNow) {
      errors.pastDate =
        "Your travel dates are too close. Embassies take up to 15 days after your visa appointment, ideal gap between applying and travel date is 4-6 weeks. You can still proceed if your travel dates are flexible";
      return errors; // Early return - highest priority
    }

    // Priority 2: Check date order (only if arrival date is valid)
    if (departure) {
      const departureDate = new Date(departure);

      if (arrivalDate > departureDate) {
        errors.dateOrder = "Departure date must be after arrival date";
        return errors; // Early return - second priority
      }

      // Priority 3: Check trip duration limits (only if dates are in correct order)
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

    // If arrival date is at least 4 weeks away and no errors, show success message
    if (
      arrivalDate >= fourWeeksFromNow &&
      !errors.dateOrder &&
      !errors.exceedsLimit
    ) {
      // Calculate 48 hours (2 days) from today
      const nextDay = new Date(today);
      nextDay.setDate(nextDay.getDate() + 2);
      // Format date like "6 November"
      const options = { day: "numeric", month: "long" };
      const formattedDate = nextDay.toLocaleDateString("en-US", options);
      errors.tooClosee = `Complete your application by ${formattedDate} for timely visa process.`;
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
      minDeparture.setDate(minDeparture.getDate() + 1);

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

    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setHours(0, 0, 0, 0);
    fourWeeksFromNow.setDate(today.getDate() + 28);

    // 🩶 Past dates
    if (date < today) return "!text-gray-400 !bg-transparent !important";

    // 🔴 All dates before 4 weeks (from today to before 4 weeks) should be red
    if (date >= today && date < fourWeeksFromNow)
      return "!text-red-400 !bg-transparent !important";

    // 🟢 On or after 4 weeks from today
    if (date >= fourWeeksFromNow)
      return "!text-green-400 !bg-transparent !important";

    return "!bg-transparent !text-white";
  };

  // const getDayClassName = (date) => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const safeDateThreshold = new Date();
  //   safeDateThreshold.setHours(0, 0, 0, 0);
  //   safeDateThreshold.setDate(today.getDate() + MIN_SAFE_DAYS_BEFORE_TRAVEL);

  //   if (date < safeDateThreshold && date >= today) {
  //     return "dangerous-date";
  //   }
  //   if (date >= today) {
  //     return "comfortable-date";
  //   }
  // };

  useEffect(() => {
    try {
      if (!visaState.arrivalDate) {
        const arrivalStr = getLocalDateString(arrivalDate || initialArrivalDate);
        dispatch(setArrivalDate(arrivalStr));
      }

      if (!visaState.departureDate) {
        const fallbackDeparture =
          departureDate ||
          (arrivalDate
            ? computeDefaultDeparture(arrivalDate)
            : initialDepartureDate);
        dispatch(setDepartureDate(getLocalDateString(fallbackDeparture)));
      }

      if (!visaState.arrivalDate || !visaState.departureDate) {
        const errors = validateDates(
          arrivalDate || initialArrivalDate,
          departureDate ||
            (arrivalDate
              ? computeDefaultDeparture(arrivalDate)
              : initialDepartureDate),
          selectedVisaType
        );
        setDateValidationErrors(errors);
      }
    } catch {}
  }, [
    arrivalDate,
    departureDate,
    visaState.arrivalDate,
    visaState.departureDate,
    selectedVisaType,
  ]);

  useEffect(() => {
    const persistedArrival = parsePersistedDate(visaState.arrivalDate);
    if (persistedArrival) {
      const persistedMs = persistedArrival.getTime();
      if (!arrivalDate || arrivalDate.getTime() !== persistedMs) {
        setArrivalDateLocal(persistedArrival);
      }
    } else if (!visaState.arrivalDate && !arrivalDate) {
      setArrivalDateLocal(initialArrivalDate);
    }

    const persistedDeparture = parsePersistedDate(visaState.departureDate);
    if (persistedDeparture) {
      const persistedMs = persistedDeparture.getTime();
      if (!departureDate || departureDate.getTime() !== persistedMs) {
        setDepartureDateLocal(persistedDeparture);
      }
    } else if (!visaState.departureDate && !departureDate) {
      const fallbackDeparture = arrivalDate
        ? computeDefaultDeparture(arrivalDate)
        : initialDepartureDate;
      setDepartureDateLocal(fallbackDeparture);
    }
  }, [
    visaState.arrivalDate,
    visaState.departureDate,
    arrivalDate,
    departureDate,
  ]);

  let maxDepartureDate = null;
  if (arrivalDate) {
    maxDepartureDate = new Date(arrivalDate);

    const visaTypeDuration = selectedVisaType
      ? parseDurationDays(selectedVisaType.duration_permitted)
      : 90;
    const maxStayDuration = visaTypeDuration || 90;

    maxDepartureDate.setDate(arrivalDate.getDate() + maxStayDuration - 1);
  }

  // Compute current trip duration helpers
  const tripDays =
    arrivalDate && departureDate
      ? Math.ceil((departureDate - arrivalDate) / (1000 * 60 * 60 * 24))
      : null;
  const isAtLeastFourWeeks = typeof tripDays === "number" && tripDays >= 28;
  const isLessThanFourWeeks = typeof tripDays === "number" && tripDays < 28;

  const [requiredDocuments, setRequiredDocumentsLocal] = useState(() => ({
    passport: false,
    ukVisa: false,
    photos: false,
    bankStatements: false,
    employmentProof: false,
    insurance: false,
  }));

  // Use Redux state for recommendedItems
  const recommendedItems = visaState.recommendedItems;

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

  // Sync requiredDocuments to Redux whenever it changes
  useEffect(() => {
    dispatch(setRequiredDocuments(requiredDocuments));
  }, [requiredDocuments, dispatch]);

  // Listen for document validation trigger from other components
  useEffect(() => {
    if (visaState.triggerDocumentValidation !== undefined) {
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

      if (missingDocs.length > 0) {
        setValidationErrors(new Set(missingDocs));
        // Scroll to documents section
        const documentsSection = document.querySelector(
          "[data-documents-section]"
        );
        if (documentsSection) {
          documentsSection.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  }, [visaState.triggerDocumentValidation, requiredDocuments]);

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
    const isCurrentlyChecked = recommendedItems[itemKey];
    const newRecommendedItems = {
      ...recommendedItems,
      [itemKey]: !isCurrentlyChecked,
    };
    dispatch(setRecommendedItems(newRecommendedItems));

    if (itemKey === "giftCard") {
      if (isCurrentlyChecked) {
        // Unchecking gift card
        dispatch(setReduxGiftCardCount(0));
        dispatch(setGiftCardFees(0));
      } else {
        // Checking gift card
        dispatch(setReduxGiftCardCount(1));
        dispatch(setGiftCardFees(159));
      }
    } else if (itemKey === "insuranceCertificate") {
      if (isCurrentlyChecked) {
        // Unchecking insurance certificate
        setInsuranceDays(0);
        dispatch(setReduxInsuranceCount(0));
      } else {
        // Checking insurance certificate
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
          setInsuranceDays(1); // Default to 1 day when no dates provided
        }
        dispatch(setReduxInsuranceCount(1));
      }
    }
  };

  const _toggleOption = (option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const baseFee = (() => {
    const v =
      sliderContent?.visa_base_price_gbp ??
      sliderContent?.base_fee_gbp ??
      sliderContent?.visa_price_gbp ??
      sliderContent?.visa_price ??
      sliderContent?.base_fee;
    const num = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(num) ? num : 129;
  })();

  const strikeOutPrice = (() => {
    const v =
      sliderContent?.strike_out_price_gbp ??
      sliderContent?.strike_out_price ??
      sliderContent?.original_price_gbp ??
      sliderContent?.original_price;
    const num = typeof v === "string" ? parseFloat(v) : Number(v);
    return Number.isFinite(num) ? num : 200;
  })();

  const perDayInsurancePrice = 2;
  const originalPerDayInsurancePrice = 3;

  // Memoize expensive calculations
  const currentVisaFeePerTraveler = useMemo(() => {
    if (selectedVisaType?.priceGBP) return Number(selectedVisaType.priceGBP);
    if (selectedVisaType?.price) {
      const converted = Math.round(Number(selectedVisaType.price) / 100);
      if (converted > 0) return converted;
    }
    return baseFee;
  }, [selectedVisaType?.priceGBP, selectedVisaType?.price, baseFee]);

  const effectiveInsuranceDays = useMemo(() => {
    if (!recommendedItems.insuranceCertificate) return 0;
    return Math.max(insuranceDays || 0, 1);
  }, [recommendedItems.insuranceCertificate, insuranceDays]);

  const discountedInsuranceBase = useMemo(() => {
    if (
      !recommendedItems.insuranceCertificate ||
      !insuranceCount ||
      insuranceCount <= 0
    ) {
      return 0;
    }
    return perDayInsurancePrice * effectiveInsuranceDays * insuranceCount;
  }, [recommendedItems.insuranceCertificate, insuranceCount, effectiveInsuranceDays]);

  const originalInsuranceBase = useMemo(() => {
    if (
      !recommendedItems.insuranceCertificate ||
      !insuranceCount ||
      insuranceCount <= 0
    ) {
      return 0;
    }
    return (
      originalPerDayInsurancePrice *
      effectiveInsuranceDays *
      insuranceCount
    );
  }, [recommendedItems.insuranceCertificate, insuranceCount, effectiveInsuranceDays]);

  const computedInsuranceTotal = discountedInsuranceBase;

  const tooltips = {
    sticker:
      "A visa sticker is a physical visa label attached to your passport. It contains your personal details, visa type, validity period, and number of entries allowed.",
    duration: [
      "You can stay for a maximum of 90 days for any 180 day period.",
      "If your visa is valid for less than 90 days, you can only stay upto your visa validity.",
    ],
    term: "Short-term visas are typically issued for visits under 90 days. They're commonly used for tourism, business trips, or visiting family/friends.",
    entry:
      "Multiple entry allows you to enter the country multiple times during the visa validity period without needing to apply for a new visa each time.",
  };

  const _handleTravelerChange = (increment) => {
    const newValue = travelers + increment;
    if (newValue >= 1) {
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
      if (clampedValue > 0 && !recommendedItems.insuranceCertificate) {
        const next = { ...recommendedItems, insuranceCertificate: true };
        dispatch(setRecommendedItems(next));
      }
    }
  };

  const handleGiftCardChange = (increment) => {
    const newValue = giftCardCount + increment;
    if (newValue < 0) return;
    dispatch(setReduxGiftCardCount(Number(newValue)));
    if (newValue > 0 && !recommendedItems.giftCard) {
      const next = { ...recommendedItems, giftCard: true };
      dispatch(setRecommendedItems(next));
    } else if (newValue === 0 && recommendedItems.giftCard) {
      const next = { ...recommendedItems, giftCard: false };
      dispatch(setRecommendedItems(next));
    }
  };

  const handleInsuranceChange = (increment) => {
    const newValue = insuranceCount + increment;
    if (newValue < 0 || newValue > travelers) return;
    dispatch(setReduxInsuranceCount(Number(newValue)));
    if (newValue > 0 && !recommendedItems.insuranceCertificate) {
      const next = { ...recommendedItems, insuranceCertificate: true };
      dispatch(setRecommendedItems(next));
    } else if (newValue === 0 && recommendedItems.insuranceCertificate) {
      const next = { ...recommendedItems, insuranceCertificate: false };
      dispatch(setRecommendedItems(next));
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

  // Memoize calculateFinalPrice to prevent recalculation on every render
  const finalPrice = useMemo(() => {
    // Base discounted prices (not original prices)
    const baseDiscountedVisaFees = currentVisaFeePerTraveler * travelers;
    const baseDiscountedInsuranceFees = discountedInsuranceBase;
    const baseDiscountedGiftCardFees = recommendedItems.giftCard
      ? 159 * giftCardCount
      : 0;

    // Check if any component qualifies for quantity discount (3+)
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const travelersQualify = travelers >= 3;
    const insuranceQualify = effectiveInsuranceCount >= 3;
    const giftCardQualify = giftCardCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaPrice = baseDiscountedVisaFees;
    let finalInsurancePrice = baseDiscountedInsuranceFees;
    let finalGiftCardPrice = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (finalVisaPrice * 20) / 100;
      finalVisaPrice = finalVisaPrice - quantityDiscount;
    }
    if (insuranceQualify && recommendedItems.insuranceCertificate) {
      const quantityDiscount = (finalInsurancePrice * 20) / 100;
      finalInsurancePrice = finalInsurancePrice - quantityDiscount;
    }
    if (giftCardQualify && recommendedItems.giftCard) {
      const quantityDiscount = (finalGiftCardPrice * 20) / 100;
      finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (travelersQualify && finalVisaPrice === baseDiscountedVisaFees) {
          const quantityDiscount = (finalVisaPrice * 20) / 100;
          finalVisaPrice = finalVisaPrice - quantityDiscount;
        }
        if (insuranceQualify && recommendedItems.insuranceCertificate && finalInsurancePrice === baseDiscountedInsuranceFees) {
          const quantityDiscount = (finalInsurancePrice * 20) / 100;
          finalInsurancePrice = finalInsurancePrice - quantityDiscount;
        }
        if (giftCardQualify && recommendedItems.giftCard && finalGiftCardPrice === baseDiscountedGiftCardFees) {
          const quantityDiscount = (finalGiftCardPrice * 20) / 100;
          finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
      const studentDiscount = (finalVisaPrice * 10) / 100;
      finalVisaPrice = finalVisaPrice - studentDiscount;
      if (recommendedItems.insuranceCertificate) {
        const studentDiscount = (finalInsurancePrice * 10) / 100;
        finalInsurancePrice = finalInsurancePrice - studentDiscount;
      }
      if (recommendedItems.giftCard) {
        const studentDiscount = (finalGiftCardPrice * 10) / 100;
        finalGiftCardPrice = finalGiftCardPrice - studentDiscount;
      }
    }

    return finalVisaPrice + finalInsurancePrice + finalGiftCardPrice;
  }, [
    currentVisaFeePerTraveler,
    travelers,
    discountedInsuranceBase,
    recommendedItems,
    insuranceCount,
    giftCardCount,
    appliedDiscount
  ]);

  // Memoize calculateVisaAndInsurancePrice
  const visaAndInsurancePrice = useMemo(() => {
    // Calculate only visa + insurance (excluding gift cards) for main price display
    const baseDiscountedVisaFees = currentVisaFeePerTraveler * travelers;
    const baseDiscountedInsuranceFees = discountedInsuranceBase;

    // Check if any component qualifies for quantity discount (3+)
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const travelersQualify = travelers >= 3;
    const insuranceQualify = effectiveInsuranceCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaPrice = baseDiscountedVisaFees;
    let finalInsurancePrice = baseDiscountedInsuranceFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (finalVisaPrice * 20) / 100;
      finalVisaPrice = finalVisaPrice - quantityDiscount;
    }
    if (insuranceQualify && recommendedItems.insuranceCertificate) {
      const quantityDiscount = (finalInsurancePrice * 20) / 100;
      finalInsurancePrice = finalInsurancePrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      const giftCardQualify = giftCardCount >= 3;
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (travelersQualify && finalVisaPrice === baseDiscountedVisaFees) {
          const quantityDiscount = (finalVisaPrice * 20) / 100;
          finalVisaPrice = finalVisaPrice - quantityDiscount;
        }
        if (insuranceQualify && recommendedItems.insuranceCertificate && finalInsurancePrice === baseDiscountedInsuranceFees) {
          const quantityDiscount = (finalInsurancePrice * 20) / 100;
          finalInsurancePrice = finalInsurancePrice - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
      const studentDiscount = (finalVisaPrice * 10) / 100;
      finalVisaPrice = finalVisaPrice - studentDiscount;
      if (recommendedItems.insuranceCertificate) {
        const studentDiscount = (finalInsurancePrice * 10) / 100;
        finalInsurancePrice = finalInsurancePrice - studentDiscount;
      }
    }

    return finalVisaPrice + finalInsurancePrice;
  }, [
    currentVisaFeePerTraveler,
    travelers,
    discountedInsuranceBase,
    insuranceCount,
    recommendedItems,
    appliedDiscount,
    giftCardCount
  ]);

  // Memoize visa-only price (without insurance) for traveller card display
  const visaOnlyPrice = useMemo(() => {
    const baseDiscountedVisaFees = currentVisaFeePerTraveler * travelers;

    // Check if travelers qualify for quantity discount (3+)
    const travelersQualify = travelers >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaPrice = baseDiscountedVisaFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (finalVisaPrice * 20) / 100;
      finalVisaPrice = finalVisaPrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
      const insuranceQualify = effectiveInsuranceCount >= 3;
      const giftCardQualify = giftCardCount >= 3;
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (travelersQualify && finalVisaPrice === baseDiscountedVisaFees) {
          const quantityDiscount = (finalVisaPrice * 20) / 100;
          finalVisaPrice = finalVisaPrice - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
      const studentDiscount = (finalVisaPrice * 10) / 100;
      finalVisaPrice = finalVisaPrice - studentDiscount;
    }

    return finalVisaPrice;
  }, [
    currentVisaFeePerTraveler,
    travelers,
    insuranceCount,
    appliedDiscount,
    giftCardCount
  ]);

  // Memoize calculateDiscountedInsurancePrice
  const discountedInsurancePrice = useMemo(() => {
    // Use same logic as calculateFinalPrice for insurance
    const baseDiscountedInsuranceFees = discountedInsuranceBase;

    // Check if insurance qualifies for quantity discount (3+)
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const insuranceQualify = effectiveInsuranceCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalInsurancePrice = baseDiscountedInsuranceFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (insuranceQualify) {
      const quantityDiscount = (finalInsurancePrice * 20) / 100;
      finalInsurancePrice = finalInsurancePrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      const travelersQualify = travelers >= 3;
      const giftCardQualify = giftCardCount >= 3;
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (insuranceQualify && finalInsurancePrice === baseDiscountedInsuranceFees) {
          const quantityDiscount = (finalInsurancePrice * 20) / 100;
          finalInsurancePrice = finalInsurancePrice - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount && recommendedItems.insuranceCertificate) {
      const studentDiscount = (finalInsurancePrice * 10) / 100;
      finalInsurancePrice = finalInsurancePrice - studentDiscount;
    }

    return finalInsurancePrice;
  }, [
    discountedInsuranceBase,
    insuranceCount,
    travelers,
    recommendedItems,
    appliedDiscount,
    giftCardCount
  ]);

  // Memoize calculateDiscountedGiftCardPrice
  const discountedGiftCardPrice = useMemo(() => {
    // Use same logic as calculateFinalPrice for gift cards
    const baseDiscountedGiftCardFees = recommendedItems.giftCard
      ? 159 * giftCardCount
      : 0;

    // Check if gift cards qualify for quantity discount (3+)
    const giftCardQualify = giftCardCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalGiftCardPrice = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (giftCardQualify) {
      const quantityDiscount = (finalGiftCardPrice * 20) / 100;
      finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      const travelersQualify = travelers >= 3;
      const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
      const insuranceQualify = effectiveInsuranceCount >= 3;
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (giftCardQualify && finalGiftCardPrice === baseDiscountedGiftCardFees) {
          const quantityDiscount = (finalGiftCardPrice * 20) / 100;
          finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount && recommendedItems.giftCard) {
      const studentDiscount = (finalGiftCardPrice * 10) / 100;
      finalGiftCardPrice = finalGiftCardPrice - studentDiscount;
    }

    return finalGiftCardPrice;
  }, [
    recommendedItems,
    giftCardCount,
    appliedDiscount,
    travelers,
    insuranceCount
  ]);

  const calculateOriginalPrice = () => {
    // Use dynamic strike-out price from admin panel (per traveler)
    // If a visa type is selected with a specific price, calculate proportional strike-out price
    // Otherwise use the base strike-out price
    let currentStrikeOutPrice = strikeOutPrice;

    if (baseFee > 0 && selectedVisaType) {
      if (selectedVisaType.priceGBP) {
        // If visa type has a specific GBP price, maintain the same ratio
        const priceRatio = Number(selectedVisaType.priceGBP) / baseFee;
        currentStrikeOutPrice = strikeOutPrice * priceRatio;
      } else if (selectedVisaType.price) {
        // If visa type has a price in INR, convert and maintain ratio
        const visaPriceGBP = Math.round(Number(selectedVisaType.price) / 100);
        if (visaPriceGBP > 0) {
          const priceRatio = visaPriceGBP / baseFee;
          currentStrikeOutPrice = strikeOutPrice * priceRatio;
        }
      }
    }

    const baseOriginalPrice = Math.round(currentStrikeOutPrice) * travelers;
    return baseOriginalPrice;
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
    };

    const discount = availableDiscounts[couponCode.toUpperCase()];

    if (!discount) {
      setCouponError("Invalid coupon code");
      return;
    }

    // Check group requirement
    if (
      discount.requiresMinTravellers &&
      travelers < discount.requiresMinTravellers &&
      couponCode.toUpperCase() === "GROUP20"
    ) {
      setCouponError(
        `This coupon requires at least ${discount.requiresMinTravellers} travellers`
      );
      return;
    }

    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
        ? Math.round(Number(selectedVisaType.price) / 100)
        : baseFee;
    const currentVisaFees = currentBaseFee * travelers;
    const calculatedDiscountAmount =
      (currentVisaFees * discount.percentage) / 100;

    const discountWithAmount = {
      ...discount,
      code: couponCode.toUpperCase(),
      discountAmount: Math.round(calculatedDiscountAmount),
    };

    if (couponCode.toUpperCase() === "STUDENT10") {
      dispatch(setAppliedDiscount(discountWithAmount));
      setAppliedInsuranceDiscount({ ...discountWithAmount, code: "STUDENT10" });
      setInsuranceCouponCode("STUDENT10");
    } else {
      dispatch(setAppliedDiscount(discountWithAmount));
    }

    setCouponError("");
    if (couponCode.toUpperCase() === "GROUP20") {
      setGroupAutoApplied(false);
    }

    if (discount && discount.description.toLowerCase().includes("student")) {
    }
  };

  const applyInsuranceCoupon = () => {
    if (!insuranceCouponCode.trim()) {
      setInsuranceCouponError("Please enter a coupon code for insurance");
      return;
    }

    const code = insuranceCouponCode.toUpperCase();
    if (code !== "GROUP20") {
      setInsuranceCouponError("Invalid insurance coupon code");
      return;
    }

    if (!recommendedItems.insuranceCertificate || insuranceDays <= 0) {
      setInsuranceCouponError(
        "Select insurance and travel dates before applying this code"
      );
      return;
    }

    const discount = {
      description: "Insurance group discount (3+ insurances)",
      percentage: 20,
      requiresMinInsurances: 3,
    };

    if (
      discount.requiresMinInsurances &&
      insuranceCount < discount.requiresMinInsurances
    ) {
      setInsuranceCouponError(
        `This coupon requires at least ${discount.requiresMinInsurances} insurances`
      );
      return;
    }

    const originalInsurance = computedInsuranceTotal;
    const discountAmount = Math.round(
      (originalInsurance * discount.percentage) / 100
    );
    setAppliedInsuranceDiscount({
      ...discount,
      discountAmount,
      code: "GROUP-20",
    });
    setInsuranceCouponError("");
    setInsuranceAutoApplied(false);
    showSuccess && showSuccess("Insurance coupon applied — 20% off insurance");
  };

  const removeInsuranceCoupon = () => {
    setAppliedInsuranceDiscount(null);
    setInsuranceCouponCode("");
    setInsuranceCouponError("");
  };

  const removeCoupon = () => {
    dispatch(setAppliedDiscount(null));
    setAppliedInsuranceDiscount(null);
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
              : baseFee;
          const currentVisaFees = currentBaseFee * travelers;
          const calculatedDiscountAmount = (currentVisaFees * 20) / 100;

          const groupDiscount = {
            code: "GROUP20",
            description: "Group discount (3+ travellers)",
            percentage: 20,
            requiresMinTravellers: 3,
            discountAmount: Math.round(calculatedDiscountAmount),
          };
          dispatch(setAppliedDiscount(groupDiscount));
          setCouponCodeLocal("GROUP20");
          setCouponError("");
          setGroupAutoApplied(true);
          // Toast notification is handled by StickyBottomBar to avoid duplicate toasts
        }
      } else {
        // If travelers dropped below 3 and we auto-applied the group discount, remove it
        if (groupAutoApplied) {
          dispatch(setAppliedDiscount(null));
          // Only clear couponCode if it was the auto-applied GROUP20
          if (currentCode === "GROUP20") setCouponCodeLocal("");
          setGroupAutoApplied(false);
          // Toast notification is handled by StickyBottomBar to avoid duplicate toasts
        }
        // If the user manually had GROUP20 applied but now travelers < 3, show an error when they try to proceed (existing validation handles this)
      }
    } catch {
      // ignore
    }
  }, [travelers]);

  useEffect(() => {
    // Skip on initial mount for toast detection
    if (isInitialMountInsuranceToastRef.current) {
      prevInsuranceCountForToastRef.current = insuranceCount;
      isInitialMountInsuranceToastRef.current = false;
      // Still apply discount logic on mount if needed
      if (insuranceCount >= 3) {
        setAppliedInsuranceDiscount({
          description: "Insurance group discount (3+ insurances)",
          percentage: 20,
          requiresMinInsurances: 3,
        });
        setInsuranceCouponCode("GROUP20");
      } else {
        setInsuranceCouponCode(null);
        setAppliedInsuranceDiscount(null);
      }
      return;
    }

    const prevInsurance = prevInsuranceCountForToastRef.current;
    const currentInsurance = insuranceCount;
    const crossedThreshold = (prevInsurance < 3 && currentInsurance >= 3) || (prevInsurance >= 3 && currentInsurance < 3);

    if (insuranceCount >= 3) {
      setAppliedInsuranceDiscount({
        description: "Insurance group discount (3+ insurances)",
        percentage: 20,
        requiresMinInsurances: 3,
      });
      setInsuranceCouponCode("GROUP20");
    } else {
      setInsuranceCouponCode(null);
      setAppliedInsuranceDiscount(null);
    }

    // Update ref after processing
    prevInsuranceCountForToastRef.current = currentInsurance;
  }, [insuranceCount]);

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

  const handleGetVisa = async (preferredPaymentMethod = null) => {
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
    if (missingDocs.length > 0) {
      dispatch(triggerDocumentValidation());
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

      const verificationSent = await sendStudentVerification(
        userEmail,
        "/get-the-visa"
      );
      if (verificationSent) {
        setPendingCheckoutQuery("proceed"); // Simple flag
        setSelectedLocalPaymentMethod("stripe");
        // Polling/verification effect will handle redirect after verification
        return;
      } else {
        return; // sendStudentVerification will have shown error
      }
    }

    // Use the same discount calculation logic as calculateFinalPrice for consistency
    // Base discounted prices (not original prices)
    const baseDiscountedVisaFees = hasOnlyInsurance ? 0 : currentVisaFeePerTraveler * travelers;
    const baseDiscountedInsuranceFees = discountedInsuranceBase;
    const baseDiscountedGiftCardFees = recommendedItems.giftCard
      ? 159 * giftCardCount
      : 0;

    // Check if any component qualifies for quantity discount (3+)
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const travelersQualify = travelers >= 3;
    const insuranceQualify = effectiveInsuranceCount >= 3;
    const giftCardQualify = giftCardCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let visaFees = baseDiscountedVisaFees;
    let insuranceFees = baseDiscountedInsuranceFees;
    let giftCardFees = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (visaFees * 20) / 100;
      visaFees = visaFees - quantityDiscount;
    }
    if (insuranceQualify && recommendedItems.insuranceCertificate) {
      const quantityDiscount = (insuranceFees * 20) / 100;
      insuranceFees = insuranceFees - quantityDiscount;
    }
    if (giftCardQualify && recommendedItems.giftCard) {
      const quantityDiscount = (giftCardFees * 20) / 100;
      giftCardFees = giftCardFees - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (travelersQualify && visaFees === baseDiscountedVisaFees) {
          const quantityDiscount = (visaFees * 20) / 100;
          visaFees = visaFees - quantityDiscount;
        }
        if (insuranceQualify && recommendedItems.insuranceCertificate && insuranceFees === baseDiscountedInsuranceFees) {
          const quantityDiscount = (insuranceFees * 20) / 100;
          insuranceFees = insuranceFees - quantityDiscount;
        }
        if (giftCardQualify && recommendedItems.giftCard && giftCardFees === baseDiscountedGiftCardFees) {
          const quantityDiscount = (giftCardFees * 20) / 100;
          giftCardFees = giftCardFees - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
      const studentDiscount = (visaFees * 10) / 100;
      visaFees = visaFees - studentDiscount;
      if (recommendedItems.insuranceCertificate) {
        const studentDiscount = (insuranceFees * 10) / 100;
        insuranceFees = insuranceFees - studentDiscount;
      }
      if (recommendedItems.giftCard) {
        const studentDiscount = (giftCardFees * 10) / 100;
        giftCardFees = giftCardFees - studentDiscount;
      }
    }
    const totalAmount = visaFees + insuranceFees + giftCardFees;

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
    const allowedPaymentMethods = ["stripe", "klarna"];
    const sanitizeMethod = (method) =>
      method && allowedPaymentMethods.includes(method) ? method : null;
    const methodToPersist =
      sanitizeMethod(preferredPaymentMethod) ||
      sanitizeMethod(selectedPaymentMethod) ||
      "stripe";
    dispatch(setSelectedPaymentMethod(methodToPersist));
    dispatch(setGiftCardFees(giftCardFees || 0));
    dispatch(setTotalAmount(totalAmount || 0));
    dispatch(setInsuranceOnly(hasOnlyInsurance || false));
    dispatch(setReduxInsuranceCount(insuranceCount || 1));

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
            if (!userEmail && payload.email) setUserEmailLocal(payload.email);
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

  // Validate required documents before allowing express payment - memoized to prevent infinite loops
  const isDocumentsValid = useMemo(() => {
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

    return missingDocs.length === 0 || hasOnlyInsurance;
  }, [requiredDocuments, recommendedItems]);

  // Validation function to check before payment (called when user clicks Apple Pay/Google Pay)
  const validateBeforeExpressPayment = useCallback(() => {
    if (!isDocumentsValid) {
      dispatch(triggerDocumentValidation());
      return "Please complete all required documents before proceeding with payment.";
    }
    if (
      appliedDiscount &&
      appliedDiscount.description &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified &&
      (!userEmail || !validateEmail(userEmail))
    ) {
      return "Please verify your student email before proceeding with payment.";
    }
    return null;
  }, [
    isDocumentsValid,
    appliedDiscount,
    studentVerified,
    userEmail,
  ]);

  // Calculate total amount for express payments (Apple Pay/Google Pay) - memoized to prevent infinite loops
  // Uses the same logic as calculateFinalPrice() to match OrderCheckout.jsx
  const expressPaymentData = useMemo(() => {
    // SUBTOTAL: Original prices (no discounts applied) - matching OrderCheckout
    const originalVisaFees = 200 * travelers; // £200 per traveler
    const originalInsuranceFees = originalInsuranceBase; // Dynamic per-day pricing
    const originalGiftCardFees = recommendedItems.giftCard
      ? 245 * giftCardCount
      : 0; // £245 per gift card
    const subtotalGBP = originalVisaFees + originalInsuranceFees + originalGiftCardFees;

    // Base discounted prices (matching OrderCheckout.jsx and calculateFinalPrice)
    const baseDiscountedVisaFees =
      currentVisaFeePerTraveler * travelers; // Dynamic per traveler
    const baseDiscountedInsuranceFees = discountedInsuranceBase;
    const baseDiscountedGiftCardFees = recommendedItems.giftCard
      ? 159 * giftCardCount
      : 0; // £159 per gift card

    // Check if any component qualifies for quantity discount (3+)
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const travelersQualify = travelers >= 3;
    const insuranceQualify = effectiveInsuranceCount >= 3;
    const giftCardQualify = giftCardCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount = appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount = appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaFees = baseDiscountedVisaFees;
    let finalInsuranceFees = baseDiscountedInsuranceFees;
    let finalGiftCardFees = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (finalVisaFees * 20) / 100;
      finalVisaFees = finalVisaFees - quantityDiscount;
    }
    if (insuranceQualify && recommendedItems.insuranceCertificate) {
      const quantityDiscount = (finalInsuranceFees * 20) / 100;
      finalInsuranceFees = finalInsuranceFees - quantityDiscount;
    }
    if (giftCardQualify && recommendedItems.giftCard) {
      const quantityDiscount = (finalGiftCardFees * 20) / 100;
      finalGiftCardFees = finalGiftCardFees - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (travelersQualify && (insuranceQualify || giftCardQualify)) {
        if (travelersQualify && finalVisaFees === baseDiscountedVisaFees) {
          const quantityDiscount = (finalVisaFees * 20) / 100;
          finalVisaFees = finalVisaFees - quantityDiscount;
        }
        if (insuranceQualify && recommendedItems.insuranceCertificate && finalInsuranceFees === baseDiscountedInsuranceFees) {
          const quantityDiscount = (finalInsuranceFees * 20) / 100;
          finalInsuranceFees = finalInsuranceFees - quantityDiscount;
        }
        if (giftCardQualify && recommendedItems.giftCard && finalGiftCardFees === baseDiscountedGiftCardFees) {
          const quantityDiscount = (finalGiftCardFees * 20) / 100;
          finalGiftCardFees = finalGiftCardFees - quantityDiscount;
        }
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
      const studentDiscount = (finalVisaFees * 10) / 100;
      finalVisaFees = finalVisaFees - studentDiscount;
      if (recommendedItems.insuranceCertificate) {
        const studentDiscount = (finalInsuranceFees * 10) / 100;
        finalInsuranceFees = finalInsuranceFees - studentDiscount;
      }
      if (recommendedItems.giftCard) {
        const studentDiscount = (finalGiftCardFees * 10) / 100;
        finalGiftCardFees = finalGiftCardFees - studentDiscount;
      }
    }

    const totalAmount = finalVisaFees + finalInsuranceFees + finalGiftCardFees;

    return {
      totalAmount: totalAmount, // Already in GBP, no conversion needed
      currency: "GBP", // Always use GBP (matching OrderCheckout)
      visaTypeId: selectedVisaType?.id || "",
      includeInsurance: recommendedItems.insuranceCertificate || false,
      insurancePaymentAmount: finalInsuranceFees,
      // Include individual fees for ExpressPaymentRequestButton
      visaFees: finalVisaFees,
      insuranceFees: finalInsuranceFees,
      giftCardFees: finalGiftCardFees,
      includeGiftCard: recommendedItems.giftCard || false,
      giftCardCount: giftCardCount || 0,
      // Additional props for localStorage/Redux setup (same as OrderCheckout)
      subtotalGBP: subtotalGBP,
      discountedInsuranceFeesGBP: finalInsuranceFees,
      visaFeesGBP: finalVisaFees,
      couponCode: couponCode || "",
    };
  }, [
    requiredDocuments,
    recommendedItems,
    selectedVisaType,
    travelers,
    appliedDiscount,
    insuranceCount,
    giftCardCount,
  ]);

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
  }, [expressPaymentData.totalAmount, travelers, expressPaymentData.includeInsurance]);

  return (
    <div className="w-full max-w-[1300px] gap-20 max-lg:flex-col max-lg:gap-10 flex items-start justify-center mt-5 px-5 max-sm:px-3">
      {/* System Alerts */}
      <SimpleAlert
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((s) => ({ ...s, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        okText="OK"
      />
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
        onConfirm={
          confirmState.onConfirm ||
          (() => setConfirmState((s) => ({ ...s, isOpen: false })))
        }
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Confirm"
        cancelText="Cancel"
        type="info"
      />

      {/* Left Column */}
      <div className="w-full gap-3 flex flex-col items-start lg:max-w-[60%] max-sm:gap-4">
        {/* Badges Section */}
        <section className="text-center text-white rounded-2xl p-2 w-full max-sm:p-1">
          <div className="w-full flex justify-start items-center gap-2 px-3 max-sm:flex-col max-sm:gap-3 max-sm:px-1">
            <button className="bg-[#24242D] border border-white px-6 py-[10px] rounded-full font-medium text-white select-none transition-colors relative overflow-hidden max-sm:w-full max-sm:px-4 max-sm:py-3">
              <span className="relative z-10 font-bold text-[22px] leading-none max-sm:text-[18px]">
                {sliderContent["badge_1_text"]}
              </span>
            </button>

            <button className="bg-[#24242D] border border-white px-6 py-[10px] rounded-full font-medium text-white select-none transition-colors relative overflow-hidden max-sm:w-full max-sm:px-4 max-sm:py-3">
              <span className="relative z-10 font-bold text-[22px] leading-none max-sm:text-[18px]">
                {sliderContent["badge_2_text"]}
              </span>
            </button>
          </div>
        </section>

        {/* Visa Information Section */}
        <section className="w-full gap-3 flex flex-col items-start max-sm:gap-4">
          <section className="w-full">
            <div className="bg-[#24242D] rounded-2xl shadow-sm p-4 max-sm:p-3">
              <div className="bg-[#24242D] flex justify-between  text-white max-sm:flex-col max-sm:items-start max-sm:gap-4">
                <h2 className="text-3xl md:text-[40px] font-gilroy-bold my-auto max-sm:text-2xl max-sm:mb-2">
                  Visa <br className="hidden sm:block" /> information
                </h2>
                <div className="flex gap-10 justify-between w-full md:px-5 px-0">
                  <div className="flex max-sm:py-2 flex-col gap-1 max-sm:gap-2  max-sm:w-full">
                    {/* Visa Types */}
                    <div className="flex items-center max-sm:text-sm">
                      <FileText className="h-5 w-5 text-[#24242D] stroke-[#24242D] mr-3 fill-white max-sm:mr-2 max-sm:h-4 max-sm:w-4" />
                      <span className="">Visa Types</span>
                    </div>

                    {/* Stay Duration */}
                    <div className="flex items-center max-sm:text-sm">
                      <Home className="h-5 w-5 mr-3 text-white max-sm:mr-2 max-sm:h-4 max-sm:w-4" />
                      <span className="">Stay Duration</span>
                    </div>

                    {/* Term Type */}
                    <div className="flex items-center max-sm:text-sm">
                      <ClipboardList className="h-5 w-5 text-[#24242D] stroke-[#24242D] mr-3 fill-white max-sm:mr-2 max-sm:h-4 max-sm:w-4" />
                      <span className="">Term Type</span>
                    </div>

                    {/* Entry */}
                    <div className="flex items-center max-sm:text-sm">
                      <Clock className="h-5 w-5 mr-3 text-white max-sm:mr-2 max-sm:h-4 max-sm:w-4" />
                      <span className="">Entry</span>
                    </div>
                  </div>

                  <div className="flex flex-col mr-10 max-sm:mr-0 max-sm:w-full max-sm:mt-2">
                    <div className="grid gap-1 max-sm:gap-2">
                      {/* Sticker */}
                      <div
                        className="relative border-b border-dashed border-white/40 w-fit font-semibold max-sm:w-full"
                        onMouseEnter={() => setActiveTooltip("sticker")}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="flex items-center max-sm:justify-between">
                          <span className="max-sm:text-sm">Sticker</span>
                        </div>

                        {activeTooltip === "sticker" && (
                          <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200 max-sm:w-48 max-sm:-left-20">
                            <p className="text-sm max-sm:text-xs">
                              {tooltips.sticker}
                            </p>
                            <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200 max-sm:left-20"></div>
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div
                        className="relative border-b border-dashed border-white/40 w-fit font-semibold max-sm:w-full"
                        onMouseEnter={() => setActiveTooltip("duration")}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="flex items-center max-sm:justify-between">
                          <span className="max-sm:text-sm">90 Days</span>
                        </div>

                        {activeTooltip === "duration" && (
                          <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200 max-sm:w-48 max-sm:-left-20">
                            <div className="text-sm max-sm:text-xs">
                              {tooltips.duration.map((line, index) => (
                                <p
                                  key={index}
                                  className={
                                    index > 0 ? "mt-1 max-sm:mt-0.5" : ""
                                  }
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                            <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200 max-sm:left-20"></div>
                          </div>
                        )}
                      </div>

                      {/* Term Type */}
                      <div
                        className="relative border-b border-dashed border-white/40 w-fit font-semibold max-sm:w-full"
                        onMouseEnter={() => setActiveTooltip("term")}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="flex items-center max-sm:justify-between">
                          <span className="max-sm:text-sm">Short Term</span>
                        </div>

                        {activeTooltip === "term" && (
                          <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200 max-sm:w-48 max-sm:-left-20">
                            <p className="text-sm max-sm:text-xs">
                              {tooltips.term}
                            </p>
                            <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200 max-sm:left-20"></div>
                          </div>
                        )}
                      </div>

                      {/* Entry */}
                      <div
                        className="relative border-b border-dashed border-white/40 w-fit font-semibold max-sm:w-full"
                        onMouseEnter={() => setActiveTooltip("entry")}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        <div className="flex items-center max-sm:justify-between">
                          <span className="max-sm:text-sm">Multiple</span>
                        </div>

                        {activeTooltip === "entry" && (
                          <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200 max-sm:w-48 max-sm:-left-20">
                            <p className="text-sm max-sm:text-xs">
                              {tooltips.entry}
                            </p>
                            <div className="absolute -bottom-1 left-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200 max-sm:left-20"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-left my-4 max-sm:my-3">
                <p className="flex gap-2 max-sm:gap-1 max-sm:text-sm">
                  <Image
                    src="/icons/megaphone.png"
                    width={24}
                    height={20}
                    className="w-6 h-5 max-sm:w-5 max-sm:h-4"
                    alt="Notice"
                    priority
                  />
                  <span>{sliderContent["embassy_notice_text"]}</span>
                </p>
              </div>
            </div>
          </section>

          {/* Slider Section */}
          <section className="mt-1 w-full max-sm:mt-0">
            <div className="relative w-full">
              {/* Slider container */}
              <div className="overflow-hidden rounded-3xl shadow-lg max-sm:rounded-2xl">
                <div className="relative h-full w-full">
                  <Image
                    src={countries[currentIndex].image}
                    alt={countries[currentIndex].name}
                    width={800}
                    height={800}
                    className="w-full aspect-square object-cover"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 max-sm:p-4">
                    <h3 className="text-2xl font-gilroy-bold text-white max-sm:text-xl">
                      {countries[currentIndex].name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Navigation arrows */}
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 flex items-center text-black/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-300 z-10 max-sm:left-2 max-sm:p-1.5"
                aria-label="Previous slide"
              >
                <ChevronLeft size={24} className="max-sm:w-5 max-sm:h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 flex items-center text-black/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-300 z-10 max-sm:right-2 max-sm:p-1.5"
                aria-label="Next slide"
              >
                <ChevronRight size={24} className="max-sm:w-5 max-sm:h-5" />
              </button>

              <div className="flex justify-center gap-2 absolute bottom-5 left-1/2 -translate-x-1/2 max-sm:bottom-3">
                {countries.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      resetTimer();
                    }}
                    className={`w-2.5 h-2.5 cursor-pointer rounded-full transition-all max-sm:w-2 max-sm:h-2 ${
                      index === currentIndex
                        ? "bg-white w-6 max-sm:w-4"
                        : "bg-white/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnails for slider navigation */}
            <div className="flex justify-center gap-2 max-lg:hidden mt-8 overflow-auto w-full max-sm:mt-4">
              {countries.map((country, index) => (
                <Image
                  key={country.id}
                  src={country.image}
                  alt={country.name}
                  width={80}
                  height={80}
                  onClick={() => {
                    setCurrentIndex(index);
                    resetTimer();
                  }}
                  className={`w-20 aspect-square object-cover cursor-pointer rounded-xl border-2 transition-all border-white max-sm:w-12 max-sm:rounded-lg ${
                    index === currentIndex
                      ? "border-none"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  priority
                  style={{ boxSizing: "border-box" }}
                />
              ))}
            </div>
            <p className="text-[18px] mt-8 text-white font-gilroy-bold text-center max-sm:text-[16px] max-sm:mt-4">
              {sliderContent["urgent_note_text"]}
            </p>
          </section>
        </section>
      </div>

      {/* Right Column */}
      <div className="w-full gap-3 flex flex-col items-start lg:max-w-[60%] max-sm:gap-4">
        {/* NRI Badge Section */}
        <section className="text-center text-white rounded-2xl p-2 w-full max-sm:p-1">
          <div className="flex justify-start items-center">
            <button className="bg-[#24242D] border border-white px-4 py-[7px] pb-[18px] rounded-full font-medium text-sm text-white select-none transition-colors relative overflow-hidden text-center max-sm:w-full max-sm:px-3 max-sm:py-2">
              <span
                className="relative z-10 leading-none text-center font-bold flex justify-center items-center pt-2 max-sm:text-[18px]"
                style={{ fontSize: "17px" }}
              >
                {sliderContent["nri_badge_text"] || ""}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
            </button>
          </div>
        </section>

        {/* Main Content Section */}
        <section className="bg-[#24242D] text-white rounded-2xl p-6 w-full max-sm:p-4">
          <div className="w-full">
            {/* Header with pricing */}
            <div className="mb-6 max-sm:mb-4">
              <h1 className="text-3xl font-gilroy-bold mb-4 max-sm:text-2xl max-sm:mb-3">
                Schengen visa from the UK
              </h1>
              <div className="flex items-center justify-between gap-3 mb-4 max-sm:flex-col max-sm:items-start max-sm:gap-3">
                <div className="flex gap-3 max-sm:w-full max-sm:justify-between">
                  <span className="text-lg font-semibold max-sm:text-base line-through decoration-2 decoration-neutral-400">
                    £{calculateOriginalPrice()}
                  </span>

                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-gilroy-bold max-sm:text-xl">
                      £{visaOnlyPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shadow-lg shadow-black/20 p-2 rounded-full max-sm:w-full max-sm:justify-between max-sm:px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center">
                      <UserIcon className="fill-white max-sm:w-3 max-sm:h-3" />
                    </div>
                    <span className="text-xs font-gilroy-bold max-sm:text-xs">
                      Travellers
                    </span>
                  </div>
                  <QtyInput
                    value={travelers}
                    onChange={(next) => {
                      const n = Number(next);
                      dispatch(setReduxTravelers(Number(n)));
                    }}
                    min={1}
                  />
                </div>

                {/* Country Selector */}
                <div className="w-fit max-sm:w-full">
                  <label htmlFor="country-select" className="sr-only">
                    Select Country
                  </label>
                  <select
                    id="country-select"
                    value={selectedCountry}
                    onChange={(e) => selectCountry(e.target.value)}
                    className="px-2 py-2 font-semibold rounded-full shadow-black/20 shadow-lg cursor-pointer focus:outline-none max-sm:w-full max-sm:text-center"
                  >
                    {schengenCountries.map((country) => (
                      <option
                        key={country}
                        value={country}
                        className="bg-gray-400 text-gray-800"
                      >
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <p className="text-sm mb-4 max-sm:text-xs max-sm:mb-3">
              Dates are required for visa processing only and can be changed
              later within visa validity period.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 items-start max-sm:gap-3">
              <div className="w-full">
                {(() => {
                  // Calculate first valid date (4 weeks from today)
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const fourWeeksFromNow = new Date();
                  fourWeeksFromNow.setHours(0, 0, 0, 0);
                  fourWeeksFromNow.setDate(today.getDate() + 28);
                  
                  // Check if valid dates are at the end of the month
                  const firstValidDate = fourWeeksFromNow;
                  const firstValidDay = firstValidDate.getDate();
                  const firstValidMonth = firstValidDate.getMonth();
                  const firstValidYear = firstValidDate.getFullYear();
                  
                  // Get the last day of the month for the first valid date
                  const lastDayOfMonth = new Date(firstValidYear, firstValidMonth + 1, 0).getDate();
                  
                  // Check if valid dates are in the last few days of the month (day >= 28)
                  // This means there are only a few valid dates left in the current month
                  const validDatesAtEndOfMonth = firstValidDay >= 28;
                  
                  // Calculate openToDate to show next month if valid dates are at end of current month
                  let openToDate = null;
                  
                  if (validDatesAtEndOfMonth) {
                    // Show next month's calendar instead
                    openToDate = new Date(firstValidYear, firstValidMonth + 1, 1);
                  }
                  
                  return (
                    <CommonDatePicker
                      label={"Start date"}
                      selected={arrivalDate}
                      onChange={handleArrivalDateChange}
                      selectsStart
                      startDate={arrivalDate}
                      endDate={departureDate}
                      minDate={new Date()}
                      dayClassName={getDayClassName}
                      openToDate={openToDate}
                      calendarClassName={validDatesAtEndOfMonth ? "show-adjacent-month-dates" : ""}
                      className="!w-full bg-white/10 backdrop-blur-sm text-white rounded-lg px-4 py-3 font-semibold border-2 border-white/20 hover:border-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none max-sm:py-2 max-sm:text-sm"
                      dateFormat="dd-MM-yyyy"
                      wrapperClassName="!w-full"
                      placeholderText="DD-MM-YYYY"
                    />
                  );
                })()}
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
                  className="w-full bg-white/10 backdrop-blur-sm text-white rounded-lg px-4 py-3 font-semibold border-2 border-white/20 hover:border-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none max-sm:py-2 max-sm:text-sm"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  maxDate={maxDepartureDate}
                />
              </div>
            </div>

            {/* Date validation messages */}
            <div className="text-xs mt-2 max-sm:text-xs">
              {dateValidationErrors.pastDate && (
                <p className="text-red-400">{dateValidationErrors.pastDate}</p>
              )}
              {!dateValidationErrors.pastDate &&
                dateValidationErrors.dateOrder && (
                  <p className="text-red-400">
                    {dateValidationErrors.dateOrder}
                  </p>
                )}
              {!dateValidationErrors.pastDate &&
                !dateValidationErrors.dateOrder &&
                dateValidationErrors.exceedsLimit && (
                  <p className="text-red-400">
                    {dateValidationErrors.exceedsLimit}
                  </p>
                )}
              {!dateValidationErrors.pastDate &&
                !dateValidationErrors.dateOrder &&
                !dateValidationErrors.exceedsLimit &&
                dateValidationErrors.tooClosee && (
                  <p className="text-gray-500 mt-1">
                    {dateValidationErrors.tooClosee}
                  </p>
                )}
              {!dateValidationErrors.pastDate &&
                !dateValidationErrors.dateOrder &&
                !dateValidationErrors.exceedsLimit &&
                !dateValidationErrors.tooClosee &&
                typeof tripDays === "number" &&
                isAtLeastFourWeeks && (
                  <p className="text-green-400 mt-1">
                    All good. Your trip length is 4 weeks or more.
                  </p>
                )}
            </div>
          </div>

          {/* Required Documents */}
          <ClientOnly>
            <div className="my-6 max-sm:my-4" data-documents-section>
              <div
                className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/10 ${
                  validationErrors.size > 0
                    ? "!bg-red-500/10 border !border-red-500 shadow-lg"
                    : ""
                }`}
              >
                <h2
                  className={`text-xl font-gilroy-bold p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-all duration-200 max-sm:p-3 max-sm:text-lg`}
                  onClick={() =>
                    setDocumentsAccordionOpen(!documentsAccordionOpen)
                  }
                >
                  <span className={`flex items-center gap-3 max-sm:gap-2`}>
                    <div className="w-6 h-6 rounded-full bg-[#7350FF] flex items-center justify-center max-sm:w-5 max-sm:h-5">
                      <FileText className="w-3.5 h-3.5 text-white max-sm:w-3 max-sm:h-3" />
                    </div>
                    <span>Required Documents</span>
                    <div className="ml-2 px-2 py-1 bg-white/10 rounded-full text-xs font-medium max-sm:ml-1 max-sm:px-1.5 max-sm:py-0.5">
                      {Object.values(requiredDocuments).filter(Boolean).length}
                      /6 selected
                    </div>
                  </span>
                  <div
                    className={`transform transition-transform duration-300 ${
                      documentsAccordionOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="max-sm:w-4 max-sm:h-4"
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
                  className={`transition-all duration-300 ease-in-out ${
                    documentsAccordionOpen
                      ? "max-h-[600px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 pb-4 max-sm:px-3 max-sm:pb-3">
                    <div className="h-px bg-white/10 mb-4"></div>
                    <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1 max-sm:gap-2">
                      {/* Passport */}
                      <div
                        className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border max-sm:p-2 ${
                          requiredDocuments.passport
                            ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                            : validationErrors.has("passport")
                            ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                        onClick={() => toggleRequiredDocument("passport")}
                      >
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all max-sm:w-4 max-sm:h-4 ${
                            requiredDocuments.passport
                              ? "bg-[#7350FF] border-2 border-[#7350FF]"
                              : "bg-transparent border-2 border-white/40"
                          }`}
                        >
                          {requiredDocuments.passport && (
                            <Check className="w-3 h-3 text-white max-sm:w-2.5 max-sm:h-2.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium max-sm:text-sm">
                            Passport
                          </span>
                          <p className="text-sm text-white/70 mt-1 max-sm:text-xs max-sm:mt-0.5">
                            Valid 3+ months after Schengen trip, 2 blank pages
                          </p>
                        </div>
                      </div>

                      {/* UK Visa */}
                      <div
                        className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border max-sm:p-2 ${
                          requiredDocuments.ukVisa
                            ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                            : validationErrors.has("ukVisa")
                            ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                        onClick={() => toggleRequiredDocument("ukVisa")}
                      >
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all max-sm:w-4 max-sm:h-4 ${
                            requiredDocuments.ukVisa
                              ? "bg-[#7350FF] border-2 border-[#7350FF]"
                              : "bg-transparent border-2 border-white/40"
                          }`}
                        >
                          {requiredDocuments.ukVisa && (
                            <Check className="w-3 h-3 text-white max-sm:w-2.5 max-sm:h-2.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium max-sm:text-sm">
                            UK Visa
                          </span>
                          <p className="text-sm text-white/70 mt-1 max-sm:text-xs max-sm:mt-0.5">
                            Valid 3+ months after Schengen trip
                          </p>
                        </div>
                      </div>

                      {/* Photos */}
                      <div
                        className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border max-sm:p-2 ${
                          requiredDocuments.photos
                            ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                            : validationErrors.has("photos")
                            ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                        onClick={() => toggleRequiredDocument("photos")}
                      >
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all max-sm:w-4 max-sm:h-4 ${
                            requiredDocuments.photos
                              ? "bg-[#7350FF] border-2 border-[#7350FF]"
                              : "bg-transparent border-2 border-white/40"
                          }`}
                        >
                          {requiredDocuments.photos && (
                            <Check className="w-3 h-3 text-white max-sm:w-2.5 max-sm:h-2.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium max-sm:text-sm">
                            Passport-Sized Photographs
                          </span>
                          <p className="text-sm text-white/70 mt-1 max-sm:text-xs max-sm:mt-0.5">
                            Two 35mm x 45mm photos required
                          </p>
                        </div>
                      </div>

                      {/* Bank Statements */}
                      <div
                        className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border max-sm:p-2 ${
                          requiredDocuments.bankStatements
                            ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                            : validationErrors.has("bankStatements")
                            ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                        onClick={() => toggleRequiredDocument("bankStatements")}
                      >
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all max-sm:w-4 max-sm:h-4 ${
                            requiredDocuments.bankStatements
                              ? "bg-[#7350FF] border-2 border-[#7350FF]"
                              : "bg-transparent border-2 border-white/40"
                          }`}
                        >
                          {requiredDocuments.bankStatements && (
                            <Check className="w-3 h-3 text-white max-sm:w-2.5 max-sm:h-2.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium max-sm:text-sm">
                            Bank Statements
                          </span>
                          <p className="text-sm text-white/70 mt-1 max-sm:text-xs max-sm:mt-0.5">
                            Last 3 months showing sufficient funds £50–£80/day
                            per person
                          </p>
                        </div>
                      </div>

                      {/* Employment Proof */}
                      <div
                        className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border max-sm:p-2 ${
                          requiredDocuments.employmentProof
                            ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                            : validationErrors.has("employmentProof")
                            ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                        onClick={() =>
                          toggleRequiredDocument("employmentProof")
                        }
                      >
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all max-sm:w-4 max-sm:h-4 ${
                            requiredDocuments.employmentProof
                              ? "bg-[#7350FF] border-2 border-[#7350FF]"
                              : "bg-transparent border-2 border-white/40"
                          }`}
                        >
                          {requiredDocuments.employmentProof && (
                            <Check className="w-3 h-3 text-white max-sm:w-2.5 max-sm:h-2.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium max-sm:text-sm">
                            Employment Proof
                          </span>
                          <p className="text-sm text-white/70 mt-1 max-sm:text-xs max-sm:mt-0.5">
                            Last 3 months payslips, or uni enrollment letter if
                            student
                          </p>
                        </div>
                      </div>

                      {/* Insurance */}
                      <div
                        className={`flex items-start space-x-3 cursor-pointer rounded-lg p-3 transition-all duration-200 border max-sm:p-2 ${
                          requiredDocuments.insurance
                            ? "bg-[#7350FF]/10 border-[#7350FF] shadow-lg shadow-[#7350FF]/20"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30"
                        }`}
                        onClick={() => toggleRequiredDocument("insurance")}
                      >
                        <div
                          className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-all max-sm:w-4 max-sm:h-4 ${
                            requiredDocuments.insurance
                              ? "bg-[#7350FF] border-2 border-[#7350FF]"
                              : "bg-transparent border-2 border-white/40"
                          }`}
                        >
                          {requiredDocuments.insurance && (
                            <Check className="w-3 h-3 text-white max-sm:w-2.5 max-sm:h-2.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-base font-medium max-sm:text-sm">
                            Insurance Certificate
                          </span>
                          <p className="text-sm text-white/70 mt-1 max-sm:text-xs max-sm:mt-0.5">
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

          {/* Recommended Section */}
          <div className="mb-6 max-sm:mb-4">
            <h2 className="text-xl font-gilroy-bold mb-4 max-sm:text-lg max-sm:mb-3">
              Recommended
            </h2>

            {/* Insurance Certificate & Gift Card */}
            <div className="shadow-xl shadow-black/10 rounded-xl mb-4 max-sm:mb-3">
              <div className="flex gap-[10px] max-sm:gap-2">
                {/* Insurance Certificate */}
                <div className="flex flex-col items-center gap-2 mb-6 border-white/20 bg-white/5 border p-2 rounded-2xl text-white w-[220px] max-sm:w-1/2 max-sm:mb-3 max-sm:p-1.5 overflow-hidden">
                  <div className="w-full flex items-center max-sm:justify-between">
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all self-start mt-2 cursor-pointer max-sm:mt-1 border flex-shrink-0 ${
                        recommendedItems.insuranceCertificate
                          ? "border-transparent bg-[#7350FF]"
                          : "border-gray-400 bg-white"
                      }`}
                      onClick={() =>
                        toggleRecommendedItem("insuranceCertificate")
                      }
                    >
                      {recommendedItems.insuranceCertificate && (
                        <Check className="w-3.5 h-3.5 text-white max-sm:w-3 max-sm:h-3" />
                      )}
                    </div>

                    <Image
                      src="/image/certificatee.jpg"
                      alt="Insurance Certificate"
                      width={120}
                      height={120}
                      className="w-[120px] rounded-lg ml-2 max-sm:w-[60px] max-sm:ml-0.5 flex-shrink-0"
                      priority
                    />
                    <div className="flex items-center space-x-4 max-sm:space-x-1 flex-shrink-0">
                      <span className="mx-2 text-[12px] max-sm:text-[10px] max-sm:mx-1 whitespace-nowrap">
                        {insuranceDays} Days
                      </span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center md:items-start min-w-0">
                    <div className="cursor-pointer rounded transition-colors flex-1 mb-2 w-full">
                      <div className="flex items-center space-x-2 max-sm:space-x-1">
                        <div
                          onClick={() =>
                            toggleRecommendedItem("insuranceCertificate")
                          }
                          className="flex items-center space-x-2 cursor-pointer min-w-0"
                        >
                          <span className="font-semibold max-sm:text-xs break-words">
                            Insurance certificate
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-2 w-full">
                      {selectedVisaType &&
                        selectedVisaType.duration_permitted && (
                          <div className="mb-2 p-2 bg-purple-600/20 rounded-lg max-sm:p-1.5 max-sm:mb-1">
                            <p className="text-xs text-purple-200 max-sm:text-[10px] break-words">
                              📅 Maximum stay:{" "}
                              {selectedVisaType.duration_permitted}
                              {selectedVisaType.validity_period &&
                                ` | Visa valid for: ${selectedVisaType.validity_period}`}
                            </p>
                          </div>
                        )}

                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-center md:justify-start">
                          <QtyInput
                            value={insuranceCount}
                            onIncrement={() => handleInsuranceChange(1)}
                            onDecrement={() => handleInsuranceChange(-1)}
                            min={1}
                          />
                        </div>
                        <div className="flex items-center justify-center md:justify-start space-x-2 max-sm:space-x-1 flex-wrap">
                          <span className="text-base font-semibold line-through max-sm:text-sm whitespace-nowrap">
                            £{originalInsuranceBase.toFixed(2)}
                          </span>
                          <span className="font-gilroy-bold text-xl max-sm:text-base whitespace-nowrap">
                            £{discountedInsurancePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gift Card */}
                <div className="rounded-xl mb-6 flex flex-col gap-2 w-[220px] max-sm:w-1/2 max-sm:mb-3">
                  <div className="flex flex-col items-center gap-2 border-white/20 bg-white/5 p-2 rounded-2xl text-white border max-sm:p-1.5 overflow-hidden">
                    <div className="w-full flex items-center max-sm:justify-start">
                      <div
                        className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all self-start mt-2 cursor-pointer max-sm:mt-1 border flex-shrink-0 ${
                          recommendedItems.giftCard
                            ? "border-transparent bg-[#7350FF]"
                            : "border-gray-400 bg-white"
                        }`}
                        onClick={() => toggleRecommendedItem("giftCard")}
                      >
                        {recommendedItems.giftCard && (
                          <Check className="w-3.5 h-3.5 text-white max-sm:w-3 max-sm:h-3" />
                        )}
                      </div>
                      <div className="max-sm:flex-1 max-sm:flex max-sm:justify-center">
                        <Image
                          src="/image/gitftnewcard.png"
                          alt="Gift Card"
                          width={120}
                          height={120}
                          className="w-[120px] rounded-lg ml-2 max-sm:w-[60px] max-sm:ml-0 flex-shrink-0"
                          priority
                        />
                      </div>
                    </div>
                    <div className="w-full min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="cursor-pointer rounded transition-colors flex-1 mb-2 min-w-0">
                          <div className="flex items-center space-x-2 max-sm:space-x-1">
                            <div
                              onClick={() => toggleRecommendedItem("giftCard")}
                              className="flex items-center space-x-2 cursor-pointer min-w-0"
                            >
                              <span className="font-semibold max-sm:text-xs break-words">
                                NUvisa digital gift card
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-center md:justify-start">
                          <QtyInput
                            value={giftCardCount}
                            onIncrement={() => handleGiftCardChange(1)}
                            onDecrement={() => handleGiftCardChange(-1)}
                          />
                        </div>
                        <div className="flex items-center justify-center md:justify-start space-x-2 max-sm:space-x-1 flex-wrap">
                          <span className="text-base font-semibold line-through max-sm:text-sm whitespace-nowrap">
                            £{245 * giftCardCount}
                          </span>
                          <span className="font-gilroy-bold text-xl max-sm:text-base whitespace-nowrap">
                            £{discountedGiftCardPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Services */}
              <div className="mb-6 max-sm:mb-4">
                <div className="space-y-4 font-gilroy-medium !font-semibold max-sm:space-y-3">
                  {/* Auto-booking */}
                  <div className="flex items-center justify-between max-sm:items-start max-sm:gap-2">
                    <div className="flex items-center space-x-3 max-sm:space-x-2">
                      <div className="w-10 aspect-square rounded-full flex items-center justify-center max-sm:w-8">
                        <Image
                          src="/image/calendar.jpg"
                          alt="Calendar"
                          width={40}
                          height={40}
                          className="max-sm:w-6 max-sm:h-6"
                          priority
                        />
                      </div>
                      <div>
                        <h3 className="max-sm:text-sm">
                          Auto-booking appointment
                        </h3>
                      </div>
                    </div>
                    <div className="flex gap-[2px] items-center max-sm:flex-shrink-0">
                      <span className="line-through max-sm:text-sm">£100</span>
                      <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium max-sm:ml-1 max-sm:px-2 max-sm:py-0.5 max-sm:text-xs">
                        Free
                      </span>
                    </div>
                  </div>

                  {/* Concierge assistance */}
                  <div className="flex items-center justify-between max-sm:items-start max-sm:gap-2">
                    <div className="flex items-center space-x-3 max-sm:space-x-2">
                      <div className="w-10 aspect-square rounded-full flex items-center justify-center max-sm:w-8">
                        <Image
                          src="/image/flights.jpg"
                          alt="Flights"
                          width={40}
                          height={40}
                          className="w-10 aspect-square max-sm:w-6 max-sm:h-6"
                          priority
                        />
                      </div>
                      <div>
                        <h3 className="max-sm:text-sm">Concierge assistance</h3>
                      </div>
                    </div>
                    <div className="flex gap-[2px] items-center max-sm:flex-shrink-0">
                      <span className="line-through max-sm:text-sm">£35</span>
                      <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium max-sm:ml-1 max-sm:px-2 max-sm:py-0.5 max-sm:text-xs">
                        Free
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Message */}
            {validationErrors.size > 0 && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg max-sm:p-2 max-sm:mb-3">
                <p className="text-red-300 text-sm font-medium max-sm:text-xs">
                  Confirm required documents
                </p>
              </div>
            )}

            {/* Discount Code Section */}
            <div className="space-y-3 mb-6 max-sm:mb-4">
              <h2 className="font-medium text-lg max-sm:text-base">
                Discount Code
              </h2>
              <div className="space-y-2">
                <div className="flex space-x-2 max-sm:flex-col max-sm:space-x-0 max-sm:space-y-2">
                  <div className="flex-1 max-sm:w-full">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCodeLocal(e.target.value.toUpperCase())
                      }
                      placeholder="Enter coupon code (e.g., STUDENT10)"
                      className={`w-full border ${
                        couponError ? "border-red-400" : "border-gray-500"
                      } bg-[#24242D] text-white rounded-md p-2 text-sm max-sm:text-xs ${
                        couponError
                          ? "outline-none ring-2 ring-red-400"
                          : "focus:outline-none focus:ring-2 focus:ring-purple-500"
                      }`}
                      disabled={appliedDiscount}
                    />
                  </div>
                  {!appliedDiscount ? (
                    <button
                      onClick={applyCouponCode}
                      className="px-4 py-2 bg-white text-black text-sm rounded-md hover:bg-gray-200 transition-colors font-medium max-sm:text-xs max-sm:px-3"
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      onClick={removeCoupon}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors max-sm:text-xs max-sm:px-3"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {couponError && (
                  <span className="text-sm text-red-400 max-sm:text-xs">
                    {couponError}
                  </span>
                )}

                {appliedDiscount && (
                  <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-600/20 p-2 rounded-md max-sm:text-xs max-sm:p-1.5">
                    <span>
                      ✓ {appliedDiscount.description} (
                      {appliedDiscount.percentage}% off) applied!
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs pb-4 max-sm:text-xs max-sm:pb-2">
              Student? Add your student email, we'll send verification email
              there.
            </div>

            {/* Email Verification Section */}
            {appliedDiscount &&
              appliedDiscount.description.toLowerCase().includes("student") && (
                <div className="space-y-3 mb-6 max-sm:mb-4">
                  <h2 className="font-medium text-lg max-sm:text-base">
                    Student Verification Required
                  </h2>
                  <div className="space-y-2">
                    <div className="text-sm text-yellow-300 mb-2 max-sm:text-xs">
                      <span className="font-medium">📧 Email Verification</span>{" "}
                      - Please verify your student email to continue with the
                      discount
                    </div>

                    <div className="flex space-x-2 max-sm:flex-col max-sm:space-x-0 max-sm:space-y-2">
                      <div className="flex-1 max-sm:w-full">
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmailLocal(e.target.value)}
                          placeholder="Enter your student email (e.g., you@student.uni.ac.uk)"
                          className={`w-full border ${
                            emailError ? "border-red-400" : "border-gray-500"
                          } bg-[#24242D] text-white rounded-md p-2 text-sm max-sm:text-xs ${
                            emailError
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
                          className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-600 disabled:cursor-not-allowed max-sm:text-xs max-sm:px-3"
                        >
                          {isSendingVerification
                            ? "Sending..."
                            : "Verify Email"}
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-green-600 text-white text-sm rounded-md flex items-center max-sm:text-xs max-sm:px-3">
                          ✓ Verified
                        </div>
                      )}
                    </div>

                    {emailError && (
                      <span className="text-sm text-red-400 max-sm:text-xs">
                        {emailError}
                      </span>
                    )}

                    {studentVerificationSent && !studentVerified && (
                      <div className="text-sm text-green-400 bg-green-600/20 p-2 rounded-md max-sm:text-xs max-sm:p-1.5">
                        ✓ Verification email sent! Please check your inbox and
                        click the verification link.
                      </div>
                    )}

                    {studentVerified && (
                      <div className="text-sm text-green-400 bg-green-600/20 p-2 rounded-md max-sm:text-xs max-sm:p-1.5">
                        ✓ Student email verified! You can now proceed with the
                        student discount.
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Free Offer Banner */}
            <div className="border rounded-3xl border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden max-sm:rounded-2xl">
              <div className="flex items-center gap-4 p-4 border-b border-white/10 max-sm:p-3 max-sm:gap-3">
                <div
                  className="h-4 w-4 rounded-full 
              bg-purple-500
               min-w-4 animate-pulse max-sm:h-3 max-sm:w-3"
                ></div>
                <div>
                  <span className="text-sm font-medium text-white max-sm:text-xs">
                    {sliderContent["free_offer_banner_text"]}
                  </span>
                </div>
              </div>
              <div className="p-4 max-sm:p-3">
                <div className="grid grid-cols-3 gap-3 max-sm:gap-2">
                  {/* August slots */}
                  <div className="text-center">
                    <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                      {sliderContent["slot1_label"]}
                    </div>
                    <div className="bg-[#1e1e27] rounded-full p-2 max-sm:p-1.5">
                      <div className="text-xs text-white font-semibold max-sm:text-xs">
                        {sliderContent["slot1_status"]}
                      </div>
                    </div>
                  </div>

                  {/* September slots */}
                  <div className="text-center">
                    <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                      {sliderContent["slot2_label"]}
                    </div>
                    <div className="bg-[#5a3ddb] rounded-full p-2 max-sm:p-1.5">
                      <div className="text-xs text-white font-semibold max-sm:text-xs">
                        {sliderContent["slot2_status"]}
                      </div>
                    </div>
                  </div>

                  {/* October slots */}
                  <div className="text-center">
                    <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                      {sliderContent["slot3_label"]}
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

            {/* Express Checkout Section */}
            <div className="space-y-3 mb-6 max-sm:mb-4">
              <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg pt-4 max-sm:text-base max-sm:pt-3">
                  Express checkout
              </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
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

             
              <StripeProvider>
                  {/* Hidden component that handles payment logic - buttons below trigger it */}
                <ExpressPaymentRequestButton
                    ref={expressPaymentButtonRef}
                  amount={expressPaymentData.totalAmount}
                    currency="GBP"
                  email={userEmail}
                  travellers={travelers}
                  country={getCountryParam(selectedCountry) || "Germany"}
                  includeInsurance={expressPaymentData.includeInsurance}
                  insuranceCount={insuranceCount}
                  insurancePaymentAmount={expressPaymentData.insurancePaymentAmount}
                  visaTypeId={expressPaymentData.visaTypeId}
                  paymentType="application_creation"
                  onBeforePayment={validateBeforeExpressPayment}
                    visaFees={expressPaymentData.visaFees}
                    insuranceFees={expressPaymentData.insuranceFees}
                    giftCardFees={expressPaymentData.giftCardFees}
                    includeGiftCard={expressPaymentData.includeGiftCard}
                    giftCardCount={expressPaymentData.giftCardCount}
                    hideUI={true} // Hide the Stripe button UI
                    // Pass all values needed for localStorage/Redux setup (same as handleProceedToCheckout)
                    subtotalGBP={expressPaymentData.subtotalGBP}
                    discountedInsuranceFeesGBP={expressPaymentData.discountedInsuranceFeesGBP}
                    visaFeesGBP={expressPaymentData.visaFeesGBP}
                    couponCode={expressPaymentData.couponCode}
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
                    const availableCount = (isApplePayAvailable ? 1 : 0) + (isGooglePayAvailable ? 1 : 0);
                    const gridCols = availableCount === 1 ? "grid-cols-1" : "grid-cols-2";
                    
                    return (
                      <div className={`grid ${gridCols} gap-3 max-sm:grid-cols-1 max-sm:gap-2`}>
                        {/* Apple Pay Button */}
                        {isApplePayAvailable && (
                          <button
                            onClick={() => {
                              if (!expressPaymentButtonRef.current?.triggerPaymentRequest) {
                                showError(
                                  "Payment system is not initialized. Please refresh and try again."
                                );
                                return;
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
                            className="group relative flex items-center justify-center bg-black text-white rounded-full px-[20px] py-3.5 text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm w-full max-sm:py-2.5"
                            style={{
                              backgroundColor: "#000",
                              minHeight: "44px",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                            <svg
                                width="25"
                                height="25"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="shrink-0 max-sm:w-4 max-sm:h-4"
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
                            onClick={() => {
                              if (!expressPaymentButtonRef.current?.triggerPaymentRequest) {
                                showError(
                                  "Payment system is not initialized. Please refresh and try again."
                                );
                                return;
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
                            className="group relative flex items-center justify-center bg-white text-gray-800 rounded-full px-[20px] py-3.5 text-sm font-medium hover:shadow-md transition-all duration-200 shadow-sm border border-gray-200 w-full max-sm:py-2.5"
                            style={{
                              minHeight: "44px",
                              maxHeight: "44px",
                              background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
                              boxSizing: "border-box",
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

            {/* Checkout Button */}
            <button
              onClick={() => handleGetVisa()}
              className="group flex w-full justify-between items-center bg-[#6B4EFF] text-white gap-[16px] font-medium px-[20px] py-3.5 rounded-full cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb] max-sm:py-3 max-sm:px-4"
            >
              <span className="mr-3 text-xl font-semibold max-sm:text-lg max-sm:mr-2">
                {selectedPaymentMethod === "stripe"
                  ? "CONTINUE WITH CREDIT CARD"
                  : selectedPaymentMethod === "klarna"
                  ? "CONTINUE WITH KLARNA"
                  : "CONTINUE TO CHECKOUT"}
              </span>
              <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0 max-sm:p-1">
                <ArrowUpRight className="w-5 h-5 text-[#6B4EFF] max-sm:w-4 max-sm:h-4" />
              </span>
            </button>

            {/* Footer Info */}
            <div className="mt-4 space-y-2 max-sm:mt-3 max-sm:space-y-1.5">
              <div className="flex items-center space-x-2 text-sm max-sm:text-xs">
                <MedalIcon className="size-5 text-white/70 max-sm:w-4 max-sm:h-4" />
                <span>99.3% Visa approval rate</span>
              </div>
              <div className="flex items-center space-x-2 text-sm max-sm:text-xs">
                <ShieldCheckIcon className="size-5 text-white/70 max-sm:w-4 max-sm:h-4" />
                <span>100% Risk free - Get your visa or full refund</span>
              </div>
            </div>

            {/* Get Help Button */}
            <a
              href="https://wa.me/447387667534"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-fit rounded-full border border-white text-white py-1.5 hover:border-purple-500 transition-colors text-sm px-4 cursor-pointer max-sm:mt-3 max-sm:py-1 max-sm:px-3 max-sm:text-xs flex items-center"
            >
              <Image
                src="/icons/whatsapp.svg"
                alt="Get Help"
                width={20}
                height={20}
                className="inline-block mr-1 size-5 text-white max-sm:w-4 max-sm:h-4"
                priority
              />
              Get Help
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CountrySlider;


