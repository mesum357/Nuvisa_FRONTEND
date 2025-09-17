import { getCountryConfig } from "@/constants/countryConfig";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setInsuranceFees,
  setSelectedCountry as setReduxSelectedCountry,
  setTravelers as setReduxTravelers,
  setVisaFees,
  setSelectedVisaType as setSelectedVisaTypeDispatch,
  setArrivalDate,
  setDepartureDate,
} from "@/store/visaSlice";
import {
  ArrowUpRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Home,
  MedalIcon,
  PlaneIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import VisaTypeSelector from "./VisaTypeSelector";

const CountrySlider = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);

  const handleCountrySelect = (countryName) => {
    // Extract just the country name from "City, Country" format
    const country = countryName.includes(",")
      ? countryName.split(", ")[1]
      : countryName;

    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(country);

    // Store the selected country and dynamic fees in Redux (ensure all values are serializable primitives)
    dispatch(setReduxSelectedCountry(String(country)));
    dispatch(setVisaFees(Number(countryConfig.visaFee)));
    dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
    dispatch(setReduxTravelers(Number(1)));

    // Redirect to checkout with dynamic country information
    router.push(
      `/visa-checkout?selectedCountry=${encodeURIComponent(country)}&visaFees=${
        countryConfig.visaFee
      }&insuranceFees=${countryConfig.insuranceFee}&travelers=1`
    );
  };
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
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [selectedCountry, setSelectedCountryLocal] = useState("Croatia");
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [insuranceDays, setInsuranceDays] = useState(11);
  const [giftCardCount, setGiftCardCount] = useState(1);
  const [arrivalDate, setArrivalDateLocal] = useState(null);
  const [departureDate, setDepartureDateLocal] = useState(null);
  const [dateValidationErrors, setDateValidationErrors] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({
    approvalRate: true,
    riskFree: true,
    getHelp: true,
  });
  const [validationErrors, setValidationErrors] = useState(new Set());
  const [selectedVisaType, setSelectedVisaType] = useState(null); // Add state for selected visa type

  // Helper function to safely parse duration from visa type
  const parseDurationDays = (durationString) => {
    if (!durationString) return null;

    // Handle common invalid/placeholder values
    if (
      durationString.includes("-1") ||
      durationString.toLowerCase().includes("invalid")
    ) {
      console.log(
        `Invalid duration detected: "${durationString}" -> using default 90 days`
      );
      return 90; // Default fallback for Schengen visas
    }

    // Extract numbers including negative ones, but take absolute value of first match
    const matches = durationString.match(/-?\d+/);
    let days = matches ? Math.abs(parseInt(matches[0])) : null;

    // If we got a negative or zero value, use default
    if (days <= 0) {
      console.log(
        `Invalid duration value: "${durationString}" -> using default 90 days`
      );
      days = 90;
    }

    console.log(`Parsing duration: "${durationString}" -> ${days} days`);
    return days;
  };

  // Helper function to sanitize duration strings before storing in Redux
  const sanitizeDurationString = (duration) => {
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

    if (!arrival || !departure) {
      return errors;
    }

    const arrivalDate = new Date(arrival);
    const departureDate = new Date(departure);

    // Basic date validation
    if (arrivalDate >= departureDate) {
      errors.dateOrder = "Departure date must be after arrival date";
      return errors; // Early return for basic validation errors
    }

    // Check if arrival date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (arrivalDate < today) {
      errors.pastDate = "Arrival date cannot be in the past";
      return errors; // Early return for past date errors
    }

    // Calculate trip duration
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

    return errors;
  };

  // Handle date changes with validation and Redux updates
  const handleArrivalDateChange = (date) => {
    setArrivalDateLocal(date);
    const dateString = date ? date.toISOString().split("T")[0] : "";
    dispatch(setArrivalDate(dateString));

    // Validate dates only if both dates exist
    if (date && departureDate) {
      const errors = validateDates(date, departureDate, selectedVisaType);
      setDateValidationErrors(errors);
    }

    // If there's a visa type with duration limit, auto-adjust departure date if needed
    if (
      selectedVisaType &&
      selectedVisaType.duration_permitted &&
      date &&
      departureDate
    ) {
      const maxDays = parseDurationDays(selectedVisaType.duration_permitted);
      const currentTripDays = Math.ceil(
        (departureDate - date) / (1000 * 60 * 60 * 24)
      );

      // If current trip exceeds limit, adjust departure date to max allowed
      if (maxDays && currentTripDays > maxDays) {
        const newDepartureDate = new Date(
          date.getTime() + (maxDays - 1) * 24 * 60 * 60 * 1000
        );
        setDepartureDateLocal(newDepartureDate);
        dispatch(
          setDepartureDate(newDepartureDate.toISOString().split("T")[0])
        );
      }
    }
  };

  const handleDepartureDateChange = (date) => {
    setDepartureDateLocal(date);
    const dateString = date ? date.toISOString().split("T")[0] : "";
    dispatch(setDepartureDate(dateString));

    // Validate dates only if both dates exist
    if (arrivalDate && date) {
      const errors = validateDates(arrivalDate, date, selectedVisaType);
      setDateValidationErrors(errors);
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

  // Required Documents checkboxes state
  const [requiredDocuments, setRequiredDocuments] = useState({
    passport: false,
    ukVisa: false,
    photos: false,
    bankStatements: false,
    employmentProof: false,
    insurance: false,
  });

  // Recommended items checkboxes state
  const [recommendedItems, setRecommendedItems] = useState({
    insuranceCertificate: false,
    giftCard: false,
  });

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

  // Set default dates after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (!arrivalDate || !departureDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const departureDefault = new Date();
      departureDefault.setDate(departureDefault.getDate() + 12);

      if (!arrivalDate) {
        setArrivalDateLocal(tomorrow);
        dispatch(setArrivalDate(tomorrow.toISOString().split("T")[0]));
      }

      if (!departureDate) {
        setDepartureDateLocal(departureDefault);
        dispatch(
          setDepartureDate(departureDefault.toISOString().split("T")[0])
        );
      }
    }
  }, [arrivalDate, departureDate, dispatch]);

  const toggleRequiredDocument = (documentKey) => {
    setRequiredDocuments((prev) => ({
      ...prev,
      [documentKey]: !prev[documentKey],
    }));
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
    setRecommendedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
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
        const diffTime = Math.abs(departureDate - arrivalDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
        setInsuranceDays(11); // Default to 11 days
      }
    }
  };

  const toggleOption = (option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const [baseFee] = useState(159);
  // Note: Insurance fees are now dynamic and pulled from Redux store based on selected country
  // const [baseInsuranceFee] = useState(87);
  // const [perDayInsurancePrice] = useState(8); // £8 per day per traveller

  const tooltips = {
    sticker:
      "A visa sticker is a physical visa label attached to your passport. It contains your personal details, visa type, validity period, and number of entries allowed.",
    duration:
      "30 days is the standard duration for this visa type. This means you can stay in the Schengen area for up to 30 days within the visa validity period.",
    term: "Short-term visas are typically issued for visits under 90 days. They're commonly used for tourism, business trips, or visiting family/friends.",
    entry:
      "Multiple entry allows you to enter the country multiple times during the visa validity period without needing to apply for a new visa each time.",
  };

  const handleTravelerChange = (increment) => {
    const newValue = travelers + increment;
    if (newValue >= 1) {
      setTravelersLocal(newValue);
      dispatch(setReduxTravelers(Number(newValue)));
    }
  };

  // Handle visa type selection from VisaTypeSelector
  const handleVisaTypeSelect = (visaType) => {
    // Create a serializable copy of the visa type with sanitized data
    const serializableVisaType = {
      id: String(visaType.id || ""),
      name: String(visaType.name || ""),
      type: String(visaType.type || visaType.name || ""),
      subType: visaType.subType ? String(visaType.subType) : null,
      price: Number(visaType.price || 0),
      priceGBP: Number(visaType.priceGBP || 0),
      currency: String(visaType.currency || "INR"),
      purpose: Array.isArray(visaType.purpose)
        ? visaType.purpose.map((p) => String(p)).filter(Boolean)
        : [],
      country_symbol: String(visaType.country_symbol || ""),
      processing_time: String(visaType.processing_time || ""),
      validity: sanitizeDurationString(visaType.validity),
      validity_period: sanitizeDurationString(visaType.validity_period),
      duration_permitted: sanitizeDurationString(visaType.duration_permitted),
      entries_permitted: String(visaType.entries_permitted || ""),
    };

    setSelectedVisaType(serializableVisaType);

    // Update Redux with the new visa fees from selected visa type
    // Use GBP price if available, otherwise convert from INR
    const visaFeesInGBP = visaType.priceGBP
      ? Number(visaType.priceGBP)
      : Math.round(Number(visaType.price || 0) / 100);
    dispatch(setVisaFees(Number(visaFeesInGBP)));

    console.log("Original visa type data:", {
      duration_permitted: visaType.duration_permitted,
      validity: visaType.validity,
      validity_period: visaType.validity_period,
    });
    console.log("Sanitized visa type:", serializableVisaType);
    console.log("Updated visa fees to:", visaFeesInGBP);
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

  const handleInsuranceChange = (increment) => {
    const newValue = insuranceDays + increment;

    // Calculate maximum allowed days based on visa type or dates
    let maxAllowedDays = 90; // Default

    if (selectedVisaType && selectedVisaType.duration_permitted) {
      maxAllowedDays =
        parseDurationDays(selectedVisaType.duration_permitted) || 90;
    }

    // If dates are selected, use the actual trip duration as upper limit
    if (arrivalDate && departureDate) {
      const tripDuration = Math.ceil(
        (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
      );
      maxAllowedDays = Math.min(maxAllowedDays, tripDuration);
    }

    // Ensure new value doesn't exceed limits
    const clampedValue = Math.min(Math.max(newValue, 1), maxAllowedDays);

    if (clampedValue !== insuranceDays) {
      setInsuranceDays(clampedValue);
      // Update the recommended items state based on days value
      if (clampedValue > 0 && !recommendedItems.insuranceCertificate) {
        setRecommendedItems((prev) => ({
          ...prev,
          insuranceCertificate: true,
        }));
      } else if (clampedValue === 0 && recommendedItems.insuranceCertificate) {
        setRecommendedItems((prev) => ({
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
        setRecommendedItems((prev) => ({ ...prev, giftCard: true }));
      } else if (newValue === 0 && recommendedItems.giftCard) {
        setRecommendedItems((prev) => ({ ...prev, giftCard: false }));
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

  // Auto-sync insurance days from calendar dates
  useEffect(() => {
    if (arrivalDate && departureDate) {
      const diffTime = Math.abs(departureDate - arrivalDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate maximum allowed days based on visa type
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

  const handleGetVisa = () => {
    // Validate required documents (except insurance which is optional)
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

    // Use selected visa type fees if available, otherwise fallback to baseFee
    // Use the GBP price if available, otherwise convert from INR
    const currentBaseFee =
      selectedVisaType && selectedVisaType.priceGBP
        ? Number(selectedVisaType.priceGBP)
        : selectedVisaType && selectedVisaType.price
        ? Math.round(Number(selectedVisaType.price) / 100)
        : baseFee;
    const visaFees = currentBaseFee * travelers;
    const insuranceFees = recommendedItems.insuranceCertificate
      ? (visaState.insuranceFees || 400) * travelers
      : 0;
    const giftCardFees = recommendedItems.giftCard ? 188 * giftCardCount : 0;

    // Get the country name from the selected country object
    const countryName = selectedCountry?.name || selectedCountry || "Germany";

    // Store in Redux (make sure we're only passing serializable primitive data)
    dispatch(setReduxSelectedCountry(String(countryName)));
    dispatch(setVisaFees(Number(visaFees)));
    dispatch(setInsuranceFees(Number(insuranceFees)));
    dispatch(setReduxTravelers(Number(travelers)));

    // Store selected visa type information
    if (selectedVisaType) {
      dispatch(
        setSelectedVisaTypeDispatch({
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

    console.log("Visa Fees :::", visaFees);
    console.log("Insurance Fees :::", insuranceFees);
    console.log("Gift Card Fees :::", giftCardFees);
    console.log("travelers ::: ", travelers);
    console.log("selectedCountry ::: ", selectedCountry);
    console.log("arrivalDate ::: ", arrivalDate);
    console.log("departureDate ::: ", departureDate);
    console.log("requiredDocuments ::: ", requiredDocuments);
    console.log("recommendedItems ::: ", recommendedItems);

    // Navigate with query params including all selections (ensure all values are serializable)
    const queryParams = new URLSearchParams({
      visaFees: visaFees.toString(),
      insuranceFees: insuranceFees.toString(),
      giftCardFees: giftCardFees.toString(),
      travelers: travelers.toString(),
      selectedCountry: countryName,
      departureDate: arrivalDate
        ? arrivalDate.toISOString()
        : new Date().toISOString(),
      returnDate: departureDate
        ? departureDate.toISOString()
        : new Date().toISOString(),
      requiredDocuments: JSON.stringify(requiredDocuments),
      recommendedItems: JSON.stringify(recommendedItems),
      insuranceOnly: hasOnlyInsurance.toString(),
    });

    router.push(`/visa-checkout?${queryParams.toString()}`);
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
                  className={`w-2.5 h-2.5 cursor-pointer rounded-full transition-all ${
                    index === currentIndex ? "bg-white w-6" : "bg-white/50"
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
                className={`w-20 aspect-square object-cover cursor-pointer rounded-xl border-2 transition-all border-white ${
                  index === currentIndex
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
                £
                {selectedVisaType && selectedVisaType.priceGBP
                  ? Math.round(selectedVisaType.priceGBP * 1.25) * travelers
                  : 200 * travelers}
              </span>
              <span className="text-2xl font-gilroy-bold">
                £
                {selectedVisaType && selectedVisaType.priceGBP
                  ? Math.round(selectedVisaType.priceGBP) * travelers
                  : 159 * travelers}
              </span>

              <div className="flex items-center gap-2 shadow-lg shadow-black/20 p-2 rounded-full">
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                  <UserIcon className="fill-white" />
                </div>
                <span className="text-xs font-gilroy-bold">Travellers</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTravelerChange(1)}
                    className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-sm font-gilroy-bold"
                  >
                    +
                  </button>
                  <span className="mx-2 text-sm font-gilroy-bold">
                    {travelers}
                  </span>
                  <button
                    onClick={() => handleTravelerChange(-1)}
                    disabled={travelers <= 1}
                    className={`w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-sm font-gilroy-bold`}
                  >
                    -
                  </button>
                </div>
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
        <div className="flex gap-10 my-10 items-center">
          <div>
            <label className="block text-base font-medium mb-1">
              Arrival Date
            </label>
            <div className="relative w-64 font-semibold">
              <DatePicker
                selected={arrivalDate}
                onChange={handleArrivalDateChange}
                minDate={new Date()}
                maxDate={
                  selectedVisaType && selectedVisaType.validity_period
                    ? (() => {
                        const validityDays = parseDurationDays(
                          selectedVisaType.validity_period
                        );
                        return validityDays
                          ? new Date(
                              Date.now() + validityDays * 24 * 60 * 60 * 1000
                            )
                          : undefined;
                      })()
                    : undefined
                }
                dateFormat="dd/MM/yyyy"
                className={`w-full bg-[#24242D] text-white rounded text-sm pr-8 font-semibold border-gray-600 focus:outline-none border-none focus:ring-2 ${
                  dateValidationErrors.pastDate ||
                  dateValidationErrors.dateOrder
                    ? "focus:ring-red-500"
                    : "focus:ring-purple-500"
                }`}
                placeholderText="Select arrival date"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {(dateValidationErrors.pastDate ||
              dateValidationErrors.dateOrder) && (
              <div className="text-red-500 text-xs mt-1">
                {dateValidationErrors.pastDate ||
                  dateValidationErrors.dateOrder}
              </div>
            )}
          </div>

          <PlaneIcon className="rotate-45 fill-white size-5" />

          <div>
            <label className="block text-base font-medium mb-1">
              Departure Date
            </label>
            <div className="relative w-64 font-semibold">
              <DatePicker
                selected={departureDate}
                onChange={handleDepartureDateChange}
                dateFormat="dd/MM/yyyy"
                className={`w-full bg-[#24242D] text-white rounded text-sm pr-8 font-semibold border-gray-600 focus:outline-none border-none focus:ring-2 ${
                  dateValidationErrors.exceedsLimit
                    ? "focus:ring-red-500"
                    : "focus:ring-purple-500"
                }`}
                placeholderText="Select departure date"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {dateValidationErrors.exceedsLimit && (
              <div className="text-red-500 text-xs mt-1">
                {dateValidationErrors.exceedsLimit}
              </div>
            )}
            {arrivalDate && departureDate && (
              <div className="text-green-400 text-xs mt-1">
                Trip duration:{" "}
                {Math.ceil(
                  (departureDate - arrivalDate) / (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </div>
            )}
          </div>
        </div>

        {/* Required Documents */}
        <div className="mb-6">
          <h2 className="text-xl font-gilroy-bold mb-4">Required Documents:</h2>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`flex items-start space-x-2 cursor-pointer rounded p-2 transition-colors ${
                requiredDocuments.passport
                  ? "border-[2px] border-black rounded-xl"
                  : validationErrors.has("passport")
                  ? "border border-red-500 rounded-xl"
                  : "shadow-black/20 shadow-lg rounded-xl"
              }`}
              onClick={() => toggleRequiredDocument("passport")}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm mt-0.5 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                  requiredDocuments.passport
                    ? "bg-[#7350FF] border border-transparent"
                    : "bg-white border border-gray-500"
                }`}
              >
                {requiredDocuments.passport ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300 rounded-lg" />
                )}
              </div>
              <span className="text-base">
                <strong>Passport</strong> (minimum 6 months validity)
              </span>
            </div>
            <div
              className={`flex items-start space-x-2 cursor-pointer rounded p-1 transition-colors ${
                requiredDocuments.ukVisa
                  ? "border-[2px] border-black rounded-xl"
                  : validationErrors.has("ukVisa")
                  ? "border border-red-500 rounded-xl"
                  : "shadow-black/20 shadow-lg rounded-xl"
              }`}
              onClick={() => toggleRequiredDocument("ukVisa")}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm mt-0.5 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                  requiredDocuments.ukVisa
                    ? "bg-[#7350FF] border border-transparent"
                    : "bg-white border border-gray-500"
                }`}
              >
                {requiredDocuments.ukVisa ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300" />
                )}
              </div>
              <span className="text-base">
                <strong>UK visa</strong> (minimum 6 months validity)
              </span>
            </div>
            <div
              className={`flex items-start space-x-2 cursor-pointer rounded p-1 transition-colors ${
                requiredDocuments.photos
                  ? "border-[2px] border-black rounded-xl"
                  : validationErrors.has("photos")
                  ? "border border-red-500 rounded-xl"
                  : "shadow-black/20 shadow-lg rounded-xl"
              }`}
              onClick={() => toggleRequiredDocument("photos")}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm mt-0.5 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                  requiredDocuments.photos
                    ? "bg-[#7350FF] border border-transparent"
                    : "bg-white border border-gray-500"
                }`}
              >
                {requiredDocuments.photos ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300" />
                )}
              </div>
              <span className="text-base">
                <strong>Passport-Sized Photographs</strong> (Two 35mm x 45mm
                photos)
              </span>
            </div>
            <div
              className={`flex items-start space-x-2 cursor-pointer rounded p-1 transition-colors ${
                requiredDocuments.bankStatements
                  ? "border-[2px] border-black rounded-xl"
                  : validationErrors.has("bankStatements")
                  ? "border border-red-500 rounded-xl"
                  : "shadow-black/20 shadow-lg rounded-xl"
              }`}
              onClick={() => toggleRequiredDocument("bankStatements")}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm mt-0.5 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                  requiredDocuments.bankStatements
                    ? "bg-[#7350FF] border border-transparent"
                    : "bg-white border border-gray-500"
                }`}
              >
                {requiredDocuments.bankStatements ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300" />
                )}
              </div>
              <span className="text-base">
                <strong>Bank statements</strong> (Last 3 months showing
                sufficient funds £50–£80/day per person)
              </span>
            </div>
            <div
              className={`flex items-start space-x-2 cursor-pointer rounded p-1 transition-colors ${
                requiredDocuments.employmentProof
                  ? "border-[2px] border-black rounded-xl"
                  : validationErrors.has("employmentProof")
                  ? "border border-red-500 rounded-xl"
                  : "shadow-black/20 shadow-lg rounded-xl"
              }`}
              onClick={() => toggleRequiredDocument("employmentProof")}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm mt-0.5 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                  requiredDocuments.employmentProof
                    ? "bg-[#7350FF] border border-transparent"
                    : "bg-white border border-gray-500"
                }`}
              >
                {requiredDocuments.employmentProof ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300" />
                )}
              </div>
              <span className="text-base">
                <strong>Employment proof</strong> (Last 3 months payslips, if
                student uni enrolment letter)
              </span>
            </div>
            <div
              className={`flex items-start space-x-2 cursor-pointer rounded p-1 transition-colors ${
                requiredDocuments.insurance
                  ? "border-[2px] border-black rounded-xl"
                  : "shadow-black/20 shadow-lg rounded-xl"
              }`}
              onClick={() => toggleRequiredDocument("insurance")}
            >
              <div
                className={`w-3.5 h-3.5 rounded-sm mt-0.5 flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                  requiredDocuments.insurance
                    ? "bg-[#7350FF] border border-transparent"
                    : "bg-white border border-gray-500"
                }`}
              >
                {requiredDocuments.insurance ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <div className="w-4 h-4 border border-gray-300" />
                )}
              </div>
              <span className="text-base">
                <strong>Insurance certificate</strong> (Must be valid for the
                entire duration of stay)
              </span>
            </div>
          </div>
        </div>
        {/* <div className="px-5 mb-10 pt-5 w-full flex items-center justify-center">
          <div className="max-w-[88rem] w-full">
            <VisaTypeSelector onVisaTypeSelect={handleVisaTypeSelect} />
          </div>
        </div> */}

        {/* Recommended */}
        <div className="mb-6">
          <h2 className="text-xl font-gilroy-bold mb-4">Recommended</h2>

          {/* Insurance Certificate */}
          <div
            className="shadow-xl shadow-black/10 rounded-xl p-4 mb-4"
            onClick={() => toggleRecommendedItem("insuranceCertificate")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="cursor-pointer rounded p-1 transition-colors flex-1">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                      recommendedItems.insuranceCertificate
                        ? "bg-[#7350FF] border border-transparent"
                        : "bg-white border border-gray-500"
                    }`}
                  >
                    {recommendedItems.insuranceCertificate && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="font-medium">Insurance certificate</span>
                  <div className="flex items-center space-x-2 mt-1 ml-6">
                    <span className="text-lg font-semibold line-through">
                      £
                      {Math.round(
                        (visaState.insuranceFees || 400) * 1.25 * travelers
                      )}
                    </span>
                    <span className="font-gilroy-bold text-2xl">
                      £{(visaState.insuranceFees || 400) * travelers}
                    </span>
                  </div>
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
                    // return insuranceDays >= maxAllowedDays ? (
                    //   <span className="text-xs text-yellow-400">
                    //     (Max: {maxAllowedDays})
                    //   </span>
                    // ) : null;
                  })()}
                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsuranceChange(1);
                    }}
                    disabled={(() => {
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
                      return insuranceDays >= maxAllowedDays;
                    })()}
                    className={`size-4 border border-white/50 bg-transparent rounded-full text-white flex items-center justify-center text-sm font-gilroy-bold ${
                      (() => {
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
                            (departureDate - arrivalDate) /
                              (1000 * 60 * 60 * 24)
                          );
                          maxAllowedDays = Math.min(
                            maxAllowedDays,
                            tripDuration
                          );
                        }
                        return insuranceDays >= maxAllowedDays;
                      })()
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    +
                  </button> */}
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
              <div className="flex items-end gap-8 px-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTravelerChange(-1);
                      }}
                      disabled={travelers <= 1}
                      className={`size-4 border border-white/50 text-white bg-transparent rounded-full flex items-center justify-center text-sm font-gilroy-bold ${
                        travelers <= 1
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      -
                    </button>
                    <span className="mx-2 font-semibold">
                      {travelers} Traveller{travelers > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTravelerChange(1);
                      }}
                      className="size-4 border border-white/50 bg-transparent rounded-full text-white flex items-center justify-center text-sm font-gilroy-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => toggleRecommendedItem("giftCard")}
              className="shadow-xl shadow-black/10 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="cursor-pointer rounded p-1 transition-colors flex-1">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:border-black ${
                        recommendedItems.giftCard
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
                    <div className="flex items-center space-x-2 mt-1 ml-6">
                      <span className="text-lg font-semibold line-through">
                        £{245 * giftCardCount}
                      </span>
                      <span className="font-gilroy-bold text-2xl">
                        £{188 * giftCardCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGiftCardChange(-1);
                  }}
                  disabled={giftCardCount <= 1}
                  className={`size-4 border border-white/50 text-white bg-transparent rounded-full flex items-center justify-center text-sm font-gilroy-bold ${
                    giftCardCount <= 1
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : ""
                  }`}
                >
                  -
                </button>
                <span className="mx-2 font-semibold">{giftCardCount}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGiftCardChange(1);
                  }}
                  className="size-4 border border-white/50 bg-transparent rounded-full text-white flex items-center justify-center text-sm font-gilroy-bold"
                >
                  +
                </button>
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

          {/* Checkout Button */}
          <button
            onClick={handleGetVisa}
            className="group flex w-full justify-between items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[20px] py-3.5 rounded-full cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]"
          >
            <span className="mr-3 text-xl font-semibold">CHECKOUT</span>
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
