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
  addRedeemedGiftCard,
  removeRedeemedGiftCard,
  clearRedeemedGiftCards,
  setVisaPriceDisplay,
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
import { FaApple } from "react-icons/fa";
import { useToast } from "@/contexts/ToastContext";
import { CommonDatePicker } from "@/ui/date-picker";
import { useSliderContent } from "@/hooks/useSliderContent";
import SimpleAlert from "./SimpleAlert";
import LazyWhenVisible from "./LazyWhenVisible";
import CountryCarousel from "./slider/CountryCarousel";
import { normalizeCountryKey, parseOccasionPrice } from "./slider/sliderUtils";
import VisaFeeBreakdown from "./VisaFeeBreakdown";
import dynamic from "next/dynamic";

const ConfirmationModal = dynamic(() => import("./ConfirmationModal"), {
  ssr: false,
});
const StripeProvider = dynamic(() => import("./StripeProvider"), {
  ssr: false,
});
const ExpressPaymentRequestButton = dynamic(
  () => import("./ExpressPaymentRequestButton"),
  { ssr: false },
);
const ExpertSection = dynamic(() => import("./ExpertSection"), {
  loading: () => <div className="min-h-[120px]" aria-hidden />,
});
import { validateGiftCardCode, redeemGiftCardCode } from "@/api/giftCard";
import { useCountriesWithAppointmentTexts } from "@/hooks/useCountriesWithAppointmentTexts";
import { staticCountries } from "@/constants/staticCountries";
import { getDynamicMonthText } from "@/utils/getDynamicMonthText";
import { getCurrentWeekSlotPercentage } from "@/utils/getCurrentWeekSlotPercentage";
import { getAdminApiBase } from "@/utils/adminApiBase";
import { GIFT_CARD_PRODUCT_NAME } from "@/constants/productLabels";
import { buildGtmUserData, clearStaleGtmUserData, resolveCoupon, computeCouponDiscountPerUnit } from "@/utils/gtmUserData";
import { setExpertSpotsDefaultFromApi } from "@/utils/expertSpots";

const CountrySlider = ({ moreToLoveData, checkoutButtonDescription }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showError, showSuccess } = useToast();
  const MIN_SAFE_DAYS_BEFORE_TRAVEL = 15;

  useEffect(() => {
    import("react-datepicker/dist/react-datepicker.css");
  }, []);

  const currentWeekReservedText = useMemo(
    () => getCurrentWeekSlotPercentage(new Date()),
    [],
  );

  const { content: sliderContent } = useSliderContent();
  const visaState = useAppSelector((state) => state.visa);
  const [countryPricingList, setCountryPricingList] = useState([]);
  const [isVisaPricingLoading, setIsVisaPricingLoading] = useState(true);
  const [visaPricingError, setVisaPricingError] = useState("");
  const [allOccasions, setAllOccasions] = useState([]);
  const [occasionPricing, setOccasionPricing] = useState(null);
  const [occasionCountryNames, setOccasionCountryNames] = useState([]);
  const [occasionDateRange, setOccasionDateRange] = useState(null); // { start: Date, end: Date }
  const [occasionTraditionalText, setOccasionTraditionalText] = useState("");

  const freeOfferBannerText = useMemo(() => {
    const rawText =
      sliderContent["free_offer_banner_text"] ||
      "Free Auto-booking appointment and concierge assistance ends soon - Until {month} {year}.";

    const normalizedText =
      typeof rawText === "string"
        ? rawText
            .replace(/\s+/g, " ")
            .trim()
            .replace(/Free Auto-booking/gi, "Free\u00A0Auto-booking")
        : rawText;

    return getDynamicMonthText(normalizedText);
  }, [sliderContent]);

  const more_to_love = useMemo(
    () => ({
      title: moreToLoveData?.title || "More to love",
      leftTitle: moreToLoveData?.leftTitle || "Insurance Certificate",
      rightTitle: moreToLoveData?.rightTitle || "E-Gift Card",
      leftSubtitle: moreToLoveData?.leftSubtitle || "",
      rightSubtitle: moreToLoveData?.rightSubtitle || "",
    }),
    [moreToLoveData],
  );
  // console.log(moreToLoveData);

  useEffect(() => {
    setExpertSpotsDefaultFromApi(sliderContent["slots_left"]);
  }, [sliderContent]);

  const nriBadgeText = sliderContent["nri_badge_text"] || "";
  const dailyNriBadgeText = useMemo(() => {
    const textOptions = nriBadgeText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (textOptions.length === 0) return "";

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / 86400000);
    const textIndex = (dayOfYear - 1) % textOptions.length;

    return textOptions[textIndex];
  }, [nriBadgeText]);

  const hasEuFlagBadge = dailyNriBadgeText?.includes("🇪🇺");

  const renderedNriBadgeText = useMemo(() => {
    if (!hasEuFlagBadge) {
      return dailyNriBadgeText;
    }

    const parts = dailyNriBadgeText.split("🇪🇺");

    return parts.map((part, index) => (
      <span key={`nri-badge-part-${index}`}>
        {part}
        {index < parts.length - 1 ? (
          <span className="inline-flex items-center align-middle mx-1">
            <Image
              src="/image/eu-flag.png"
              alt="EU"
              width={28}
              height={28}
              className="inline-block rounded-full"
            />
          </span>
        ) : null}
      </span>
    ));
  }, [dailyNriBadgeText, hasEuFlagBadge]);

  useEffect(() => {
    let mounted = true;

    const fetchVisaPricing = async () => {
      try {
        setIsVisaPricingLoading(true);
        setVisaPricingError("");
        const apiBase = String(process.env.NEXT_PUBLIC_API_URL || "").replace(
          /\/+$/,
          "",
        );
        const adminBase = getAdminApiBase();
        const candidates = [
          `/api/visa-pricing`,
          `${apiBase}/visa_pricing`,
          `${apiBase}/api/visa_pricing`,
          `${apiBase}/api/public/visa_pricing`,
          `${apiBase}/api/public/visa-pricing`,
          `${adminBase}/api/visa_pricing`,
          `${adminBase}/visa_pricing`,
          `${adminBase}/api/public/visa_pricing`,
          `${adminBase}/api/public/visa-pricing`,
        ].filter((url) => /^https?:\/\//i.test(url) || url.startsWith("/"));

        let payload = null;
        let hasSuccessfulResponse = false;
        for (const endpoint of candidates) {
          try {
            const res = await fetch(endpoint, { method: "GET" });
            if (!res.ok) continue;
            hasSuccessfulResponse = true;
            const json = await res.json();
            const status = String(json?.status || "").toUpperCase();
            if (status === "ERROR") continue;
            payload = json?.data?.results || [];
            if (Array.isArray(payload)) break;
          } catch {
            // Try next endpoint
          }
        }

        if (!mounted) return;
        if (!hasSuccessfulResponse) {
          setVisaPricingError(
            "Visa pricing is temporarily unavailable. Please try again shortly.",
          );
          setCountryPricingList([]);
          return;
        }

        if (!Array.isArray(payload) || payload.length === 0) {
          const { DEFAULT_VISA_PRICING } = await import("@/data/defaultVisaPricing");
          payload = DEFAULT_VISA_PRICING;
        }
        // console.log("payload receive", payload);
        const normalized = payload
          .map((item) => ({
            id: String(item?.id || ""),
            name: String(item?.name || "").trim(),
            basePrice: Number(item?.basePrice),
            strikeOutPrice: Number(item?.strikeOutPrice),
            reason: String(item?.reason || ""),
            showReason: Boolean(item?.showReason),
          }))
          .filter(
            (item) =>
              item.id &&
              item.name &&
              Number.isFinite(item.basePrice) &&
              Number.isFinite(item.strikeOutPrice),
          );

        if (normalized.length === 0) {
          setCountryPricingList([]);
          setVisaPricingError("Visa pricing data is unavailable right now.");
          return;
        }

        setCountryPricingList(normalized);
      } catch {
        if (!mounted) return;
        setCountryPricingList([]);
        setVisaPricingError(
          "Visa pricing is temporarily unavailable. Please try again shortly.",
        );
      } finally {
        if (mounted) setIsVisaPricingLoading(false);
      }
    };

    fetchVisaPricing();
    return () => {
      mounted = false;
    };
  }, []);

  const isVisaPricingEmpty =
    !isVisaPricingLoading &&
    !visaPricingError &&
    countryPricingList.length === 0;

  const [_isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountryLocal] = useState(
    visaState.selectedCountry || "Belgium",
  );
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [insuranceDays, setInsuranceDays] = useState(0);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const requiredDocumentRef = useRef(null);
  const mainSectionRef = useRef(null);
  const reasonTooltipRef = useRef(null);
  const urlDatesAppliedRef = useRef(false);

  // Use Redux state instead of local state
  const travelers = Math.max(Number(visaState.travelers ?? 0), 0);
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
    // d.setHours(0, 0, 0, 0);
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
    () => persistedArrivalDate || initialArrivalDate,
  );
  const [departureDate, setDepartureDateLocal] = useState(() => {
    if (persistedDepartureDate) return persistedDepartureDate;
    if (persistedArrivalDate)
      return computeDefaultDeparture(persistedArrivalDate);
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
  const [isExpertSelected, setIsExpertSelected] = useState(false);

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

  const toDateOnly = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  // Keep occasion date resolution aligned with occasion cards for title-only occasions.
  const resolveOccasionRange = useCallback((occ) => {
    if (!occ) return null;

    const explicitStart = occ.arrivalDate || occ.startDate;
    const explicitEnd = occ.departureDate || occ.endDate;

    if (explicitStart && explicitEnd) {
      const start = toDateOnly(explicitStart);
      const end = toDateOnly(explicitEnd);
      if (start && end) return { start, end };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const title = String(occ?.title || "")
      .toLowerCase()
      .trim();

    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const monthShort = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    let monthIndex = monthNames.findIndex((m) => title.includes(m));
    if (monthIndex === -1) {
      monthIndex = monthShort.findIndex(
        (m) => title === m || title.startsWith(`${m} `),
      );
    }

    if (monthIndex !== -1) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1], 10);
      else if (
        monthIndex < now.getMonth() ||
        (monthIndex === now.getMonth() && now.getDate() > 15)
      ) {
        year = currentYear + 1;
      }

      const start = toDateOnly(
        `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`,
      );
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const end = toDateOnly(
        `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
          lastDay,
        ).padStart(2, "0")}`,
      );

      if (start && end) return { start, end };
    }

    if (title.includes("easter")) {
      let year = currentYear;
      const easterDates = {
        2025: [4, 20],
        2026: [4, 5],
        2027: [3, 28],
        2028: [4, 16],
      };

      const entry = easterDates[year] || easterDates[year + 1];
      if (entry && new Date(year, entry[0] - 1, entry[1]) < now) year++;
      const [month, day] = easterDates[year] || [4, 5];
      const start = new Date(year, month - 1, day - 3);
      const end = new Date(year, month - 1, day + 4);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }

    if (title.includes("xmas") || title.includes("christmas")) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1], 10);
      else if (now.getMonth() === 11 && now.getDate() > 26) year++;
      const start = toDateOnly(`${year}-12-20`);
      const end = toDateOnly(`${year}-12-31`);
      if (start && end) return { start, end };
    }

    if (title.includes("new year")) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1], 10);
      else if (now.getMonth() === 0 && now.getDate() > 5) year++;
      const start = toDateOnly(`${year}-12-28`);
      const end = toDateOnly(`${year + 1}-01-05`);
      if (start && end) return { start, end };
    }

    if (title.includes("half term")) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1], 10);
      else if (now.getMonth() > 1) year++;
      const start = toDateOnly(`${year}-02-15`);
      const end = toDateOnly(`${year}-02-23`);
      if (start && end) return { start, end };
    }

    const fallbackStart = new Date();
    fallbackStart.setHours(0, 0, 0, 0);
    fallbackStart.setDate(fallbackStart.getDate() + 28);
    const fallbackEnd = new Date(fallbackStart);
    fallbackEnd.setDate(fallbackEnd.getDate() + 14);
    fallbackEnd.setHours(0, 0, 0, 0);
    return { start: fallbackStart, end: fallbackEnd };
  }, []);

  const getCountryParam = (countryVal) => {
    const raw = countryVal?.name || countryVal || "";
    if (!raw) return "";
    return raw.includes(",") ? raw.split(", ")[1] : raw;
  };

  const countryPricingLookup = useMemo(() => {
    return countryPricingList.reduce((acc, item) => {
      acc[normalizeCountryKey(item.name)] = item;
      return acc;
    }, {});
  }, [countryPricingList]);

  const selectedCountryPricing = useMemo(() => {
    const countryName = getCountryParam(selectedCountry) || "Belgium";
    const basePricing =
      countryPricingLookup[normalizeCountryKey(countryName)] || null;
    const occasionMatch = occasionPricing?.find(
      (p) =>
        normalizeCountryKey(p.country) === normalizeCountryKey(countryName),
    );

    if (!occasionMatch) return basePricing;

    return {
      ...basePricing,
      reason: occasionMatch.reason || basePricing?.reason || "",
      reasonName: occasionMatch.reasonName || basePricing?.reasonName || "",
    };
  }, [
    selectedCountry,
    countryPricingLookup,
    occasionPricing,
    normalizeCountryKey,
  ]);

  // Occasion-specific pricing for the selected country (3-tier: early, original, traditional)
  const activeOccasionPricing = useMemo(() => {
    if (!occasionPricing) return null;
    const countryName = getCountryParam(selectedCountry) || "Belgium";
    const match = occasionPricing.find(
      (p) =>
        normalizeCountryKey(p.country) === normalizeCountryKey(countryName),
    );
    if (!match) return null;

    let mode = match.priceMode === "two" ? "two" : "three";
    const early = parseOccasionPrice(match.earlyDiscount);
    const original = parseOccasionPrice(match.originalPrice);
    const traditional = parseOccasionPrice(match.traditionalPrice);

    const hasEarly = Number.isFinite(early) && early > 0;
    const hasOriginal = Number.isFinite(original) && original > 0;
    const hasTraditional = Number.isFinite(traditional) && traditional > 0;

    let currentPrice = 0;
    let comparisonPrice = 0;
    let thirdPrice = 0;

    if (mode === "three" && !hasEarly && hasOriginal) {
      mode = "two";
    }

    if (mode === "two") {
      // 2-price mode: use Original as current and Traditional as strike-through.
      currentPrice = hasOriginal ? original : hasTraditional ? traditional : 0;
      comparisonPrice =
        hasTraditional && traditional !== currentPrice ? traditional : 0;
    } else {
      // 3-price mode: Early (current), Original, Traditional.
      currentPrice = hasEarly
        ? early
        : hasOriginal
          ? original
          : hasTraditional
            ? traditional
            : 0;
      comparisonPrice = hasOriginal && original !== currentPrice ? original : 0;
      thirdPrice =
        hasTraditional && traditional !== currentPrice ? traditional : 0;

      if (!comparisonPrice && thirdPrice) {
        comparisonPrice = thirdPrice;
        thirdPrice = 0;
      }
    }

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null;

    return {
      priceMode: mode,
      currentPrice,
      comparisonPrice,
      thirdPrice,
      earlyDiscountLabel: match.earlyDiscountLabel || "",
      originalPriceLabel: match.originalPriceLabel || "",
      traditionalPriceLabel: match.traditionalPriceLabel || "",
      reason: match.reason || "",
      reasonName: match.reasonName || "",
    };
  }, [occasionPricing, selectedCountry]);

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

      // Priority 3: Check trip duration limits (only if dates are in correct order)
      const tripDuration = Math.ceil(
        (departureDate - arrivalDate) / (1000 * 60 * 60 * 24),
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

    return errors;
  };

  // Handle date changes with validation and Redux updates
  const handleArrivalDateChange = (date) => {
    const safeDate = isValidDate(date) ? date : null;
    setArrivalDateLocal(safeDate);
    const dateString = safeDate ? safeDate.toISOString().split("T")[0] : "";
    dispatch(setArrivalDate(dateString));

    // Auto-set end date to 15 days total (start + 14 days), editable by user later.
    let nextDeparture = departureDate;
    if (safeDate) {
      nextDeparture = new Date(safeDate);
      nextDeparture.setDate(nextDeparture.getDate() + 14);
    } else {
      nextDeparture = null;
    }

    // Respect visa max duration if needed.
    if (selectedVisaType?.duration_permitted && safeDate && nextDeparture) {
      const maxDays = parseDurationDays(selectedVisaType.duration_permitted);
      const tripDays = Math.ceil(
        (nextDeparture - safeDate) / (1000 * 60 * 60 * 24),
      );

      if (maxDays && tripDays > maxDays) {
        nextDeparture = new Date(
          safeDate.getTime() + (maxDays - 1) * 24 * 60 * 60 * 1000,
        );
      }
    }

    setDepartureDateLocal(nextDeparture);
    dispatch(
      setDepartureDate(
        nextDeparture ? nextDeparture.toISOString().split("T")[0] : "",
      ),
    );

    const errors = validateDates(safeDate, nextDeparture, selectedVisaType);
    setDateValidationErrors(errors);
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
    sessionStorage.setItem("popupSessionStatus", "hidden");
  }, []);

  useEffect(() => {
    if (selectedVisaType) {
      const errors = validateDates(
        arrivalDate,
        departureDate,
        selectedVisaType,
      );
      setDateValidationErrors(errors);

      // Auto-adjust departure date if it exceeds the new visa type's duration limit
      if (selectedVisaType.duration_permitted && arrivalDate && departureDate) {
        const maxDays = parseDurationDays(selectedVisaType.duration_permitted);
        const currentTripDays = Math.ceil(
          (departureDate - arrivalDate) / (1000 * 60 * 60 * 24),
        );

        if (maxDays && currentTripDays > maxDays) {
          const newDepartureDate = new Date(
            arrivalDate.getTime() + (maxDays - 1) * 24 * 60 * 60 * 1000,
          );
          setDepartureDateLocal(newDepartureDate);
          dispatch(
            setDepartureDate(newDepartureDate.toISOString().split("T")[0]),
          );
        }
      }
    }
  }, [selectedVisaType, arrivalDate, departureDate]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (activeTooltip !== "priorityAppointment") return;
      if (!reasonTooltipRef.current) return;
      if (!reasonTooltipRef.current.contains(event.target)) {
        setActiveTooltip(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeTooltip]);

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
        const arrivalStr = getLocalDateString(
          arrivalDate || initialArrivalDate,
        );
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
          selectedVisaType,
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
    // Skip if URL date params were applied — they take priority
    if (urlDatesAppliedRef.current) return;

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
        (field) => !requiredDocuments[field],
      );

      if (missingDocs.length > 0) {
        setValidationErrors(new Set(missingDocs));
        // Scroll to documents section
        const documentsSection = document.querySelector(
          "[data-documents-section]",
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
    const staticBasePrice = Number(selectedCountryPricing?.basePrice);
    if (Number.isFinite(staticBasePrice) && staticBasePrice > 0) {
      return staticBasePrice;
    }

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
    const staticStrikeOutPrice = Number(selectedCountryPricing?.strikeOutPrice);
    if (Number.isFinite(staticStrikeOutPrice) && staticStrikeOutPrice > 0) {
      return staticStrikeOutPrice;
    }

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
  const expertPricePerMonth = 35;
  const expertAccessMonths = 3;
  const EMBASSY_FEE_GBP = {
    age12Plus: 78,
    age6To11: 40,
    age0To5: 0,
  };
  const embassyFeePerTravelerGBP = EMBASSY_FEE_GBP.age12Plus;
  const embassyFeeTotalGBP = embassyFeePerTravelerGBP * Number(travelers || 0);

  // Memoize expensive calculations
  const currentVisaFeePerTraveler = useMemo(() => {
    if (selectedVisaType?.priceGBP) return Number(selectedVisaType.priceGBP);
    if (selectedVisaType?.price) {
      const converted = Math.round(Number(selectedVisaType.price) / 100);
      if (converted > 0) return converted;
    }
    return baseFee;
  }, [selectedVisaType?.priceGBP, selectedVisaType?.price, baseFee]);

  const calculateStoredVisaFee = useCallback(
    ({ travelerCount = travelers, hasOnlyInsurance = false } = {}) => {
      if (hasOnlyInsurance) return 0;

      const normalizedTravelers = Math.max(1, Number(travelerCount) || 1);
      const occasionBasePerTraveler = Number(
        activeOccasionPricing?.currentPrice,
      );
      const isOccasionVisaPricingActive =
        Number.isFinite(occasionBasePerTraveler) && occasionBasePerTraveler > 0;

      const basePerTraveler = isOccasionVisaPricingActive
        ? occasionBasePerTraveler
        : currentVisaFeePerTraveler;

      return Number((basePerTraveler * normalizedTravelers).toFixed(2));
    },
    [activeOccasionPricing?.currentPrice, currentVisaFeePerTraveler, travelers],
  );

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
  }, [
    recommendedItems.insuranceCertificate,
    insuranceCount,
    effectiveInsuranceDays,
  ]);

  const originalInsuranceBase = useMemo(() => {
    if (
      !recommendedItems.insuranceCertificate ||
      !insuranceCount ||
      insuranceCount <= 0
    ) {
      return 0;
    }
    return (
      originalPerDayInsurancePrice * effectiveInsuranceDays * insuranceCount
    );
  }, [
    recommendedItems.insuranceCertificate,
    insuranceCount,
    effectiveInsuranceDays,
  ]);

  const computedInsuranceTotal = discountedInsuranceBase;

  const tooltips = {
    sticker:
      "A visa sticker is a physical visa label attached to your passport. It contains your personal details, visa type, validity period, and number of entries allowed.",
    duration: [
      "Your visa will show how many days you are allowed to stay, which can be up to 90 days within a 180-day period.",
      "If your visa is valid for less than 90 days, you can only stay until your visa expires.",
    ],
    term: "Short-term visas are typically issued for visits under 90 days. They're commonly used for tourism, business trips, or visiting family/friends.",
    entry:
      "Multiple entry lets you enter the Schengen Area multiple times. Single entry permits to enter once during the visa's validity period.",
  };

  const _handleTravelerChange = (increment) => {
    const newValue = travelers + increment;
    const normalizedValue = Math.max(1, Number(newValue) || 1);

    // If traveler count decreases, adjust insurance count if needed
    if (insuranceCount > normalizedValue) {
      dispatch(setReduxInsuranceCount(Number(normalizedValue)));
    }

    dispatch(setReduxTravelers(Number(normalizedValue)));

    // Keep Redux visa total in sync with traveler changes (single source of truth)
    dispatch(
      setVisaFees(calculateStoredVisaFee({ travelerCount: normalizedValue })),
    );
  };

  const selectCountry = (country) => {
    setSelectedCountryLocal(country);
    setIsCountryOpen(false);

    const countryName = typeof country === "object" ? country.name : country;
    const dynamicPricing =
      countryPricingLookup[normalizeCountryKey(countryName)] || null;

    const countryConfig = getCountryConfig(countryName);

    // 🔥 GA4: Track View Item when country changes 🔥
    if (typeof window !== "undefined" && window.dataLayer) {
      const currentTravelers = Math.max(Number(visaState?.travelers || 0), 0);

      // 🌟 FIXED: Extract coupon clean without raw text leakage
      const baseCode = visaState?.appliedDiscount?.code || undefined;

      const vCoupon = resolveCoupon(currentTravelers >= 3, baseCode);

      const baseUnitPrice =
        dynamicPricing?.basePrice ?? countryConfig.visaFee ?? 129;
      const appliedCode = visaState?.appliedDiscount?.code;
      const discountPct =
        appliedCode === "GROUP20" && currentTravelers >= 3
          ? 20
          : appliedCode === "STUDENT10"
            ? visaState?.appliedDiscount?.percentage || 10
            : 0;
      const discountedUnitPrice =
        discountPct > 0
          ? baseUnitPrice * (1 - discountPct / 100)
          : baseUnitPrice;
      const discountAmountPerUnit = Number(
        (baseUnitPrice - discountedUnitPrice).toFixed(2),
      );

      const vItem = {
        item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
        item_name: `Visa - ${countryName}`,
        item_category: "Schengen Visa",
        item_brand: "NUvisa",
        price: Number(discountedUnitPrice.toFixed(2)),
        quantity: currentTravelers,
      };
      if (discountAmountPerUnit > 0) vItem.discount = discountAmountPerUnit;
      if (vCoupon) vItem.coupon = vCoupon;

      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: "GBP",
          value: Number((discountedUnitPrice * currentTravelers).toFixed(2)),
          coupon: vCoupon,
          items: [vItem],
        },
      });
    }

    dispatch(setReduxSelectedCountry(String(countryName)));
    dispatch(
      setVisaFees(Number(dynamicPricing?.basePrice ?? countryConfig.visaFee)),
    );
    dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const thumbnailContainerRef = useRef(null);

  const { countries, normalizeCountryName } = useCountriesWithAppointmentTexts({
    staticCountries,
    fallbackAppointmentText: "Appointment in 10 days or less",
    sortBy: "name",
  });

  const defaultCountryMarker = "default_country";

  // console.log("Default Country Marker:", countryPricingList);

  const dropdownCountries = useMemo(() => {
    const baseCountries = countryPricingList
      .map((country) => country?.name)
      .filter(Boolean)
      .filter(
        (countryName) =>
          normalizeCountryName(countryName) !==
          normalizeCountryName(defaultCountryMarker),
      );

    if (!occasionCountryNames.length) {
      return baseCountries;
    }

    const occasionSet = new Set(
      occasionCountryNames.map((name) => normalizeCountryName(name)),
    );

    return baseCountries.filter((countryName) =>
      occasionSet.has(normalizeCountryName(countryName)),
    );
  }, [countryPricingList, normalizeCountryName, occasionCountryNames]);

  useEffect(() => {
    if (!dropdownCountries.length) return;
    const current = normalizeCountryName(getCountryParam(selectedCountry));
    const hasCurrent = dropdownCountries.some(
      (country) => normalizeCountryName(country) === current,
    );
    if (!hasCurrent) {
      const first = dropdownCountries[0];
      setSelectedCountryLocal(first);
      dispatch(setReduxSelectedCountry(String(first)));
    }
  }, [dropdownCountries, selectedCountry, dispatch, normalizeCountryName]);

  const adminDefaultCountry = useMemo(() => {
    const markerCountry = countries.find(
      (country) =>
        normalizeCountryName(country?.name) ===
        normalizeCountryName(defaultCountryMarker),
    );

    const value = markerCountry?.appointmentText || "";
    return typeof value === "string" ? value.trim() : "";
  }, [countries, normalizeCountryName]);

  const carouselCountries = useMemo(
    () => staticCountries.filter((country) => country?.name && country?.image),
    [],
  );

  const selectedCountryData = useMemo(() => {
    return (
      countries.find(
        (c) =>
          normalizeCountryName(c.name) ===
          normalizeCountryName(selectedCountry),
      ) || {}
    );
  }, [countries, selectedCountry, normalizeCountryName]);

  const carouselLength = carouselCountries.length;

  const activeCarouselCountry =
    carouselCountries[currentIndex] || carouselCountries[0] || null;

  // Handle pre-selected country from URL parameters
  useEffect(() => {
    if (router.query.selectedCountry) {
      const countryFromUrl = router.query.selectedCountry;
      const isAvailableCountry = dropdownCountries.some(
        (country) =>
          normalizeCountryName(country) ===
          normalizeCountryName(countryFromUrl),
      );

      if (isAvailableCountry) {
        setSelectedCountryLocal(countryFromUrl);
        dispatch(setReduxSelectedCountry(String(countryFromUrl)));
      }
    } else if (router.query.occasionIdx !== undefined) {
      const matchedCountry = dropdownCountries.find(
        (country) =>
          normalizeCountryName(country) === normalizeCountryName("Switzerland"),
      );
      if (matchedCountry) {
        setSelectedCountryLocal(matchedCountry);
        dispatch(setReduxSelectedCountry(String(matchedCountry)));
      }
    }
  }, [
    router.query.selectedCountry,
    router.query.occasionIdx,
    dropdownCountries,
    normalizeCountryName,
    dispatch,
  ]);

  // Apply admin-configured default country when URL does not force one
  useEffect(() => {
    if (router.query.selectedCountry) return;
    if (router.query.occasionIdx !== undefined) return;
    if (!adminDefaultCountry || !dropdownCountries.length) return;

    const matchedCountry = dropdownCountries.find(
      (country) =>
        normalizeCountryName(country) ===
        normalizeCountryName(adminDefaultCountry),
    );

    if (!matchedCountry) return;

    setSelectedCountryLocal(matchedCountry);
    dispatch(setReduxSelectedCountry(String(matchedCountry)));
  }, [
    router.query.selectedCountry,
    adminDefaultCountry,
    dropdownCountries,
    normalizeCountryName,
    dispatch,
  ]);

  // Handle pre-selected dates from URL parameters (e.g. from occasion cards)
  // arrivalDate = start of admin range (used as booking start date)
  // departureDate = end of admin range (used to validate discount eligibility, NOT as booking end)
  // Booking end date = start date + 14 days (15 days inclusive, current default)
  useEffect(() => {
    const urlArrival = router.query.arrivalDate;
    const urlDeparture = router.query.departureDate;
    if (!urlArrival) return;

    let applied = false;
    const parsedArrival = new Date(urlArrival + "T00:00:00");
    if (!Number.isNaN(parsedArrival.getTime())) {
      setArrivalDateLocal(parsedArrival);
      dispatch(setArrivalDate(parsedArrival.toISOString().split("T")[0]));

      // End date = start + 14 days (15 days inclusive)
      const autoEnd = new Date(parsedArrival);
      autoEnd.setDate(autoEnd.getDate() + 14);
      setDepartureDateLocal(autoEnd);
      dispatch(setDepartureDate(autoEnd.toISOString().split("T")[0]));
      applied = true;
    }

    if (applied) urlDatesAppliedRef.current = true;
  }, [router.query.arrivalDate, router.query.departureDate, dispatch]);

  // Fetch all occasions once.
  useEffect(() => {
    let mounted = true;

    const fetchOccasionPricing = async () => {
      try {
        const res = await fetch("/api/occasion-content");
        if (!res.ok) {
          if (mounted) {
            setAllOccasions([]);
            setOccasionPricing(null);
            setOccasionCountryNames([]);
            setOccasionDateRange(null);
            setOccasionTraditionalText("");
          }
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        if (!json.success || !Array.isArray(json.data?.occasions)) {
          setAllOccasions([]);
          setOccasionPricing(null);
          setOccasionCountryNames([]);
          setOccasionDateRange(null);
          setOccasionTraditionalText("");
          return;
        }
        setAllOccasions(json.data.occasions);
      } catch {
        if (mounted) {
          setAllOccasions([]);
          setOccasionPricing(null);
          setOccasionCountryNames([]);
          setOccasionDateRange(null);
          setOccasionTraditionalText("");
        }
      }
    };

    fetchOccasionPricing();
    return () => {
      mounted = false;
    };
  }, []);

  // Recompute active occasion from selected dates.
  // Start-date-driven eligibility: if start date is within occasion range,
  // keep that occasion even when selected end date is outside the range.
  useEffect(() => {
    const activeArrival = toDateOnly(arrivalDate);
    const activeDeparture = toDateOnly(departureDate);

    if (!activeArrival || !activeDeparture || !allOccasions.length) {
      setOccasionPricing(null);
      setOccasionCountryNames([]);
      setOccasionDateRange(null);
      setOccasionTraditionalText("");
      return;
    }

    const eligibleOccasions = allOccasions
      .map((occ, index) => {
        const countryPricing = Array.isArray(occ?.countryPricing)
          ? occ.countryPricing
          : [];
        const range = resolveOccasionRange(occ);
        if (!range || countryPricing.length === 0) return null;

        const inRange =
          activeArrival >= range.start && activeArrival <= range.end;

        if (!inRange) return null;

        return {
          index,
          range,
          countryPricing,
          traditionalPriceText: String(occ?.traditionalPriceText || ""),
        };
      })
      .filter(Boolean);

    const activeOccasion = eligibleOccasions[0] || null;

    if (eligibleOccasions.length > 1 && process.env.NODE_ENV === "development") {
      console.log(
        "[Slider][OccasionSelection] Multiple eligible occasions by start date; selecting first",
        {
          eligibleCount: eligibleOccasions.length,
          selectedIndex: eligibleOccasions[0]?.index,
          selectedRange: eligibleOccasions[0]?.range,
          arrivalDate: activeArrival,
          departureDate: activeDeparture,
        },
      );
    }

    if (!activeOccasion) {
      if (process.env.NODE_ENV === "development") {
        console.log("[Slider][OccasionSelection] No eligible occasion", {
          mode: "start-date-only",
          arrivalDate: activeArrival,
          departureDate: activeDeparture,
        });
      }
      setOccasionPricing(null);
      setOccasionCountryNames([]);
      setOccasionDateRange(null);
      setOccasionTraditionalText("");
      return;
    }

    const countries = activeOccasion.countryPricing
      .filter((item) => item?.country)
      .filter((item) => item?.isHidden !== true)
      .map((item) => String(item.country).trim())
      .filter(Boolean);

    setOccasionPricing(activeOccasion.countryPricing);
    setOccasionCountryNames(countries);
    setOccasionDateRange(activeOccasion.range);
    setOccasionTraditionalText(activeOccasion.traditionalPriceText);
  }, [allOccasions, arrivalDate, departureDate, resolveOccasionRange]);

  const currentCountryName = getCountryParam(selectedCountry) || "Belgium";
  const currentAppointmentText =
    countries.find(
      (country) =>
        normalizeCountryName(country.name) ===
        normalizeCountryName(currentCountryName),
    )?.appointmentText || "Appointment in 10 days or less";

  useEffect(() => {
    if (!carouselLength) return;
    if (currentIndex >= carouselLength) {
      setCurrentIndex(0);
    }
  }, [carouselLength, currentIndex]);

  useEffect(() => {
    if (carouselLength <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    const startTimer = () => {
      return setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const isLastSlide = prevIndex === carouselLength - 1;
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
  }, [carouselLength]);

  // Auto-scroll thumbnail container to keep active thumbnail visible
  useEffect(() => {
    const scrollToActiveThumbnail = (retryCount = 0) => {
      const container = thumbnailContainerRef.current;
      if (!container) {
        // Retry if container not ready (max 3 retries)
        if (retryCount < 3) {
          setTimeout(() => scrollToActiveThumbnail(retryCount + 1), 100);
        }
        return;
      }

      const activeThumbnail = container.children[currentIndex];
      if (!activeThumbnail) {
        // Retry if thumbnail not ready (max 3 retries)
        if (retryCount < 3) {
          setTimeout(() => scrollToActiveThumbnail(retryCount + 1), 100);
        }
        return;
      }

      // Use requestAnimationFrame to ensure layout is calculated
      requestAnimationFrame(() => {
        // Manually calculate scroll position to avoid affecting main page scroll
        const containerRect = container.getBoundingClientRect();
        const thumbnailRect = activeThumbnail.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const thumbnailWidth = thumbnailRect.width;

        let targetScrollLeft;
        let useFallback = false;

        // Check if getBoundingClientRect returned valid values
        if (
          containerWidth > 0 &&
          thumbnailWidth > 0 &&
          thumbnailRect.width > 0
        ) {
          // Use getBoundingClientRect calculation (preferred method)
          const containerScrollLeft = container.scrollLeft;
          const thumbnailLeft =
            thumbnailRect.left - containerRect.left + containerScrollLeft;
          const thumbnailCenter = thumbnailLeft + thumbnailWidth / 2;
          targetScrollLeft = thumbnailCenter - containerWidth / 2;
        } else {
          // Fallback: calculate based on index and estimated dimensions
          useFallback = true;
          // Thumbnail width: 80px (w-20), gap: 8px (gap-2), padding: 16px (px-4)
          const estimatedThumbnailWidth = 80; // w-20 = 80px
          const estimatedGap = 8; // gap-2 = 8px
          const estimatedPadding = 16; // px-4 = 16px
          const thumbnailLeft =
            currentIndex * (estimatedThumbnailWidth + estimatedGap) +
            estimatedPadding;
          const thumbnailCenter = thumbnailLeft + estimatedThumbnailWidth / 2;
          targetScrollLeft =
            thumbnailCenter -
            (containerWidth > 0 ? containerWidth : container.clientWidth) / 2;
        }

        // Ensure targetScrollLeft is valid
        if (typeof targetScrollLeft === "number" && !isNaN(targetScrollLeft)) {
          // Clamp to valid scroll range
          const maxScroll = Math.max(
            0,
            container.scrollWidth -
              (containerWidth > 0 ? containerWidth : container.clientWidth),
          );
          targetScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

          // Try scrollTo first, with fallback to direct scrollLeft assignment
          if (container.scrollTo) {
            try {
              container.scrollTo({
                left: targetScrollLeft,
                behavior: "smooth",
              });
            } catch (e) {
              // Fallback for browsers that don't support scrollTo options
              container.scrollLeft = targetScrollLeft;
            }
          } else {
            // Direct assignment as fallback
            container.scrollLeft = targetScrollLeft;
          }
        } else if (retryCount < 3) {
          // Retry if calculation failed (max 3 retries)
          setTimeout(() => scrollToActiveThumbnail(retryCount + 1), 100);
        }
      });
    };

    // Add a delay to ensure images are loaded and layout is settled
    // Use longer delay for production builds where images may load slower
    const timeoutId = setTimeout(() => scrollToActiveThumbnail(0), 100);

    return () => clearTimeout(timeoutId);
  }, [currentIndex, carouselLength]);

  const goToPrevious = () => {
    if (!carouselLength) return;
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? carouselLength - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    resetTimer();
  };

  const goToNext = () => {
    if (!carouselLength) return;
    const isLastSlide = currentIndex === carouselLength - 1;
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
    if (newValue < 0) return;

    // Insurance certificates are per traveller — raising insurance can raise traveller count
    if (increment > 0 && newValue > travelers) {
      dispatch(setReduxTravelers(Number(newValue)));
      dispatch(
        setVisaFees(
          calculateStoredVisaFee({ travelerCount: newValue }),
        ),
      );
    }

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
    if (carouselLength <= 1) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const isLastSlide = prevIndex === carouselLength - 1;
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
    // Apply gift card benefits: reduce effective counts for calculation
    const effectiveTravelers =
      giftCardRedeemed && travelers > 0
        ? Math.max(0, travelers - (giftCardBenefits?.freeTraveler || 0))
        : travelers;
    const effectiveInsuranceCountForCalc =
      giftCardRedeemed && insuranceCount > 0
        ? Math.max(0, insuranceCount - (giftCardBenefits?.freeInsurance || 0))
        : insuranceCount;

    // Base discounted prices (not original prices) - using effective counts
    const baseDiscountedVisaFees =
      currentVisaFeePerTraveler * effectiveTravelers;
    const baseDiscountedInsuranceFees =
      recommendedItems.insuranceCertificate &&
      effectiveInsuranceCountForCalc > 0
        ? perDayInsurancePrice *
          effectiveInsuranceDays *
          effectiveInsuranceCountForCalc
        : 0;
    const baseDiscountedGiftCardFees = recommendedItems.giftCard
      ? 159 * giftCardCount
      : 0;

    // Check if any component qualifies for quantity discount (3+)
    // Use original counts for qualification checks, not effective counts
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
      if (travelersQualify && finalVisaPrice === baseDiscountedVisaFees) {
        const quantityDiscount = (finalVisaPrice * 20) / 100;
        finalVisaPrice = finalVisaPrice - quantityDiscount;
      }
      if (
        insuranceQualify &&
        recommendedItems.insuranceCertificate &&
        finalInsurancePrice === baseDiscountedInsuranceFees
      ) {
        const quantityDiscount = (finalInsurancePrice * 20) / 100;
        finalInsurancePrice = finalInsurancePrice - quantityDiscount;
      }
      if (
        giftCardQualify &&
        recommendedItems.giftCard &&
        finalGiftCardPrice === baseDiscountedGiftCardFees
      ) {
        const quantityDiscount = (finalGiftCardPrice * 20) / 100;
        finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
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
    appliedDiscount,
    giftCardRedeemed,
    giftCardBenefits,
    perDayInsurancePrice,
    effectiveInsuranceDays,
  ]);

  const calculateDiscountedVisaFee = useCallback(
    ({ discount = appliedDiscount, hasOnlyInsurance = false } = {}) => {
      const occasionBasePerTraveler = Number(
        activeOccasionPricing?.currentPrice,
      );
      const isOccasionVisaPricingActive =
        Number.isFinite(occasionBasePerTraveler) && occasionBasePerTraveler > 0;
      const visaFeePerTraveler = isOccasionVisaPricingActive
        ? occasionBasePerTraveler
        : currentVisaFeePerTraveler;

      const baseDiscountedVisaFees = hasOnlyInsurance
        ? 0
        : visaFeePerTraveler * travelers;

      // Occasion pricing is already a promotional visa price tier.
      // Skip extra 3+ traveler/group visa discount to avoid double discounting.
      const travelersQualify = !hasOnlyInsurance && travelers >= 3;
      const hasStudentDiscount = discount?.code === "STUDENT10";
      const hasGroupDiscount = discount?.code === "GROUP20";

      let finalVisaFees = baseDiscountedVisaFees;
      const appliedDiscounts = [];
      if (travelersQualify) {
        const quantityDiscount = (finalVisaFees * 20) / 100;
        finalVisaFees = finalVisaFees - quantityDiscount;
        appliedDiscounts.push({
          type: "quantity",
          percentage: 20,
          amount: quantityDiscount,
        });
      }

      if (
        hasGroupDiscount &&
        travelersQualify &&
        finalVisaFees === baseDiscountedVisaFees
      ) {
        const quantityDiscount = (finalVisaFees * 20) / 100;
        finalVisaFees = finalVisaFees - quantityDiscount;
        appliedDiscounts.push({
          type: "group",
          percentage: 20,
          amount: quantityDiscount,
        });
      }

      if (hasStudentDiscount) {
        const studentDiscount = (finalVisaFees * 10) / 100;
        finalVisaFees = finalVisaFees - studentDiscount;
        appliedDiscounts.push({
          type: "student",
          percentage: 10,
          amount: studentDiscount,
        });
      }

      const roundedVisaFees = Number(finalVisaFees.toFixed(2));

      return roundedVisaFees;
    },
    [
      appliedDiscount,
      activeOccasionPricing?.currentPrice,
      currentVisaFeePerTraveler,
      travelers,
    ],
  );

  useEffect(() => {
    const nextVisaFees = calculateStoredVisaFee();

    if (!Number.isFinite(nextVisaFees)) {
      return;
    }

    if (visaState.visaFees !== nextVisaFees) {
      dispatch(setVisaFees(nextVisaFees));
    }
  }, [appliedDiscount, calculateStoredVisaFee, dispatch, visaState.visaFees]);

  // Memoize calculateVisaAndInsurancePrice
  const visaAndInsurancePrice = useMemo(() => {
    // Apply gift card benefits: reduce effective counts for calculation
    const effectiveTravelers =
      giftCardRedeemed && travelers > 0
        ? Math.max(0, travelers - (giftCardBenefits?.freeTraveler || 0))
        : travelers;
    const effectiveInsuranceCountForCalc =
      giftCardRedeemed && insuranceCount > 0
        ? Math.max(0, insuranceCount - (giftCardBenefits?.freeInsurance || 0))
        : insuranceCount;

    // Calculate only visa + insurance (excluding gift cards) for main price display
    const baseDiscountedVisaFees =
      currentVisaFeePerTraveler * effectiveTravelers;
    const baseDiscountedInsuranceFees =
      recommendedItems.insuranceCertificate &&
      effectiveInsuranceCountForCalc > 0
        ? perDayInsurancePrice *
          effectiveInsuranceDays *
          effectiveInsuranceCountForCalc
        : 0;

    // Check if any component qualifies for quantity discount (3+)
    // Use original counts for qualification checks, not effective counts
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const travelersQualify = travelers >= 3;
    const insuranceQualify = effectiveInsuranceCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount =
      appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount =
      appliedDiscount && appliedDiscount.code === "GROUP20";

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
      if (travelersQualify && finalVisaPrice === baseDiscountedVisaFees) {
        const quantityDiscount = (finalVisaPrice * 20) / 100;
        finalVisaPrice = finalVisaPrice - quantityDiscount;
      }
      if (
        insuranceQualify &&
        recommendedItems.insuranceCertificate &&
        finalInsurancePrice === baseDiscountedInsuranceFees
      ) {
        const quantityDiscount = (finalInsurancePrice * 20) / 100;
        finalInsurancePrice = finalInsurancePrice - quantityDiscount;
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
    giftCardCount,
    giftCardRedeemed,
    giftCardBenefits,
    perDayInsurancePrice,
    effectiveInsuranceDays,
  ]);

  // Memoize visa-only price (without insurance) for traveller card display
  const visaOnlyPrice = useMemo(() => {
    // Apply gift card benefits: reduce effective count for calculation
    const effectiveTravelers =
      giftCardRedeemed && travelers > 0
        ? Math.max(0, travelers - (giftCardBenefits?.freeTraveler || 0))
        : travelers;

    const baseDiscountedVisaFees =
      currentVisaFeePerTraveler * effectiveTravelers;

    // Check if travelers qualify for quantity discount (3+)
    // Use original count for qualification checks
    const travelersQualify = travelers >= 3;

    // Check if student discount applies
    const hasStudentDiscount =
      appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount =
      appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaPrice = baseDiscountedVisaFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (travelersQualify) {
      const quantityDiscount = (finalVisaPrice * 20) / 100;
      finalVisaPrice = finalVisaPrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (travelersQualify && finalVisaPrice === baseDiscountedVisaFees) {
        const quantityDiscount = (finalVisaPrice * 20) / 100;
        finalVisaPrice = finalVisaPrice - quantityDiscount;
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
    giftCardCount,
    giftCardRedeemed,
    giftCardBenefits,
  ]);

  // Memoize calculateDiscountedInsurancePrice
  const discountedInsurancePrice = useMemo(() => {
    // Apply gift card benefits: reduce effective count for calculation
    const effectiveInsuranceCountForCalc =
      giftCardRedeemed && insuranceCount > 0
        ? Math.max(0, insuranceCount - (giftCardBenefits?.freeInsurance || 0))
        : insuranceCount;

    // Use same logic as calculateFinalPrice for insurance
    const baseDiscountedInsuranceFees =
      recommendedItems.insuranceCertificate &&
      effectiveInsuranceCountForCalc > 0
        ? perDayInsurancePrice *
          effectiveInsuranceDays *
          effectiveInsuranceCountForCalc
        : 0;

    // Check if insurance qualifies for quantity discount (3+)
    // Use original count for qualification checks
    const effectiveInsuranceCount = Math.min(insuranceCount, travelers);
    const insuranceQualify = effectiveInsuranceCount >= 3;

    // Check if student discount applies
    const hasStudentDiscount =
      appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount =
      appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalInsurancePrice = baseDiscountedInsuranceFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (insuranceQualify) {
      const quantityDiscount = (finalInsurancePrice * 20) / 100;
      finalInsurancePrice = finalInsurancePrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (
        insuranceQualify &&
        finalInsurancePrice === baseDiscountedInsuranceFees
      ) {
        const quantityDiscount = (finalInsurancePrice * 20) / 100;
        finalInsurancePrice = finalInsurancePrice - quantityDiscount;
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
    giftCardCount,
    giftCardRedeemed,
    giftCardBenefits,
    perDayInsurancePrice,
    effectiveInsuranceDays,
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
    const hasStudentDiscount =
      appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount =
      appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalGiftCardPrice = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (giftCardQualify) {
      const quantityDiscount = (finalGiftCardPrice * 20) / 100;
      finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    if (hasGroupDiscount) {
      if (
        giftCardQualify &&
        finalGiftCardPrice === baseDiscountedGiftCardFees
      ) {
        const quantityDiscount = (finalGiftCardPrice * 20) / 100;
        finalGiftCardPrice = finalGiftCardPrice - quantityDiscount;
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
    insuranceCount,
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
    return baseOriginalPrice.toFixed(2);
  };

  useEffect(() => {
    if (activeOccasionPricing) {
      // Map occasion labels to price display labels based on mode
      // 2-tier mode: originalPrice (displayed as "current"), traditionalPrice (displayed as "strike")
      // 3-tier mode: earlyDiscount (current), originalPrice (strike), traditionalPrice (3rd strike)
      const discountedLabelForMode =
        activeOccasionPricing.priceMode === "two"
          ? activeOccasionPricing.originalPriceLabel // Current price label in 2-tier
          : activeOccasionPricing.earlyDiscountLabel; // Current price label in 3-tier

      const originalLabelForMode =
        activeOccasionPricing.priceMode === "two"
          ? activeOccasionPricing.traditionalPriceLabel // Strike price label in 2-tier
          : activeOccasionPricing.originalPriceLabel; // Strike price label in 3-tier

      dispatch(
        setVisaPriceDisplay({
          isOccasion: true,
          originalPerTraveler: Number(
            activeOccasionPricing.comparisonPrice || 0,
          ),
          traditionalPerTraveler: Number(activeOccasionPricing.thirdPrice || 0),
          // Use occasion labels, fallback to slider content only if empty
          discountedLabel:
            discountedLabelForMode || sliderContent?.slider_save || "",
          originalLabel:
            originalLabelForMode ||
            sliderContent?.slider_traditional ||
            "Traditional fee",
          traditionalLabel:
            activeOccasionPricing.traditionalPriceLabel ||
            sliderContent?.third_price_message ||
            occasionTraditionalText ||
            sliderContent?.slider_traditional ||
            "Traditional",
        }),
      );
      return;
    }

    dispatch(
      setVisaPriceDisplay({
        isOccasion: false,
        originalPerTraveler: Number(strikeOutPrice || 0),
        traditionalPerTraveler: 0,
        discountedLabel: sliderContent?.slider_save || "",
        originalLabel: sliderContent?.slider_traditional || "Traditional",
        traditionalLabel: "",
      }),
    );
  }, [
    dispatch,
    activeOccasionPricing,
    strikeOutPrice,
    sliderContent,
    occasionTraditionalText,
  ]);

  // Apply coupon immediately (no verification at apply time)
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
        // First validate the gift card code
        const validateResponse = await validateGiftCardCode(codeUpper);

        if (
          validateResponse.status === "ERROR" ||
          !validateResponse.data?.results?.valid
        ) {
          setCouponError(validateResponse.message || "Invalid gift card code");
          setIsRedeemingGiftCard(false);
          return;
        }

        // If valid, redeem it
        const redeemResponse = await redeemGiftCardCode(
          codeUpper,
          userEmail || undefined,
        );

        // Handle different response structures
        const isSuccess =
          redeemResponse.status === "SUCCESS" ||
          redeemResponse.status === "success";
        const hasSuccessData =
          redeemResponse.data?.success || redeemResponse.data?.results?.success;

        if (isSuccess && hasSuccessData) {
          // Store gift card benefits in Redux - add to array of redeemed cards
          // Benefits are now based on quantity from backend (e.g., 2 gift cards = 2 free travelers + 2 free insurance)
          const benefits = redeemResponse.data?.benefits ||
            redeemResponse.data?.results?.benefits || {
              freeTraveler: 1,
              freeInsurance: 1,
            };
          const quantity =
            redeemResponse.data?.giftCard?.quantity ||
            redeemResponse.data?.results?.giftCard?.quantity ||
            1;

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
              benefits,
              quantity,
            }),
          );
          setCouponCodeLocal(""); // Clear input after successful redemption
          setCouponError(""); // Clear any error

          // Dynamic success message based on actual benefits
          const freeTravelerCount = benefits.freeTraveler || 1;
          const freeInsuranceCount = benefits.freeInsurance || 1;
          const travelerText =
            freeTravelerCount === 1 ? "traveller" : "travellers";
          const insuranceText =
            freeInsuranceCount === 1 ? "insurance" : "insurances";
          showSuccess(
            `Gift card ${codeUpper} applied! You get ${freeTravelerCount} free ${travelerText} and ${freeInsuranceCount} free ${insuranceText}.`,
          );
        } else {
          setCouponError(
            redeemResponse.message || "Failed to redeem gift card",
          );
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
      travelers < discount.requiresMinTravellers &&
      codeUpper === "GROUP20"
    ) {
      setCouponError(
        `This coupon requires at least ${discount.requiresMinTravellers} travellers`,
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
      code: codeUpper,
      discountAmount: Math.round(calculatedDiscountAmount),
    };

    if (codeUpper === "STUDENT10") {
      dispatch(setAppliedDiscount(discountWithAmount));
      setAppliedInsuranceDiscount({ ...discountWithAmount, code: "STUDENT10" });
      setInsuranceCouponCode("STUDENT10");
    } else {
      dispatch(setAppliedDiscount(discountWithAmount));
    }

    const updatedVisaFees = calculateStoredVisaFee();

    dispatch(setVisaFees(updatedVisaFees));

    setCouponError("");
    if (codeUpper === "GROUP20") {
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
        "Select insurance and travel dates before applying this code",
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
        `This coupon requires at least ${discount.requiresMinInsurances} insurances`,
      );
      return;
    }

    const originalInsurance = computedInsuranceTotal;
    const discountAmount = Math.round(
      (originalInsurance * discount.percentage) / 100,
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
    dispatch(clearRedeemedGiftCards());
    // email verification reset not required
  };

  const removeGiftCard = (code) => {
    dispatch(removeRedeemedGiftCard(code));
    showSuccess(`Gift card ${code} removed.`);
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
    const crossedThreshold =
      (prevInsurance < 3 && currentInsurance >= 3) ||
      (prevInsurance >= 3 && currentInsurance < 3);

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
      (field) => !requiredDocuments[field],
    );

    // Check if only insurance is selected (insurance-only checkout)
    const hasOnlyInsurance =
      recommendedItems.insuranceCertificate &&
      !recommendedItems.giftCard &&
      missingDocs.length === requiredFields.length;

    const hasOnlyInsuranceNoTravelers =
      hasOnlyInsurance && Number(travelers) < 1;

    if (missingDocs.length > 0 && !hasOnlyInsuranceNoTravelers) {
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
          "Please enter a valid student email before proceeding to checkout",
        );
        return;
      }

      const verificationSent = await sendStudentVerification(
        userEmail,
        "/get-the-visa",
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

    // Use shared helper so checkout dispatch respects occasion pricing tiers too
    const visaFees = calculateDiscountedVisaFee({
      discount: appliedDiscount,
      hasOnlyInsurance,
    });

    // Base discounted prices (not original prices)
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
    const hasStudentDiscount =
      appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount =
      appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let insuranceFees = baseDiscountedInsuranceFees;
    let giftCardFees = baseDiscountedGiftCardFees;

    // Apply 20% quantity discount first (if 3+ items)
    if (insuranceQualify && recommendedItems.insuranceCertificate) {
      const quantityDiscount = (insuranceFees * 20) / 100;
      insuranceFees = insuranceFees - quantityDiscount;
    }
    if (giftCardQualify && recommendedItems.giftCard) {
      const quantityDiscount = (giftCardFees * 20) / 100;
      giftCardFees = giftCardFees - quantityDiscount;
    }

    // Apply GROUP20 coupon (ensures 20% is applied if conditions met)
    // if (hasGroupDiscount) {
    //   if (travelersQualify && (insuranceQualify || giftCardQualify)) {
    //     if (
    //       insuranceQualify &&
    //       recommendedItems.insuranceCertificate &&
    //       insuranceFees === baseDiscountedInsuranceFees
    //     ) {
    //       const quantityDiscount = (insuranceFees * 20) / 100;
    //       insuranceFees = insuranceFees - quantityDiscount;
    //     }
    //     if (
    //       giftCardQualify &&
    //       recommendedItems.giftCard &&
    //       giftCardFees === baseDiscountedGiftCardFees
    //     ) {
    //       const quantityDiscount = (giftCardFees * 20) / 100;
    //       giftCardFees = giftCardFees - quantityDiscount;
    //     }
    //   }
    // }

    // ✅ FIXED
    if (hasGroupDiscount) {
      if (
        insuranceQualify &&
        recommendedItems.insuranceCertificate &&
        insuranceFees === baseDiscountedInsuranceFees
      ) {
        insuranceFees -= (insuranceFees * 20) / 100;
      }
      if (
        giftCardQualify &&
        recommendedItems.giftCard &&
        giftCardFees === baseDiscountedGiftCardFees
      ) {
        giftCardFees -= (giftCardFees * 20) / 100;
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
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
    dispatch(setVisaFees(calculateStoredVisaFee({ hasOnlyInsurance })));
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
    dispatch(setReduxInsuranceCount(insuranceCount || 0));

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
          pricing: selectedVisaType.pricing || null,
          pricingGBP: selectedVisaType.pricingGBP || null,
          purpose: Array.isArray(selectedVisaType.purpose)
            ? selectedVisaType.purpose.map((p) => String(p)).filter(Boolean)
            : [],
          country_symbol: String(selectedVisaType.country_symbol || ""),
          processing_time: String(selectedVisaType.processing_time || ""),
          validity: String(selectedVisaType.validity || ""),
          validity_period: String(selectedVisaType.validity_period || ""),
          duration_permitted: String(selectedVisaType.duration_permitted || ""),
          entries_permitted: String(selectedVisaType.entries_permitted || ""),
        }),
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
      email.toLowerCase().includes(domain),
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
              }),
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
      (field) => !requiredDocuments[field],
    );

    if (missingDocs.length === 0) {
      return true;
    }

    const hasTravelers = Number(travelers) >= 1;
    const insuranceOnlyNoTravelers =
      recommendedItems.insuranceCertificate &&
      !recommendedItems.giftCard &&
      !hasTravelers &&
      missingDocs.length === requiredFields.length;

    return insuranceOnlyNoTravelers;
  }, [requiredDocuments, recommendedItems, travelers]);

  // ////////////////////
  // ////////////////////
  // 🔥 GA4: Track Add To Cart automatically when 5 documents are selected 🔥
  const hasTrackedAddToCartRef = useRef(false);

  // Dedup refs — each event fires at most once per checkout session
  const hasTrackedBeginCheckoutRef = useRef(false);
  const hasTrackedAddPaymentInfoRef = useRef(false);

  // Clear stale user-identity keys from a previous session so no test data
  // or previous user's details can contaminate this session's GTM events.
  useEffect(() => {
    clearStaleGtmUserData();
  }, []);

  // BUG FIX (Bugs 3 & 4): Reset all GA4 funnel dedup refs whenever cart content
  // changes.  Without this, adding items or changing quantity after the first
  // Apple Pay / Google Pay click left hasTrackedBeginCheckoutRef and
  // hasTrackedAddPaymentInfoRef as `true`, so subsequent clicks never fired
  // begin_checkout or add_payment_info — and the success-page purchase event
  // would reference the old cart.  Resetting on every cart-key change ensures
  // the next click always fires fresh, correctly-valued events.
  const prevCartKeyRef = useRef(null);
  useEffect(() => {
    const cartKey = [
      travelers,
      insuranceCount,
      giftCardCount,
      recommendedItems.insuranceCertificate ? "1" : "0",
      recommendedItems.giftCard ? "1" : "0",
      appliedDiscount?.code || "",
    ].join("-");

    if (prevCartKeyRef.current !== null && prevCartKeyRef.current !== cartKey) {
      // Cart content changed — reset dedup refs so the next express-payment
      // click fires begin_checkout + add_payment_info with the updated cart.
      hasTrackedBeginCheckoutRef.current = false;
      hasTrackedAddPaymentInfoRef.current = false;
      hasTrackedAddToCartRef.current = false;
    }
    prevCartKeyRef.current = cartKey;
  }, [travelers, insuranceCount, giftCardCount, recommendedItems, appliedDiscount]);

  useEffect(() => {
    const requiredFields = [
      "passport",
      "ukVisa",
      "photos",
      "bankStatements",
      "employmentProof",
    ];

    const selectedDocsCount = requiredFields.filter(
      (field) => requiredDocuments[field],
    ).length;

    // BUG FIX: Only fire a standalone add_to_cart for non-visa items (insurance /
    // gift card) when travelers = 0.  When travelers > 0 these items are included
    // in the main cart event that fires after all 5 required documents are ticked,
    // so firing early creates a duplicate / incorrect separate event.
    const hasOnlyInsurance =
      recommendedItems.insuranceCertificate &&
      !recommendedItems.giftCard &&
      selectedDocsCount === 0 &&
      Number(travelers) === 0;

    // Mirrors the insurance fix: gift-card-only (no visa, no insurance) with
    // zero travelers also triggers a standalone add_to_cart.
    const hasOnlyGiftCard =
      recommendedItems.giftCard &&
      giftCardCount > 0 &&
      !recommendedItems.insuranceCertificate &&
      selectedDocsCount === 0 &&
      Number(travelers) === 0;

    // Combined: any non-visa-only state that should trigger a standalone event.
    const hasOnlyNonVisa = hasOnlyInsurance || hasOnlyGiftCard ||
      (recommendedItems.insuranceCertificate &&
        recommendedItems.giftCard &&
        giftCardCount > 0 &&
        selectedDocsCount === 0 &&
        Number(travelers) === 0);

    // ✅ FIX: bail out if memoized prices haven't resolved yet (SSR/hydration safety)
    if (
      visaOnlyPrice === undefined ||
      discountedInsurancePrice === undefined ||
      discountedGiftCardPrice === undefined
    ) {
      return;
    }

    if (
      (selectedDocsCount >= 5 || hasOnlyNonVisa) &&
      !hasTrackedAddToCartRef.current
    ) {
      hasTrackedAddToCartRef.current = true;

      const countryName = getCountryParam(selectedCountry) || "Germany";

      if (typeof window !== "undefined" && window.dataLayer) {
        const baseCode = appliedDiscount?.code || undefined;
        const effectiveInsCount =
          travelers > 0 ? Math.min(insuranceCount, travelers) : insuranceCount;

        const cartItems = [];

        if (!hasOnlyNonVisa && travelers > 0) {
          const vItem = {
            item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
            item_name: `Visa - ${countryName}`,
            item_category: "Schengen Visa",
            item_brand: "NUvisa",
            price: Number((visaOnlyPrice / travelers).toFixed(2)),
            quantity: travelers,
          };
          const vCoupon = resolveCoupon(travelers >= 3, baseCode);
          if (vCoupon) vItem.coupon = vCoupon;
          cartItems.push(vItem);
        }

        if (recommendedItems.insuranceCertificate && insuranceCount > 0) {
          const iItem = {
            item_id: "insurance_certificate",
            item_name: "Insurance Certificate",
            item_category: "Insurance",
            item_brand: "NUvisa",
            price: Number(
              (discountedInsurancePrice / insuranceCount).toFixed(2),
            ),
            quantity: insuranceCount,
          };
          const iCoupon = resolveCoupon(effectiveInsCount >= 3, baseCode);
          if (iCoupon) iItem.coupon = iCoupon;
          cartItems.push(iItem);
        }

        if (recommendedItems.giftCard && giftCardCount > 0) {
          const gItem = {
            item_id: "digital_gift_card",
            item_name: GIFT_CARD_PRODUCT_NAME,
            item_category: "Gift Card",
            item_brand: "NUvisa",
            price: Number((discountedGiftCardPrice / giftCardCount).toFixed(2)),
            quantity: giftCardCount,
          };
          const gCoupon = resolveCoupon(giftCardCount >= 3, baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined));
          if (gCoupon) gItem.coupon = gCoupon;
          cartItems.push(gItem);
        }

        const finalCartValue =
          (!hasOnlyNonVisa ? visaOnlyPrice : 0) +
          (recommendedItems.insuranceCertificate
            ? discountedInsurancePrice
            : 0) +
          (recommendedItems.giftCard ? discountedGiftCardPrice : 0);

        const anyCartQualifies =
          travelers >= 3 || effectiveInsCount >= 3 || giftCardCount >= 3;
        const cartRootCoupon = resolveCoupon(
          anyCartQualifies,
          baseCode || (giftCardCount >= 3 ? "GROUP20" : undefined),
        );

        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event: "add_to_cart",
          ecommerce: {
            currency: "GBP",
            value: Number(finalCartValue.toFixed(2)),
            coupon: cartRootCoupon,
            items: cartItems,
          },
        });
      }
    }

    if (selectedDocsCount < 5 && !hasOnlyNonVisa) {
      hasTrackedAddToCartRef.current = false;
    }
  }, [
    requiredDocuments,
    selectedCountry,
    travelers,
    insuranceCount,
    giftCardCount,
    appliedDiscount,
    recommendedItems,
    visaOnlyPrice,
    discountedInsurancePrice,
    discountedGiftCardPrice,
  ]);

  // Validation function to check before payment (called when user clicks Apple Pay/Google Pay)
  const validateBeforeExpressPayment = useCallback(() => {
    if (!isDocumentsValid) {
      dispatch(triggerDocumentValidation());
      const message =
        "Please confirm all required documents before proceeding with payment.";
      showError(message);
      return message;
    }
    if (
      appliedDiscount &&
      appliedDiscount.description &&
      appliedDiscount.description.toLowerCase().includes("student") &&
      !studentVerified
    ) {
      if (!userEmail || !validateEmail(userEmail)) {
        const message =
          "Please enter a valid student email before proceeding to checkout";
        showError(message);
        return message;
      }
      const message =
        "Please verify your student email before proceeding with payment.";
      showError(message);
      return message;
    }
    return null;
  }, [
    isDocumentsValid,
    appliedDiscount,
    studentVerified,
    userEmail,
    dispatch,
    showError,
  ]);

  // Calculate total amount for express payments (Apple Pay/Google Pay) - memoized to prevent infinite loops
  // Uses the same logic as calculateFinalPrice() to match OrderCheckout.jsx
  const expressPaymentData = useMemo(() => {
    const visaDisplay = visaState?.visaPriceDisplay || {};
    const comparisonPerTraveler = Number(visaDisplay.originalPerTraveler || 0);
    const traditionalPerTraveler = Number(
      visaDisplay.traditionalPerTraveler || 0,
    );

    const effectiveTravelers =
      giftCardRedeemed && travelers > 0
        ? Math.max(0, travelers - (giftCardBenefits?.freeTraveler || 0))
        : travelers;

    // SUBTOTAL: Original prices (no discounts applied) - matching OrderCheckout
    const originalVisaPerTraveler =
      traditionalPerTraveler > 0
        ? traditionalPerTraveler
        : comparisonPerTraveler > 0
          ? comparisonPerTraveler
          : strikeOutPrice;
    const originalVisaFees = originalVisaPerTraveler * travelers;
    const originalInsuranceFees = originalInsuranceBase; // Dynamic per-day pricing
    const originalGiftCardFees = recommendedItems.giftCard
      ? 245 * giftCardCount
      : 0; // £245 per gift card
    const subtotalGBP =
      originalVisaFees + originalInsuranceFees + originalGiftCardFees;

    // Base discounted prices (matching OrderCheckout.jsx and calculateFinalPrice)
    const baseDiscountedVisaFees =
      calculateDiscountedVisaFee({ discount: null }) *
      (travelers > 0 ? effectiveTravelers / travelers : 1);
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
    const hasStudentDiscount =
      appliedDiscount && appliedDiscount.code === "STUDENT10";
    const hasGroupDiscount =
      appliedDiscount && appliedDiscount.code === "GROUP20";

    // Calculate discounts sequentially (compound): First 20% quantity discount, then 10% student discount on discounted price
    let finalVisaFees = calculateDiscountedVisaFee({
      discount: appliedDiscount,
    });
    let finalInsuranceFees = baseDiscountedInsuranceFees;
    let finalGiftCardFees = baseDiscountedGiftCardFees;

    // Visa discount logic is already applied by calculateDiscountedVisaFee().
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
      if (
        insuranceQualify &&
        recommendedItems.insuranceCertificate &&
        finalInsuranceFees === baseDiscountedInsuranceFees
      ) {
        const quantityDiscount = (finalInsuranceFees * 20) / 100;
        finalInsuranceFees = finalInsuranceFees - quantityDiscount;
      }
      if (
        giftCardQualify &&
        recommendedItems.giftCard &&
        finalGiftCardFees === baseDiscountedGiftCardFees
      ) {
        const quantityDiscount = (finalGiftCardFees * 20) / 100;
        finalGiftCardFees = finalGiftCardFees - quantityDiscount;
      }
    }

    // Apply 10% student discount on already-discounted price (if student)
    if (hasStudentDiscount) {
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
      // Original (pre-discount) per-item totals — used for GA4 discount field
      originalVisaFees: originalVisaFees,
      originalInsuranceFees: originalInsuranceFees,
      originalGiftCardFees: originalGiftCardFees,
    };
  }, [
    visaState?.visaPriceDisplay,
    recommendedItems,
    selectedVisaType,
    travelers,
    appliedDiscount,
    insuranceCount,
    giftCardCount,
    currentVisaFeePerTraveler,
    discountedInsuranceBase,
    originalInsuranceBase,
    strikeOutPrice,
    couponCode,
    calculateDiscountedVisaFee,
    giftCardRedeemed,
    giftCardBenefits,
  ]);

  // GA4 begin_checkout is fired exclusively inside the Apple Pay and Google Pay
  // button click handlers below — not automatically on page load.

  const discountedVisaDisplayTotal = useMemo(() => {
    const next = calculateDiscountedVisaFee({ discount: appliedDiscount });
    return Number.isFinite(next) ? next : 0;
  }, [calculateDiscountedVisaFee, appliedDiscount]);

  const occasionDisplayedSaveAmount = useMemo(() => {
    if (!activeOccasionPricing) return 0;

    const referencePerTraveler =
      activeOccasionPricing.priceMode === "two"
        ? Number(activeOccasionPricing.comparisonPrice || 0)
        : Number(
            activeOccasionPricing.thirdPrice ||
              activeOccasionPricing.comparisonPrice ||
              0,
          );

    const referenceTotal = referencePerTraveler * Number(travelers || 0);
    return Math.max(0, referenceTotal - discountedVisaDisplayTotal);
  }, [activeOccasionPricing, travelers, discountedVisaDisplayTotal]);

  const selectedVisaTypeDetails = useMemo(() => {
    const candidates = [selectedVisaType, visaState.selectedVisaType].filter(
      Boolean,
    );
    return (
      candidates.find((visaType) => visaType?.pricing) || candidates[0] || null
    );
  }, [selectedVisaType, visaState.selectedVisaType]);

  const pricingDetails = selectedVisaTypeDetails?.pricing || null;
  const canShowVisaFeeBreakdown = Boolean(
    selectedVisaTypeDetails?.id && pricingDetails,
  );
  const computedPriceSummary = useMemo(() => {
    const originalTotal = Number(calculateOriginalPrice() || 0);
    const visaOnlyTotal = Number(visaOnlyPrice || 0);
    const currentTotal = Number(finalPrice || 0);
    const safeTravelers = Number(travelers || 0);
    const hasOccasionPricing = Boolean(visaState?.visaPriceDisplay?.isOccasion);
    const occasionOriginalPerTraveler = Number(
      visaState?.visaPriceDisplay?.originalPerTraveler || 0,
    );
    const occasionTraditionalPerTraveler = Number(
      visaState?.visaPriceDisplay?.traditionalPerTraveler || 0,
    );
    const discountedLabel = String(
      visaState?.visaPriceDisplay?.discountedLabel || "",
    );
    const originalLabel = String(
      visaState?.visaPriceDisplay?.originalLabel || "",
    );
    const traditionalLabel = String(
      visaState?.visaPriceDisplay?.traditionalLabel || "",
    );

    // Match checkout logic: in occasion mode use traditional strike when available, else original strike.
    const strikePerTraveler = hasOccasionPricing
      ? occasionTraditionalPerTraveler > 0
        ? occasionTraditionalPerTraveler
        : occasionOriginalPerTraveler
      : safeTravelers > 0
        ? originalTotal / safeTravelers
        : originalTotal;

    const comparisonPerTraveler = hasOccasionPricing
      ? occasionOriginalPerTraveler
      : strikePerTraveler;
    const traditionalPerTraveler = hasOccasionPricing
      ? occasionTraditionalPerTraveler
      : 0;

    const travelersOriginalTotal = strikePerTraveler * safeTravelers;
    const travelersCurrentTotal = visaOnlyTotal;
    const travelersComparisonTotal = comparisonPerTraveler * safeTravelers;
    const travelersTraditionalTotal = traditionalPerTraveler * safeTravelers;

    const perTravelerCurrent =
      safeTravelers > 0 ? visaOnlyTotal / safeTravelers : visaOnlyTotal;
    const perTravelerOriginal = strikePerTraveler;
    const perTravelerComparison = comparisonPerTraveler;
    const perTravelerTraditional = traditionalPerTraveler;
    const expertOriginalValue = isExpertSelected
      ? expertPricePerMonth * expertAccessMonths
      : 0;
    const insuranceOriginal = Number(originalInsuranceBase || 0);
    const insuranceCurrent = Number(discountedInsurancePrice || 0);
    const giftCardOriginal = Number(245 * giftCardCount || 0);
    const giftCardCurrent = Number(discountedGiftCardPrice || 0);
    const discountCode = String(
      appliedDiscount?.code || couponCode || "",
    ).trim();

    return {
      currency: "GBP",
      travelers: safeTravelers,
      visaOnlyTotal,
      currentTotal,
      originalTotal,
      travelersCurrentTotal,
      travelersOriginalTotal,
      travelersComparisonTotal,
      travelersTraditionalTotal,
      includedValue: Math.max(0, originalTotal - visaOnlyTotal),
      perTravelerCurrent,
      perTravelerOriginal,
      perTravelerComparison,
      perTravelerTraditional,
      visaPriceDisplay: {
        isOccasion: hasOccasionPricing,
        discountedLabel,
        originalLabel,
        traditionalLabel,
      },
      recommended: {
        insurance: {
          selected: Boolean(recommendedItems.insuranceCertificate),
          count: Number(insuranceCount || 0),
          days: Number(effectiveInsuranceDays || 0),
          current: insuranceCurrent,
          original: insuranceOriginal,
        },
        giftCard: {
          selected: Boolean(recommendedItems.giftCard),
          count: Number(giftCardCount || 0),
          current: giftCardCurrent,
          original: giftCardOriginal,
        },
      },
      expert: {
        selected: Boolean(isExpertSelected),
        current: 0,
        original: expertOriginalValue,
        monthly: expertPricePerMonth,
        months: expertAccessMonths,
      },
      discount: {
        applied: Boolean(appliedDiscount || discountCode),
        code: discountCode,
        description: String(appliedDiscount?.description || ""),
        percentage: Number(appliedDiscount?.percentage || 0),
      },
      embassy: {
        total: embassyFeeTotalGBP,
        perTravelerApplied: embassyFeePerTravelerGBP,
        reference: [
          { amount: EMBASSY_FEE_GBP.age12Plus, label: "12+ yrs" },
          { amount: EMBASSY_FEE_GBP.age6To11, label: "6 - 11 yrs" },
          { amount: EMBASSY_FEE_GBP.age0To5, label: "0 - 5 yrs" },
        ],
      },
    };
  }, [
    visaOnlyPrice,
    finalPrice,
    travelers,
    originalInsuranceBase,
    discountedInsurancePrice,
    discountedGiftCardPrice,
    giftCardCount,
    recommendedItems,
    insuranceCount,
    effectiveInsuranceDays,
    isExpertSelected,
    appliedDiscount,
    couponCode,
    embassyFeeTotalGBP,
    embassyFeePerTravelerGBP,
    baseFee,
    strikeOutPrice,
    selectedVisaType,
    visaState?.visaPriceDisplay?.isOccasion,
    visaState?.visaPriceDisplay?.discountedLabel,
    visaState?.visaPriceDisplay?.originalLabel,
    visaState?.visaPriceDisplay?.traditionalLabel,
    visaState?.visaPriceDisplay?.originalPerTraveler,
    visaState?.visaPriceDisplay?.traditionalPerTraveler,
  ]);

  const travelerPricingBreakdown = useMemo(() => {
    const safeTravelers = Number(travelers || 0);

    if (activeOccasionPricing) {
      const currentTotal = Number(discountedVisaDisplayTotal || 0);
      const comparisonTotal =
        Number(activeOccasionPricing.comparisonPrice || 0) * safeTravelers;
      const traditionalTotal =
        Number(activeOccasionPricing.thirdPrice || 0) * safeTravelers;
      const hasThreeTier =
        activeOccasionPricing.priceMode === "three" &&
        traditionalTotal > 0 &&
        comparisonTotal > currentTotal;

      return {
        currentTotal,
        strikeTotal: hasThreeTier ? traditionalTotal : comparisonTotal,
        comparisonTotal,
        traditionalTotal,
        hasOccasion: true,
        hasThreeTier,
      };
    }

    return {
      currentTotal: Number(visaOnlyPrice || 0),
      strikeTotal: Number(calculateOriginalPrice() || 0),
      comparisonTotal: 0,
      traditionalTotal: 0,
      hasOccasion: false,
      hasThreeTier: false,
    };
  }, [
    activeOccasionPricing,
    travelers,
    visaOnlyPrice,
    selectedVisaType,
    strikeOutPrice,
    baseFee,
    discountedVisaDisplayTotal,
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
  }, [
    expressPaymentData.totalAmount,
    travelers,
    expressPaymentData.includeInsurance,
  ]);

  // Smoothly navigating to Required Documents section

  useEffect(() => {
    const handleScrollAndHighlight = () => {
      if (
        window.location.hash === "#required-documents" &&
        requiredDocumentRef.current
      ) {
        setTimeout(() => {
          setIsHighlighted(true);
          setDocumentsAccordionOpen(true);

          setTimeout(() => {
            setIsHighlighted(false);
          }, 3000);
        }, 800);
      }
    };

    handleScrollAndHighlight();

    router.events.on("routeChangeComplete", handleScrollAndHighlight);

    return () => {
      router.events.off("routeChangeComplete", handleScrollAndHighlight);
    };
  }, [router]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#required-documents") {
        setDocumentsAccordionOpen(true);

        setTimeout(() => {
          const element = document.getElementById("required-documents");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    };

    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Smoothly navigating to Main section

  useEffect(() => {
    const handleScrollAndHighlight = () => {
      if (window.location.hash === "#add-to-cart" && mainSectionRef.current) {
        setTimeout(() => {
          setIsHighlighted(true);

          setTimeout(() => {
            setIsHighlighted(false);
          }, 3000);
        }, 800);
      }
    };

    handleScrollAndHighlight();

    router.events.on("routeChangeComplete", handleScrollAndHighlight);

    return () => {
      router.events.off("routeChangeComplete", handleScrollAndHighlight);
    };
  }, [router]);
  // console.log("active ocassions", allOccasions);
  return (
    <div className="w-full max-w-[88rem] mx-auto grid grid-cols-1 lg:grid-cols-2 items-start gap-10 md:gap-12 lg:gap-14 xl:gap-16 px-4 sm:px-6 lg:px-8 max-sm:px-3 min-w-0">
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
      <div className="w-full min-w-0 gap-3 flex flex-col items-start max-sm:gap-4 mt-0 md:mt-4 lg:sticky lg:top-24 lg:self-start xl:pr-2 2xl:pr-4">
        {/* Badges Section */}
        <section className="text-center text-white rounded-2xl p-2 w-full max-sm:p-1">
          <div className="w-full hidden md:flex flex-wrap justify-start items-center gap-2 px-3 max-sm:gap-3 max-sm:px-1">
            <button className="bg-[#24242D] border border-white px-4 py-[10px] rounded-full font-medium text-white select-none transition-colors relative overflow-hidden max-sm:w-full max-sm:px-4 max-sm:py-3">
              <span className="relative z-10 font-bold text-[22px] leading-none max-sm:text-[15px]">
                {sliderContent["badge_1_text"]}
              </span>
            </button>

            <button className="bg-[#24242D] border border-white px-4 py-[10px] rounded-full font-medium text-white select-none transition-colors relative overflow-hidden max-sm:w-full max-sm:px-4 max-sm:py-3">
              <span className="relative z-10 font-bold text-[22px] leading-none max-sm:text-[15px]">
                {sliderContent["badge_2_text"]}
              </span>
            </button>
          </div>
        </section>

        {/* Visa Information Section */}
        <section className="w-full flex flex-col items-start gap-4 sm:gap-5">
          <section className="w-full min-w-0">
            <div className="bg-[#24242D] rounded-2xl shadow-sm p-5 sm:p-6 md:p-7 overflow-hidden text-white">
              <div className="flex flex-col gap-6 sm:gap-7 lg:grid lg:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-x-8 xl:gap-x-10 lg:items-start">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-gilroy-bold leading-tight shrink-0">
                  Visa{" "}
                  <span className="whitespace-nowrap">information</span>
                </h2>

                <ul className="flex flex-col gap-0 w-full min-w-0 divide-y divide-white/15">
                  {/* Visa Types → Sticker */}
                  <li className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4 md:py-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-sm sm:text-base text-white/90">
                      <FileText className="h-5 w-5 shrink-0 text-[#24242D] stroke-[#24242D] fill-white sm:h-5 sm:w-5" />
                      <span className="break-words leading-snug">Visa Types</span>
                    </div>
                    <div
                      className="relative font-semibold text-sm sm:text-base leading-snug pl-7 sm:pl-0 sm:text-right sm:max-w-[55%] min-w-0"
                      onMouseEnter={() => setActiveTooltip("sticker")}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <span className="break-words border-b border-dashed border-white/40 pb-0.5 sm:border-0 sm:pb-0">
                        Sticker
                      </span>
                      {activeTooltip === "sticker" && (
                        <div className="absolute z-10 bottom-full right-0 sm:right-0 mb-2 w-[min(100%,16rem)] sm:w-64 bg-[#24242D] text-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="text-xs leading-relaxed">{tooltips.sticker}</p>
                          <div className="absolute -bottom-1 right-4 w-4 h-4 bg-[#24242D] transform rotate-45 border-b border-r border-gray-200" />
                        </div>
                      )}
                    </div>
                  </li>

                  {/* Stay Duration */}
                  <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4 md:py-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-sm sm:text-base text-white/90">
                      <Home className="h-5 w-5 shrink-0 text-white" />
                      <span className="break-words leading-snug">Stay Duration</span>
                    </div>
                    <div
                      className="relative font-semibold text-sm sm:text-base leading-snug pl-7 sm:pl-0 sm:text-right sm:max-w-[55%] min-w-0"
                      onMouseEnter={() => setActiveTooltip("duration")}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <span className="break-words border-b border-dashed border-white/40 pb-0.5 sm:border-0 sm:pb-0">
                        Upto 90 Days
                      </span>
                      {activeTooltip === "duration" && (
                        <div className="absolute z-10 bottom-full right-0 mb-2 w-[min(100%,16rem)] sm:w-64 bg-[#24242D] text-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <div className="text-xs leading-relaxed space-y-1">
                            {tooltips.duration.map((line, index) => (
                              <p key={index}>{line}</p>
                            ))}
                          </div>
                          <div className="absolute -bottom-1 right-4 w-4 h-4 bg-[#24242D] transform rotate-45 border-b border-r border-gray-200" />
                        </div>
                      )}
                    </div>
                  </li>

                  {/* Term Type */}
                  <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4 md:py-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-sm sm:text-base text-white/90">
                      <ClipboardList className="h-5 w-5 shrink-0 text-[#24242D] stroke-[#24242D] fill-white" />
                      <span className="break-words leading-snug">Term Type</span>
                    </div>
                    <div
                      className="relative font-semibold text-sm sm:text-base leading-snug pl-7 sm:pl-0 sm:text-right sm:max-w-[55%] min-w-0"
                      onMouseEnter={() => setActiveTooltip("term")}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <span className="break-words border-b border-dashed border-white/40 pb-0.5 sm:border-0 sm:pb-0">
                        Short Term
                      </span>
                      {activeTooltip === "term" && (
                        <div className="absolute z-10 bottom-full right-0 mb-2 w-[min(100%,16rem)] sm:w-64 bg-[#24242D] text-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="text-xs leading-relaxed">{tooltips.term}</p>
                          <div className="absolute -bottom-1 right-4 w-4 h-4 bg-[#24242D] transform rotate-45 border-b border-r border-gray-200" />
                        </div>
                      )}
                    </div>
                  </li>

                  {/* Entry */}
                  <li className="flex flex-col gap-2 py-4 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-4 md:py-5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-sm sm:text-base text-white/90">
                      <Clock className="h-5 w-5 shrink-0 text-white" />
                      <span className="break-words leading-snug">Entry</span>
                    </div>
                    <div
                      className="relative font-semibold text-sm sm:text-base leading-snug pl-7 sm:pl-0 sm:text-right sm:max-w-[55%] min-w-0"
                      onMouseEnter={() => setActiveTooltip("entry")}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <span className="break-words border-b border-dashed border-white/40 pb-0.5 sm:border-0 sm:pb-0">
                        Multiple or Single
                      </span>
                      {activeTooltip === "entry" && (
                        <div className="absolute z-10 bottom-full right-0 mb-2 w-[min(100%,16rem)] sm:w-64 bg-[#24242D] text-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="text-xs leading-relaxed">{tooltips.entry}</p>
                          <div className="absolute -bottom-1 right-4 w-4 h-4 bg-[#24242D] transform rotate-45 border-b border-r border-gray-200" />
                        </div>
                      )}
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-6 sm:mt-7 pt-5 sm:pt-6 border-t border-white/15 text-left">
                <p className="flex gap-3 sm:gap-3.5 text-sm sm:text-base leading-relaxed min-w-0">
                  <Image
                    src="/icons/megaphone.png"
                    width={24}
                    height={20}
                    className="w-6 h-5 sm:w-6 sm:h-5 shrink-0 mt-0.5"
                    alt="Notice"
                    loading="lazy"
                  />
                  <span className="min-w-0 break-words text-white/95">
                    {sliderContent["embassy_notice_text"]}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <CountryCarousel
            carouselCountries={carouselCountries}
            activeCarouselCountry={activeCarouselCountry}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            goToPrevious={goToPrevious}
            goToNext={goToNext}
            resetTimer={resetTimer}
            thumbnailContainerRef={thumbnailContainerRef}
          />
        </section>
      </div>

      {/* Right Column */}
      <div className="w-full min-w-0 gap-4 flex flex-col items-start max-sm:gap-4 mt-0 md:mt-4 lg:pl-0 xl:pl-2">
        {/* NRI Badge Section */}
        <section className="text-center text-white rounded-2xl p-2 w-full max-sm:p-1">
          <div className="flex justify-start items-center">
            <button
              className={`bg-[#24242D] border border-white px-4 ${
                hasEuFlagBadge ? "py-2.25" : "py-1.75  pb-3.5"
              } rounded-full font-medium text-sm text-white select-none transition-colors relative overflow-hidden text-center max-sm:w-full max-sm:px-3 max-sm:py-2`}
            >
              <span
                className={`relative z-10 leading-none text-center font-bold flex justify-center items-center text-sm md:text-base lg:text-[17px] ${
                  hasEuFlagBadge ? "" : "pt-2"
                } max-sm:text-[18px]`}
              >
                {renderedNriBadgeText}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
            </button>
          </div>
        </section>

        {/* Main Content Section */}
        <section
          ref={mainSectionRef}
          id="add-to-cart"
          className="bg-[#24242D] text-white rounded-t-2xl p-4 sm:p-5 lg:p-6 xl:p-7 w-full max-sm:p-4"
        >
          <div className="w-full">
            {/* Header with pricing */}
            <div className="mb-8 max-sm:mb-6">
              <h1 className="text-3xl font-gilroy-bold max-sm:text-2xl">
                {sliderContent?.slider_header}
              </h1>
              <p className="text-xs mb-4 max-sm:text-[11px] max-sm:mb-3 leading-relaxed">
                {sliderContent?.slider_description ||
                  "Complete visa service with all necessary documents"}
              </p>
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4 max-sm:gap-3">
                {selectedCountryData.isActive !== false ? (
                  activeOccasionPricing ? (
                    <div className="flex flex-col gap-2">
                      {/* Row 1: Discounted + Original */}
                      <div className="flex flex-wrap gap-6 md:gap-8 lg:gap-12 max-sm:w-full max-sm:justify-between items-center">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl lg:text-3xl font-gilroy-bold max-sm:text-xl">
                            £{discountedVisaDisplayTotal.toFixed(2)}
                          </span>
                          {occasionDisplayedSaveAmount > 0 && (
                            <span className="text-[11px] text-gray-500 font-medium max-sm:text-[10px]">
                              {activeOccasionPricing.priceMode === "two"
                                ? activeOccasionPricing.originalPriceLabel ||
                                  sliderContent?.slider_save ||
                                  "You save "
                                : activeOccasionPricing.earlyDiscountLabel ||
                                  sliderContent?.slider_save ||
                                  "Early Bird "}
                              {Math.round(occasionDisplayedSaveAmount)}
                            </span>
                          )}
                        </div>
                        {activeOccasionPricing.comparisonPrice > 0 && (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-xl font-semibold max-sm:text-sm line-through decoration-2 decoration-neutral-400 ${
                                activeOccasionPricing.priceMode === "two"
                                  ? "text-gray-500"
                                  : "text-red-400"
                              }`}
                            >
                              £
                              {(
                                activeOccasionPricing.comparisonPrice *
                                (travelers || 1)
                              ).toFixed(2)}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium max-sm:text-[10px]">
                              {activeOccasionPricing.priceMode === "two"
                                ? activeOccasionPricing.traditionalPriceLabel ||
                                  sliderContent?.slider_traditional ||
                                  "Traditional fee"
                                : activeOccasionPricing.originalPriceLabel ||
                                  sliderContent?.slider_traditional ||
                                  "Traditional fee"}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Row 2: Traditional price below */}
                      {activeOccasionPricing.thirdPrice > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xl font-semibold max-sm:text-sm line-through decoration-2 decoration-neutral-400 text-gray-500">
                            £
                            {(
                              activeOccasionPricing.thirdPrice *
                              (travelers || 1)
                            ).toFixed(2)}
                          </span>
                          <span className="text-[12px] text-gray-500 font-medium max-sm:text-[11px]">
                            {activeOccasionPricing.traditionalPriceLabel ||
                              sliderContent?.third_price_message ||
                              occasionTraditionalText ||
                              sliderContent?.slider_traditional ||
                              "Traditional"}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default 2-tier pricing */
                    <div className="flex flex-wrap gap-6 md:gap-8 lg:gap-12 max-sm:w-full max-sm:justify-between items-center">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl lg:text-3xl font-gilroy-bold max-sm:text-xl">
                          £{visaOnlyPrice.toFixed(2)}
                        </span>
                        {Number(calculateOriginalPrice()) > visaOnlyPrice && (
                          <span className="text-[12px] text-gray-500 font-medium max-sm:text-[11px]">
                            {sliderContent?.slider_save}
                            {Math.round(
                              ((Number(calculateOriginalPrice()) -
                                visaOnlyPrice) /
                                Number(calculateOriginalPrice())) *
                                100,
                            )}
                            %
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-semibold max-sm:text-base line-through decoration-2 decoration-neutral-400 text-gray-500">
                          £{calculateOriginalPrice()}
                        </span>
                        {Number(calculateOriginalPrice()) > visaOnlyPrice && (
                          <span className="text-[12px] text-gray-500 font-medium max-sm:text-[11px]">
                            {sliderContent?.slider_traditional}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center h-[48px]">
                    <span className="text-gray-400 text-sm italic">
                      Pricing hidden for this country
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto xl:justify-end">
                <div className="flex items-center gap-2 shadow-lg shadow-black/20 p-2 rounded-full max-sm:w-full max-sm:justify-between max-sm:px-4 shrink-0">
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
                      const n = Math.max(0, Number(next) || 0);
                      // If traveler count decreases, adjust insurance count if needed
                      if (n >= 1 && insuranceCount > n) {
                        dispatch(setReduxInsuranceCount(Number(n)));
                      }
                      dispatch(setReduxTravelers(Number(n)));
                    }}
                    min={0}
                  />
                </div>

                {/* Country Selector */}
                <div className="w-full sm:w-fit min-w-0 max-sm:w-full">
                  <label htmlFor="country-select" className="sr-only">
                    Select Country
                  </label>
                  <div>
                    <select
                      id="country-select"
                      value={selectedCountry}
                      onChange={(e) => selectCountry(e.target.value)}
                      disabled={
                        isVisaPricingLoading || !dropdownCountries.length
                      }
                      className="w-full sm:w-auto max-w-full px-2 py-2 font-semibold rounded-full shadow-black/20 shadow-lg cursor-pointer focus:outline-none max-sm:text-center"
                    >
                      {isVisaPricingLoading ? (
                        <option value="" className="bg-gray-400 text-gray-800">
                          Loading countries...
                        </option>
                      ) : !dropdownCountries.length ? (
                        <option value="" className="bg-gray-400 text-gray-800">
                          Pricing unavailable
                        </option>
                      ) : (
                        dropdownCountries.map((country) => (
                          <option
                            key={country}
                            value={country}
                            className="bg-gray-400 text-gray-800"
                          >
                            {country}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {(visaPricingError || isVisaPricingEmpty) && (
                    <p className="text-[11px] mt-2 text-red-300 max-sm:text-[10px]">
                      {visaPricingError ||
                        "No visa pricing available right now."}
                    </p>
                  )}
                  {selectedCountryPricing?.reason && (
                    <div className="mt-2 flex justify-end max-sm:justify-start">
                      <div
                        ref={reasonTooltipRef}
                        className="relative border-b border-dashed border-white/40 w-fit font-semibold"
                      >
                        <button
                          type="button"
                          className="text-xs text-white/80 hover:text-white transition-colors max-sm:text-[11px]"
                          onClick={() =>
                            setActiveTooltip((prev) =>
                              prev === "priorityAppointment"
                                ? null
                                : "priorityAppointment",
                            )
                          }
                        >
                          {selectedCountryPricing?.reasonName ||
                            sliderContent["appointment_reason"] ||
                            "Priority appointment notice"}
                        </button>

                        {activeTooltip === "priorityAppointment" && (
                          <div className="absolute z-10 bottom-full right-0 mb-2 w-64 bg-[#24242D] flex items-center text-white p-3 rounded-lg shadow-lg border border-gray-200 max-sm:w-56 max-sm:left-0 max-sm:right-auto">
                            <p className="text-sm max-sm:text-xs">
                              {selectedCountryPricing?.reason}
                            </p>
                            <div className="absolute -bottom-1 right-4 w-4 h-4 bg-[#24242D] flex items-center text-white transform rotate-45 border-b border-r border-gray-200 max-sm:left-10 max-sm:right-auto"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 max-sm:mb-6">
            <div className="space-y-2.5 font-gilroy-medium !font-semibold max-sm:space-y-2">
              {/* Auto-booking */}
              <div>
                <div className="flex items-center justify-between max-sm:items-start max-sm:gap-2">
                  <div className="flex items-end space-x-3 max-sm:space-x-2">
                    <div className="w-10 aspect-square rounded-lg flex items-center justify-center max-sm:w-8 overflow-hidden">
                      <Image
                        src="/image/calendar.jpg"
                        alt="Calendar"
                        width={40}
                        height={40}
                        className="max-sm:w-6 max-sm:h-6"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col gap-0 justify-end leading-tight">
                      <h3 className="max-sm:text-sm">
                        Auto-booking appointment
                      </h3>
                      <span className="text-[12px] text-gray-500 font-medium max-sm:text-[11px]">
                        {currentAppointmentText}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-[2px] items-center max-sm:flex-shrink-0">
                    <span className="line-through max-sm:text-sm">£100</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium max-sm:ml-1 max-sm:px-2 max-sm:py-0.5 max-sm:text-xs">
                      Free
                    </span>
                  </div>
                </div>
              </div>

              {/* Concierge assistance */}
              <div className="flex items-center justify-between max-sm:items-start max-sm:gap-2">
                <div className="flex items-end space-x-3 max-sm:space-x-2">
                  <div className="w-10 aspect-square rounded-lg flex items-center justify-center max-sm:w-8 overflow-hidden">
                    <Image
                      src="/image/flights.jpg"
                      alt="Flights"
                      width={40}
                      height={40}
                      className="w-10 aspect-square max-sm:w-6 max-sm:h-6"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col gap-0 justify-end leading-tight">
                    <h3 className="max-sm:text-sm">Concierge assistance</h3>
                    <span className="text-[12px] text-gray-500 font-medium max-sm:text-[11px]">
                      Your travel itinerary | Form filing
                    </span>
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

          <div className="w-full">
            <p className="text-xs mb-1 max-sm:text-[11px] max-sm:mb-3 leading-relaxed">
              Dates are required for visa processing only and can be changed
              later within visa validity period.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start max-sm:gap-4">
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
                  const lastDayOfMonth = new Date(
                    firstValidYear,
                    firstValidMonth + 1,
                    0,
                  ).getDate();

                  // Check if valid dates are in the last few days of the month (day >= 28)
                  // This means there are only a few valid dates left in the current month
                  const validDatesAtEndOfMonth = firstValidDay >= 28;

                  // Calculate openToDate to show next month if valid dates are at end of current month
                  let openToDate = null;

                  if (validDatesAtEndOfMonth) {
                    // Show next month's calendar instead
                    openToDate = new Date(
                      firstValidYear,
                      firstValidMonth + 1,
                      1,
                    );
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
                      calendarClassName={
                        validDatesAtEndOfMonth
                          ? "show-adjacent-month-dates"
                          : ""
                      }
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
            <div
              className="mt-5"
              data-documents-section
              id="required-documents"
              ref={requiredDocumentRef}
            >
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
                    <div className="ml-2 px-2 py-1 sm:px-3 sm:py-2 bg-white/10 rounded-full text-xs font-medium text-center">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-sm:gap-2">
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
                            UK eVisa/BRP
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
                            Last 3 months showing sufficient funds £60–£100/day
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

          {/* Express Checkout Section */}
          <div className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-lg max-sm:text-base  ">
                Express checkout
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-400 ">
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

            <LazyWhenVisible minHeight="320px" rootMargin="320px 0px" className="w-full">
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
                insurancePaymentAmount={
                  expressPaymentData.insurancePaymentAmount
                }
                visaTypeId={expressPaymentData.visaTypeId}
                paymentType={
                  expressPaymentData.includeGiftCard &&
                  expressPaymentData.visaFees > 0
                    ? "application_creation,gift_card"
                    : expressPaymentData.includeGiftCard &&
                        expressPaymentData.visaFees === 0
                      ? "gift_card"
                      : "application_creation"
                }
                onBeforePayment={validateBeforeExpressPayment}
                visaFees={expressPaymentData.visaFees}
                insuranceFees={expressPaymentData.insuranceFees}
                giftCardFees={expressPaymentData.giftCardFees}
                includeGiftCard={expressPaymentData.includeGiftCard}
                giftCardCount={expressPaymentData.giftCardCount}
                hideUI={true} // Hide the Stripe button UI
                // Pass all values needed for localStorage/Redux setup (same as handleProceedToCheckout)
                subtotalGBP={expressPaymentData.subtotalGBP}
                discountedInsuranceFeesGBP={
                  expressPaymentData.discountedInsuranceFeesGBP
                }
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
                const availableCount =
                  (isApplePayAvailable ? 1 : 0) +
                  (isGooglePayAvailable ? 1 : 0);
                const gridCols =
                  availableCount === 1 ? "grid-cols-1" : "grid-cols-2";

                return (
                  <div className="w-full">
                    <div
                      className={`flex flex-col sm:flex-row items-center justify-between gap-2`}
                    >
                      {/* Apple Pay Button */}
                      {isApplePayAvailable && (
                        <button
                          onClick={() => {
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
                                getCountryParam(selectedCountry) || "Schengen";

                              // 🌟 FIXED: Use strictly verified discount
                              const baseCode =
                                appliedDiscount?.code || undefined;
                              const hasCoupon = !!baseCode;

                              // 🌟 FIXED: Safe math handling
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
                                    (
                                      expressPaymentData.visaFees / travelers
                                    ).toFixed(2),
                                  ),
                                  quantity: travelers,
                                };
                                const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                                if (vCoupon) vItem.coupon = vCoupon;
                                paymentItems.push(vItem);
                              }

                              if (
                                expressPaymentData.includeInsurance &&
                                insuranceCount > 0
                              ) {
                                const iItem = {
                                  item_id: "insurance_certificate",
                                  item_name: "Insurance Certificate",
                                  price: Number(
                                    (
                                      expressPaymentData.insuranceFees /
                                      insuranceCount
                                    ).toFixed(2),
                                  ),
                                  quantity: insuranceCount,
                                };
                                const iCoupon = resolveCoupon(
                                  effectiveInsCount >= 3,
                                  baseCode,
                                );
                                if (iCoupon) iItem.coupon = iCoupon;
                                paymentItems.push(iItem);
                              }

                              if (
                                expressPaymentData.includeGiftCard &&
                                giftCardCount > 0
                              ) {
                                const gItem = {
                                  item_id: "digital_gift_card",
                                  item_name: GIFT_CARD_PRODUCT_NAME,
                                  price: Number(
                                    (
                                      expressPaymentData.giftCardFees /
                                      giftCardCount
                                    ).toFixed(2),
                                  ),
                                  quantity: giftCardCount,
                                };
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

                              if (!hasTrackedAddPaymentInfoRef.current) {
                                hasTrackedAddPaymentInfoRef.current = true;
                                const enrichedItems = paymentItems.map(
                                  (item) => {
                                    const isInsurance =
                                      item.item_id === "insurance_certificate";
                                    const isGiftCard =
                                      item.item_id === "digital_gift_card";
                                    const lineFinalFees = isInsurance
                                      ? expressPaymentData.insuranceFees
                                      : isGiftCard
                                        ? expressPaymentData.giftCardFees
                                        : expressPaymentData.visaFees;
                                    const qty = item.quantity || 1;
                                    const discountPerUnit = isGiftCard
                                      ? computeCouponDiscountPerUnit(lineFinalFees, qty, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null))
                                      : hasCoupon
                                        ? computeCouponDiscountPerUnit(lineFinalFees, qty, appliedDiscount)
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
                                    if (discountPerUnit > 0)
                                      enriched.discount = discountPerUnit;
                                    return enriched;
                                  },
                                );

                                // GROUP20 only qualifies at root level when at least one item meets threshold
                                const anyAppleQualifies =
                                  travelers >= 3 ||
                                  effectiveInsCount >= 3 ||
                                  (expressPaymentData.includeGiftCard && giftCardCount >= 3);
                                const appleRootCoupon = resolveCoupon(
                                  anyAppleQualifies,
                                  baseCode || (expressPaymentData.includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                                );

                                // begin_checkout fires immediately on Apple Pay click
                                if (!hasTrackedBeginCheckoutRef.current) {
                                  hasTrackedBeginCheckoutRef.current = true;
                                  window.dataLayer.push({ ecommerce: null });
                                  window.dataLayer.push({
                                    event: "begin_checkout",
                                    ecommerce: {
                                      currency: "GBP",
                                      value: Number(
                                        expressPaymentData.totalAmount.toFixed(
                                          2,
                                        ),
                                      ),
                                      tax: 0,
                                      shipping: 0,
                                      payment_type: "Apple Pay",
                                      coupon: appleRootCoupon,
                                      items: enrichedItems,
                                    },
                                  });
                                }

                                // Apple Pay has no billing-form fields —
                                // only include user_data if the user typed
                                // their email in this session.
                                const applePayUserData = buildGtmUserData({
                                  email: userEmail || undefined,
                                  phone: (() => { try { return localStorage.getItem("userPhone") || undefined; } catch { return undefined; } })(),
                                });
                                setTimeout(() => {
                                  const applePayEcommerce = {
                                    currency: "GBP",
                                    value: Number(
                                      expressPaymentData.totalAmount.toFixed(2),
                                    ),
                                    tax: 0,
                                    shipping: 0,
                                    payment_type: "Apple Pay",
                                    coupon: appleRootCoupon,
                                    items: enrichedItems,
                                  };
                                  window.dataLayer.push({ ecommerce: null });
                                  window.dataLayer.push({
                                    event: "add_payment_info",
                                    ...(applePayUserData && {
                                      user_data: applePayUserData,
                                    }),
                                    ecommerce: applePayEcommerce,
                                  });
                                  try {
                                    sessionStorage.setItem(
                                      "nuvisa.ga4PurchaseCart",
                                      JSON.stringify({ ecommerce: applePayEcommerce, user_data: applePayUserData || null }),
                                    );
                                  } catch {}
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
                          className="group relative flex items-center justify-center bg-black text-white rounded-full px-[20px] py-3.5 text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm w-full max-sm:py-2.5"
                          style={{
                            backgroundColor: "#000",
                            minHeight: "44px",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <div className="flex items-center -gap-1 md:-gap-2">
                            <svg
                              width="25"
                              height="25"
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
                          onClick={() => {
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
                                getCountryParam(selectedCountry) || "Schengen";

                              // 🌟 FIXED: Use strictly verified discount
                              const baseCode =
                                appliedDiscount?.code || undefined;
                              const hasCoupon = !!baseCode;

                              // 🌟 FIXED: Safe math handling
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
                                    (
                                      expressPaymentData.visaFees / travelers
                                    ).toFixed(2),
                                  ),
                                  quantity: travelers,
                                };
                                const vCoupon = resolveCoupon(travelers >= 3, baseCode);
                                if (vCoupon) vItem.coupon = vCoupon;
                                paymentItems.push(vItem);
                              }

                              if (
                                expressPaymentData.includeInsurance &&
                                insuranceCount > 0
                              ) {
                                const iItem = {
                                  item_id: "insurance_certificate",
                                  item_name: "Insurance Certificate",
                                  price: Number(
                                    (
                                      expressPaymentData.insuranceFees /
                                      insuranceCount
                                    ).toFixed(2),
                                  ),
                                  quantity: insuranceCount,
                                };
                                const iCoupon = resolveCoupon(
                                  effectiveInsCount >= 3,
                                  baseCode,
                                );
                                if (iCoupon) iItem.coupon = iCoupon;
                                paymentItems.push(iItem);
                              }

                              if (
                                expressPaymentData.includeGiftCard &&
                                giftCardCount > 0
                              ) {
                                const gItem = {
                                  item_id: "digital_gift_card",
                                  item_name: GIFT_CARD_PRODUCT_NAME,
                                  price: Number(
                                    (
                                      expressPaymentData.giftCardFees /
                                      giftCardCount
                                    ).toFixed(2),
                                  ),
                                  quantity: giftCardCount,
                                };
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

                              if (!hasTrackedAddPaymentInfoRef.current) {
                                hasTrackedAddPaymentInfoRef.current = true;
                                const enrichedItems = paymentItems.map(
                                  (item) => {
                                    const isInsurance =
                                      item.item_id === "insurance_certificate";
                                    const isGiftCard =
                                      item.item_id === "digital_gift_card";
                                    const lineFinalFees = isInsurance
                                      ? expressPaymentData.insuranceFees
                                      : isGiftCard
                                        ? expressPaymentData.giftCardFees
                                        : expressPaymentData.visaFees;
                                    const qty = item.quantity || 1;
                                    const discountPerUnit = isGiftCard
                                      ? computeCouponDiscountPerUnit(lineFinalFees, qty, appliedDiscount || (giftCardCount >= 3 ? { code: "GROUP20", percentage: 20 } : null))
                                      : hasCoupon
                                        ? computeCouponDiscountPerUnit(lineFinalFees, qty, appliedDiscount)
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
                                    if (discountPerUnit > 0)
                                      enriched.discount = discountPerUnit;
                                    return enriched;
                                  },
                                );

                                // GROUP20 only qualifies at root level when at least one item meets threshold
                                const anyGoogleQualifies =
                                  travelers >= 3 ||
                                  effectiveInsCount >= 3 ||
                                  (expressPaymentData.includeGiftCard && giftCardCount >= 3);
                                const googleRootCoupon = resolveCoupon(
                                  anyGoogleQualifies,
                                  baseCode || (expressPaymentData.includeGiftCard && giftCardCount >= 3 ? "GROUP20" : undefined),
                                );

                                // begin_checkout fires immediately on Google Pay click
                                if (!hasTrackedBeginCheckoutRef.current) {
                                  hasTrackedBeginCheckoutRef.current = true;
                                  window.dataLayer.push({ ecommerce: null });
                                  window.dataLayer.push({
                                    event: "begin_checkout",
                                    ecommerce: {
                                      currency: "GBP",
                                      value: Number(
                                        expressPaymentData.totalAmount.toFixed(
                                          2,
                                        ),
                                      ),
                                      tax: 0,
                                      shipping: 0,
                                      payment_type: "Google Pay",
                                      coupon: googleRootCoupon,
                                      items: enrichedItems,
                                    },
                                  });
                                }

                                // Google Pay has no billing-form fields —
                                // only include user_data if the user typed
                                // their email in this session.
                                const googlePayUserData = buildGtmUserData({
                                  email: userEmail || undefined,
                                  phone: (() => { try { return localStorage.getItem("userPhone") || undefined; } catch { return undefined; } })(),
                                });
                                setTimeout(() => {
                                  const googlePayEcommerce = {
                                    currency: "GBP",
                                    value: Number(
                                      expressPaymentData.totalAmount.toFixed(2),
                                    ),
                                    tax: 0,
                                    shipping: 0,
                                    payment_type: "Google Pay",
                                    coupon: googleRootCoupon,
                                    items: enrichedItems,
                                  };
                                  window.dataLayer.push({ ecommerce: null });
                                  window.dataLayer.push({
                                    event: "add_payment_info",
                                    ...(googlePayUserData && {
                                      user_data: googlePayUserData,
                                    }),
                                    ecommerce: googlePayEcommerce,
                                  });
                                  try {
                                    sessionStorage.setItem(
                                      "nuvisa.ga4PurchaseCart",
                                      JSON.stringify({ ecommerce: googlePayEcommerce, user_data: googlePayUserData || null }),
                                    );
                                  } catch {}
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
                          className="group relative flex items-center justify-center bg-white text-gray-800 rounded-full px-[20px] py-3.5 text-sm font-medium hover:shadow-md transition-all duration-200 shadow-sm border border-gray-200 w-full max-sm:py-2.5"
                          style={{
                            minHeight: "44px",
                            maxHeight: "44px",
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

                    {/* {canShowVisaFeeBreakdown ? (
                    ) : null} */}
                    <VisaFeeBreakdown
                      pricingDetails={pricingDetails}
                      priceSummary={computedPriceSummary}
                      travelerPricing={travelerPricingBreakdown}
                      travelersCount={travelers}
                      insuranceCount={insuranceCount}
                      giftCardCount={giftCardCount}
                      hasAdditionalTravellers={travelers > 1}
                      includeInsurance={Boolean(
                        recommendedItems.insuranceCertificate,
                      )}
                      includeGiftCard={Boolean(recommendedItems.giftCard)}
                      onToggleAdditionalTravellers={(checked) => {
                        const nextTravelers = checked ? 2 : 1;
                        if (insuranceCount > nextTravelers) {
                          dispatch(
                            setReduxInsuranceCount(Number(nextTravelers)),
                          );
                        }
                        dispatch(setReduxTravelers(Number(nextTravelers)));
                        dispatch(
                          setVisaFees(
                            calculateStoredVisaFee({
                              travelerCount: nextTravelers,
                            }),
                          ),
                        );
                      }}
                      onToggleInsurance={() =>
                        toggleRecommendedItem("insuranceCertificate")
                      }
                      onToggleGiftCard={() => toggleRecommendedItem("giftCard")}
                      onTravelersIncrement={() => _handleTravelerChange(1)}
                      onTravelersDecrement={() => _handleTravelerChange(-1)}
                      onInsuranceIncrement={() => handleInsuranceChange(1)}
                      onInsuranceDecrement={() => handleInsuranceChange(-1)}
                      onGiftCardIncrement={() => handleGiftCardChange(1)}
                      onGiftCardDecrement={() => handleGiftCardChange(-1)}
                    />
                  </div>
                );
              })()}
            </StripeProvider>
            </LazyWhenVisible>
          </div>

          <LazyWhenVisible minHeight="120px" rootMargin="240px 0px" className="w-full">
          <ExpertSection
            checked={isExpertSelected}
            onChange={setIsExpertSelected}
          />
          </LazyWhenVisible>

          {/* Recommended Section */}
          <div className="mt-6">
            <h2 className="text-xl font-gilroy-bold mb-4 max-sm:text-lg">
              {more_to_love.title}
            </h2>

            {/* Insurance Certificate & Gift Card Section */}
            <div className="w-full mb-4 max-sm:mb-3">
              <div className="flex flex-col sm:flex-row gap-4 max-sm:gap-3 items-stretch min-w-0">
                    {/* 1. Insurance Certificate Box */}
                    <div
                      className={`flex-1 flex flex-col border px-4  pt-3 max-sm:px-2  rounded-2xl text-white transition-all overflow-hidden bg-white/5 ${
                        recommendedItems.insuranceCertificate
                          ? "border-[#7350FF] bg-white/10 ring-1 ring-[#7350FF]/50"
                          : "border-white/20"
                      }`}
                    >
                      {/* Top Section: Checkbox (Left) & 15 Days Badge (Right) */}
                      <div className="w-full flex justify-between items-center h-5 pb-2">
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all cursor-pointer border flex-shrink-0 ${
                            recommendedItems.insuranceCertificate
                              ? "border-transparent bg-[#7350FF]"
                              : "border-gray-400 bg-white"
                          }`}
                          onClick={() =>
                            toggleRecommendedItem("insuranceCertificate")
                          }
                        >
                          {recommendedItems.insuranceCertificate && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="bg-[#7350FF]/20 border border-[#7350FF]/50 px-2 py-1 rounded-full text-[9px] text-purple-200 font-bold leading-none shadow-sm">
                          {insuranceDays} Days
                        </span>
                      </div>

                      {/* Center Content */}
                      <div className="flex flex-col items-center justify-center pb-4">
                        <div className="w-[50%] aspect-[16/9] mb-3 overflow-hidden rounded-lg shadow-lg">
                          <Image
                            src="/image/image1.png"
                            alt="Insurance"
                            width={100}
                            height={56}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="font-bold text-base max-sm:text-[14px] leading-tight text-center px-1 break-words">
                          {more_to_love.leftTitle}
                        </h3>
                        {more_to_love.leftSubtitle && (
                          <p className="mt-1 text-[11px] text-gray-300 text-center leading-snug">
                            {more_to_love.leftSubtitle}
                          </p>
                        )}
                      </div>

                      {/* Bottom: Qty & Price */}
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <QtyInput
                          value={insuranceCount}
                          onIncrement={() => handleInsuranceChange(1)}
                          onDecrement={() => handleInsuranceChange(-1)}
                          min={0}
                        />
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-[15px] text-gray-400 line-through">
                            £{originalInsuranceBase.toFixed(2)}
                          </span>
                          <span className="font-bold text-base text-white">
                            £{discountedInsurancePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Gift Card Box */}
                    <div
                      className={`flex-1 flex flex-col border px-4 pt-3 max-sm:px-2 rounded-2xl text-white transition-all overflow-hidden bg-white/5 ${
                        recommendedItems.giftCard
                          ? "border-[#7350FF] bg-white/10 ring-1 ring-[#7350FF]/50"
                          : "border-white/20"
                      }`}
                    >
                      {/* Top Section: Checkbox Only (Matching Height) */}
                      <div className="w-full flex justify-start items-center  h-5">
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all cursor-pointer border flex-shrink-0 ${
                            recommendedItems.giftCard
                              ? "border-transparent bg-[#7350FF]"
                              : "border-gray-400 bg-white"
                          }`}
                          onClick={() => toggleRecommendedItem("giftCard")}
                        >
                          {recommendedItems.giftCard && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Center Content */}
                      <div className="flex flex-col items-center justify-center pb-4">
                        <div className="w-[50%] aspect-[16/9] mb-3 overflow-hidden rounded-lg shadow-lg bg-white/5">
                          <Image
                            src="/image/gitftnewcard.png"
                            alt="Gift Card"
                            width={100}
                            height={56}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="font-bold text-base max-sm:text-[14px] leading-tight text-center px-1">
                          {more_to_love.rightTitle}
                        </h3>
                        {more_to_love.rightSubtitle && (
                          <p className="mt-1 text-[11px] text-gray-300 text-center leading-snug">
                            {more_to_love.rightSubtitle}
                          </p>
                        )}
                      </div>

                      {/* Bottom: Qty & Price */}
                      <div className="mt-4 flex flex-col items-center gap-2 pb-4">
                        <QtyInput
                          value={giftCardCount}
                          onIncrement={() => handleGiftCardChange(1)}
                          onDecrement={() => handleGiftCardChange(-1)}
                          min={0}
                        />
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-[15px] text-gray-400 line-through">
                            £{(245 * giftCardCount).toFixed(2)}
                          </span>
                          <span className="font-bold text-base text-white">
                            £{discountedGiftCardPrice.toFixed(2)}
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
          </div>

          {/* Discount Code Section */}
          <div id="discount-code" className="space-y-4 -mt-2 scroll-mt-24">
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
                      giftCardRedeemed || appliedDiscount
                        ? "border-green-400"
                        : couponError
                          ? "border-red-400"
                          : "border-gray-500"
                    } bg-[#24242D] text-white rounded-md p-2 text-sm max-sm:text-xs ${
                      giftCardRedeemed || appliedDiscount
                        ? "outline-none ring-2 ring-green-400"
                        : couponError
                          ? "outline-none ring-2 ring-red-400"
                          : "focus:outline-none focus:ring-2 focus:ring-purple-500"
                    }`}
                    disabled={appliedDiscount || isRedeemingGiftCard}
                  />
                </div>

                {!appliedDiscount ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      applyCouponCode();
                    }}
                    disabled={isRedeemingGiftCard}
                    className="px-4 py-2 bg-white text-black text-sm rounded-md hover:bg-gray-200 transition-colors font-medium max-sm:text-xs max-sm:px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRedeemingGiftCard ? "Processing..." : "Apply"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeCoupon();
                    }}
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

              <div className="text-xs text-gray-400 my-2">
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

              {redeemedGiftCards.length > 0 && (
                <div className="space-y-2">
                  {redeemedGiftCards.map((card) => {
                    const freeTravelerCount = card.benefits?.freeTraveler || 0;
                    const freeInsuranceCount =
                      card.benefits?.freeInsurance || 0;
                    const travelerText =
                      freeTravelerCount === 1 ? "traveller" : "travellers";
                    const insuranceText =
                      freeInsuranceCount === 1 ? "insurance" : "insurances";
                    return (
                      <div
                        key={card.code}
                        className="flex items-center justify-between text-sm text-green-400 bg-green-600/20 p-2 rounded-md max-sm:text-xs max-sm:p-1.5"
                      >
                        <span>
                          ✓ Gift card {card.code} applied! {freeTravelerCount}{" "}
                          free {travelerText} and {freeInsuranceCount} free{" "}
                          {insuranceText}.
                        </span>
                        <button
                          type="button"
                          onClick={() => removeGiftCard(card.code)}
                          className="ml-2 text-red-400 hover:text-red-300 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {isRedeemingGiftCard && (
                <div className="flex items-center space-x-2 text-sm text-blue-400 bg-blue-600/20 p-2 rounded-md max-sm:text-xs max-sm:p-1.5">
                  <span>Validating gift card code...</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Verification Section */}
          {appliedDiscount &&
            appliedDiscount.description.toLowerCase().includes("student") && (
              <div className="space-y-4 mt-8">
                <h2 className="font-medium text-lg max-sm:text-base">
                  Student Verification Required
                </h2>
                <div className="space-y-2">
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
                        {isSendingVerification ? "Sending..." : "Verify Email"}
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-green-600 text-white text-sm rounded-md flex items-center max-sm:text-xs max-sm:px-3">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-yellow-300 mb-2 max-sm:text-xs">
                    <span className="font-medium">📧 Email Verification</span> -
                    Please verify your student email to continue with the
                    discount
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
          <div className="border rounded-3xl border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden max-sm:rounded-2xl mt-5">
            <div className="flex items-center gap-4 p-4 border-b border-white/10 max-sm:p-3 max-sm:gap-3">
              <div
                className="h-4 w-4 rounded-full 
              bg-purple-500
               min-w-4 animate-pulse max-sm:h-3 max-sm:w-3"
              ></div>
              <div>
                <div
                  className="text-sm font-medium text-white max-sm:text-xs"
                  dangerouslySetInnerHTML={{ __html: freeOfferBannerText }}
                />
              </div>
            </div>
            <div className="p-4 max-sm:p-3">
              <div className="grid grid-cols-3 gap-3 max-sm:gap-2">
                {/* August slots */}
                <div className="text-center">
                  <div className="text-xs text-white/70 mb-2 font-medium max-sm:text-xs max-sm:mb-1">
                    {getDynamicMonthText(sliderContent["slot1_label"], -1)}
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
                    {getDynamicMonthText(sliderContent["slot2_label"], 0)}
                  </div>
                  <div className="bg-[#5a3ddb] rounded-full p-2 max-sm:p-1.5">
                    <div className="text-xs text-white font-semibold max-sm:text-xs">
                      {currentWeekReservedText}
                    </div>
                  </div>
                </div>

                {/* October slots */}
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

          {/* Checkout Button */}
          <button
            onClick={() => handleGetVisa()}
            className="group flex w-full justify-between items-center bg-[#6B4EFF] text-white gap-[16px] font-medium px-[20px] py-4 rounded-full cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb] max-sm:py-3.5 max-sm:px-4 mt-8"
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
          <div className="mt-6 space-y-2 max-sm:space-y-1.5">
            <div className="flex items-center space-x-2 text-sm max-sm:text-xs">
              <MedalIcon className="size-5 text-white/70 max-sm:w-4 max-sm:h-4" />
              <span>{checkoutButtonDescription.subtitleOne}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm max-sm:text-xs">
              <ShieldCheckIcon className="size-5 text-white/70 max-sm:w-4 max-sm:h-4" />
              <span>{checkoutButtonDescription.subtitleTwo}</span>
            </div>
          </div>

          {/* Get Help Button */}
          <a
            href="https://wa.me/447388120901?text=Hello%20NUvisa!%20I%20would%20like%20assistance."
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
              loading="lazy"
            />
            Get Help
          </a>
        </section>
      </div>
    </div>
  );
};

export default CountrySlider;
