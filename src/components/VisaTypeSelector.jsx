import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setVisaTypeId,
  setSelectedVisaType,
  setSelectedCountry,
} from "@/store/visaSlice";
import { getVisaTypes } from "@/api/smvVisa";

const VisaTypeSelector = ({ onVisaTypeSelect }) => {
  const [visaTypes, setVisaTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState(null);
  const [conversionRate, setConversionRate] = useState(100); // Default fallback rate
  const [loadingRate, setLoadingRate] = useState(false);
  const [isClient, setIsClient] = useState(false); // Add client-side flag
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();


  // Get selected country from URL params or Redux store
  const selectedCountryFromUrl = searchParams.get("selectedCountry");
  const selectedCountryFromStore = useAppSelector(
    (state) => state.visa.selectedCountry
  );
  const selectedCountry = selectedCountryFromUrl || selectedCountryFromStore;

  // Set client flag after mount to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Fetch conversion rate when component mounts on client
    if (isClient) {
      fetchConversionRate();
    }
  }, [isClient]);

  useEffect(() => {
    if (selectedCountry && isClient) {
      // Update Redux store with selected country if it came from URL
      if (
        selectedCountryFromUrl &&
        selectedCountryFromUrl !== selectedCountryFromStore
      ) {
        dispatch(setSelectedCountry(selectedCountryFromUrl));
      }
      fetchVisaTypes();
    }
  }, [selectedCountry, isClient]);

  const fetchConversionRate = async () => {
    setLoadingRate(true);
    try {
      // Using a free exchange rate API (you can replace with Google's API if you have access)
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/INR"
      );
      const data = await response.json();

      if (data.rates && data.rates.GBP) {
        setConversionRate(1 / data.rates.GBP); // Convert from GBP rate to INR per GBP
      } else {
        // Fallback to a reasonable rate if API fails
        setConversionRate(100);
      }
    } catch (error) {
      console.error("Failed to fetch conversion rate:", error);
      // Fallback to reasonable rate
      setConversionRate(100);
    } finally {
      setLoadingRate(false);
    }
  };

  const fetchVisaTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get country code from the selected country name
      const countryCode = getCountryCodeFromName(selectedCountry);
      const response = await getVisaTypes(countryCode);

      // Handle different response structures
      let visaTypesData = [];

      if (
        response?.data?.status?.success &&
        response?.data?.status?.data?.success
      ) {
        // Structure: response.data.status.data.data
        visaTypesData = response.data.status.data.data || [];
      } else if (response?.status?.success && response?.status?.data?.success) {
        // Structure: response.status.data.data
        visaTypesData = response.status.data.data || [];
      } else if (response?.data?.data?.success) {
        // Structure: response.data.data.data
        visaTypesData = response.data.data.data || [];
      } else {
        setError("Failed to load visa types");
        return;
      }

      if (visaTypesData.length === 0) {
        setError("No visa types found for this country");
        return;
      }

      // Transform the data to match component expectations
      const transformedData = visaTypesData.map((item) => ({
        id: item._id,
        name: item.visa_type,
        description: `For ${item.purpose?.join(", ").toLowerCase()} purposes`,
        processing_time: `${item.processing_time} days`,
        validity: `${item.validity_period} days`,
        duration_permitted: `${item.duration_permitted} days`,
        apply_before: `${item.apply_before} days`,
        entries_permitted:
          item.entries_permitted === -1 ? "Multiple" : item.entries_permitted,
        price: calculateTotalPrice(item.pricing), // Original price in INR
        priceGBP: convertToGBP(calculateTotalPrice(item.pricing)), // Converted price in GBP
        currency: item.pricing?.visa_fee?.currency || "INR",
        pricing: item.pricing,
        pricingGBP: {
          visa_fee: {
            amount: convertToGBP(item.pricing?.visa_fee?.amount || 0),
            currency: "GBP",
          },
          vfs_fee: {
            amount: convertToGBP(item.pricing?.vfs_fee?.amount || 0),
            currency: "GBP",
          },
          service_fee: {
            amount: convertToGBP(item.pricing?.service_fee?.amount || 0),
            currency: "GBP",
          },
        },
        purpose: item.purpose,
        tags: item.tags,
        country_symbol: item.country_symbol,
        requirements: generateRequirements(item), // Generate based on visa type
      }));

      setVisaTypes(transformedData);

      // Auto-select the first visa type
      if (transformedData.length > 0) {
        const firstVisaType = transformedData[0];
        setSelectedVisaTypeId(firstVisaType.id);

        // Store in Redux and call parent callback
        dispatch(setVisaTypeId(firstVisaType.id));
        dispatch(setSelectedVisaType(firstVisaType));

        if (onVisaTypeSelect) {
          onVisaTypeSelect(firstVisaType);
        }
      }
    } catch (err) {
      setError("Error loading visa types");
      console.error("Visa types error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate total price from pricing object
  const calculateTotalPrice = (pricing) => {
    if (!pricing) return 0;

    let total = 0;
    if (pricing.visa_fee?.amount > 0) total += pricing.visa_fee.amount;
    if (pricing.vfs_fee?.amount > 0) total += pricing.vfs_fee.amount;
    if (pricing.service_fee?.amount > 0) total += pricing.service_fee.amount;

    return total;
  };

  // Helper function to convert INR to GBP using real-time rate
  const convertToGBP = (inrAmount) => {
    if (!inrAmount || inrAmount === 0) return 0;
    return Math.round(inrAmount / conversionRate);
  };

  // Helper function to generate requirements based on visa type
  const generateRequirements = (visaData) => {
    const baseRequirements = ["Valid passport", "Passport size photos"];

    if (visaData.purpose?.includes("BUSINESS")) {
      return [
        ...baseRequirements,
        "Business invitation",
        "Company registration",
        "Travel insurance",
      ];
    } else if (visaData.purpose?.includes("VACATION")) {
      return [
        ...baseRequirements,
        "Travel insurance",
        "Hotel bookings",
        "Return ticket",
      ];
    } else if (visaData.purpose?.includes("VISIT_FRIENDS_&_FAMILY")) {
      return [
        ...baseRequirements,
        "Invitation letter",
        "Relationship proof",
        "Travel insurance",
      ];
    }

    return [...baseRequirements, "Travel insurance", "Supporting documents"];
  };

  // Helper function to get country code from name
  const getCountryCodeFromName = (countryName) => {
    const countryMap = {
      // European Countries
      Austria: "AUT",
      Belgium: "BEL",
      Bulgaria: "BGR",
      Croatia: "HRV",
      Cyprus: "CYP",
      "Czech Republic": "CZE",
      Denmark: "DNK",
      Estonia: "EST",
      Finland: "FIN",
      France: "FRA",
      Germany: "DEU",
      Greece: "GRC",
      Hungary: "HUN",
      Iceland: "ISL",
      Italy: "ITA",
      Latvia: "LVA",
      Liechtenstein: "LIE",
      Lithuania: "LTU",
      Luxembourg: "LUX",
      Malta: "MLT",
      Netherlands: "NLD",
      Norway: "NOR",
      Poland: "POL",
      Portugal: "PRT",
      Romania: "ROU",
      Slovakia: "SVK",
      Slovenia: "SVN",
      Spain: "ESP",
      Sweden: "SWE",
      Switzerland: "CHE",

      // Popular destinations from SMV API
      "United States": "USA",
      "United States of America": "USA",
      USA: "USA",
      Azerbaijan: "AZE",
      Indonesia: "IDN",
      Vietnam: "VNM",

      // Additional countries
      "United Kingdom": "GBR",
      UK: "GBR",
      Canada: "CAN",
      Australia: "AUS",
      "New Zealand": "NZL",
      Japan: "JPN",
      "South Korea": "KOR",
      Singapore: "SGP",
      Malaysia: "MYS",
      Thailand: "THA",
      "South Africa": "ZAF",
      "United Arab Emirates": "ARE",
      UAE: "ARE",
    };
    return countryMap[countryName] || countryName;
  };

  const handleVisaTypeSelect = (visaType) => {
    // Update selected visa type
    setSelectedVisaTypeId(visaType.id);

    // Store visa type ID and details in Redux
    dispatch(setVisaTypeId(visaType.id));
    dispatch(setSelectedVisaType(visaType));

    // Call parent callback to update the visa fees and information
    if (onVisaTypeSelect) {
      onVisaTypeSelect(visaType);
    }

    // Don't navigate automatically - let the parent component handle the flow
    // The existing checkout button in Slider will handle navigation
  };

  // Don't render dynamic content until client-side
  if (!isClient) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-white/60">Loading...</p>
      </div>
    );
  }

  if (!selectedCountry) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">
          Please select a country first to view available visa types
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-white/60">Loading visa types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchVisaTypes}
          className="mt-2 text-purple-400 hover:text-purple-300"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!visaTypes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">
          No visa types available for {selectedCountry}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          Available Visa Types for {selectedCountry}
        </h3>
        {/* <div className="text-sm text-white/60">
          {loadingRate ? (
            <span>Loading exchange rate...</span>
          ) : (
            <span>1 GBP = ₹{Math.round(conversionRate)}</span>
          )}
        </div> */}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visaTypes.map((visaType) => (
          <motion.div
            key={visaType.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVisaTypeSelect(visaType)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedVisaTypeId === visaType.id
              ? "border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/50"
              : "border-[#423577] hover:border-purple-500 hover:bg-[#423577]/20"
              }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white text-lg">
                  {visaType.name}
                  {selectedVisaTypeId === visaType.id && (
                    <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </h4>
                {visaType.tags && visaType.tags.length > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    {visaType.tags[0]}
                  </span>
                )}
              </div>

              {visaType.description && (
                <p className="text-sm text-white/70 mb-3">
                  {visaType.description}
                </p>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Processing Time:</span>
                  <span className="text-white">{visaType.processing_time}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Validity Period:</span>
                  <span className="text-white">{visaType.validity}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Duration Allowed:</span>
                  <span className="text-white">
                    {visaType.duration_permitted}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Entries:</span>
                  <span className="text-white">
                    {visaType.entries_permitted}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Apply Before:</span>
                  <span className="text-white">{visaType.apply_before}</span>
                </div>

                {/* Pricing Breakdown */}
                <div className="mt-3 pt-3 border-t border-[#423577]">
                  <p className="text-sm font-medium text-white mb-2">
                    Pricing Breakdown:
                  </p>

                  {visaType.pricingGBP?.visa_fee?.amount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Visa Fee:</span>
                      <span className="text-white">
                        £{visaType.pricingGBP.visa_fee.amount}
                      </span>
                    </div>
                  )}

                  {visaType.pricingGBP?.vfs_fee?.amount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">VFS Fee:</span>
                      <span className="text-white">
                        £{visaType.pricingGBP.vfs_fee.amount}
                      </span>
                    </div>
                  )}

                  {visaType.pricingGBP?.service_fee?.amount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Service Fee:</span>
                      <span className="text-white">
                        £{visaType.pricingGBP.service_fee.amount}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-[#423577]">
                    <span className="text-white">Total Price:</span>
                    <span className="text-green-400">£{visaType.priceGBP}</span>
                  </div>
                </div>
              </div>

              {visaType.requirements && visaType.requirements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#423577]">
                  <p className="text-xs text-white/60 mb-1">Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {visaType.requirements.slice(0, 3).map((req, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded"
                      >
                        {req}
                      </span>
                    ))}
                    {visaType.requirements.length > 3 && (
                      <span className="text-xs text-white/60">
                        +{visaType.requirements.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVisaTypeSelect(visaType);
                }}
                className={`mt-4 w-full py-2 px-4 rounded-lg transition-all duration-200 font-medium ${selectedVisaTypeId === visaType.id
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                  }`}
              >
                {selectedVisaTypeId === visaType.id
                  ? "Selected"
                  : "Update Fees"}{" "}
                - £{visaType.priceGBP}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VisaTypeSelector;
