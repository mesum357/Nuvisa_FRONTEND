"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import { getCountryConfig } from "@/constants/countryConfig";

export const schengenCountries = [
  { name: "Austria", code: "at" },
  { name: "Belgium", code: "be" },
  { name: "Bulgaria", code: "bg" },
  { name: "Croatia", code: "hr" },
  { name: "Cyprus", code: "cy" },
  { name: "Czech Republic", code: "cz" },
  { name: "Denmark", code: "dk" },
  { name: "Estonia", code: "ee" },
  { name: "Finland", code: "fi" },
  { name: "France", code: "fr" },
  { name: "Germany", code: "de" },
  { name: "Greece", code: "gr" },
  { name: "Hungary", code: "hu" },
  { name: "Iceland", code: "is" },
  { name: "Italy", code: "it" },
  { name: "Latvia", code: "lv" },
  { name: "Liechtenstein", code: "li" },
  { name: "Lithuania", code: "lt" },
  { name: "Luxembourg", code: "lu" },
  { name: "Malta", code: "mt" },
  { name: "Netherlands", code: "nl" },
  { name: "Norway", code: "no" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Romania", code: "ro" },
  { name: "Slovakia", code: "sk" },
  { name: "Slovenia", code: "si" },
  { name: "Spain", code: "es" },
  { name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },
];

export default function CountrySelector() {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);

  const handleCountrySelect = (countryName) => {
    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    // Preserve existing traveler count, default to 1 if not set
    const currentTravelerCount = visaState.travelers && visaState.travelers > 0 
      ? visaState.travelers 
      : 1;

    // Store the selected country and dynamic fees in Redux
    dispatch(setSelectedCountry(countryName));
    dispatch(setVisaFees(countryConfig.visaFee));
    dispatch(setInsuranceFees(countryConfig.insuranceFee));
    dispatch(setTravelers(currentTravelerCount));

    // Redirect to get-the-visa page with selected country
    router.push(
      `/get-the-visa?selectedCountry=${encodeURIComponent(countryName)}`
    );
  };

  // Filter Schengen countries based on search term
  const filteredCountries = schengenCountries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine which countries to display
  const displayedCountries = showAll
    ? filteredCountries
    : filteredCountries.slice(0, 12);

  return (
    <div className="flex flex-col items-center space-y-6 mt-8">
      {/* Search Bar */}
      <div className="w-full">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Schengen countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-lg border border-[#423577] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-white"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Schengen Countries Grid */}
      <div className="w-full">
        <div className="flex items-center flex-wrap gap-4">
          {displayedCountries.length > 0 ? (
            displayedCountries.map((country) => (
              <motion.div
                // whileHover={{ scale: 1.05 }}
                key={country.code}
                onClick={() => handleCountrySelect(country.name)}
                className="flex items-center px-4 py-2 w-fit rounded-full border border-[#423577] cursor-pointer transition-all gap-2"
              >
                <img
                  src={`https://flagcdn.com/w80/${country.code}.png`}
                  alt={country.name}
                  className="w-5 object-cover"
                />
                <span className="font-semibold text-center text-white/90">
                  {country.name}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              No Schengen countries found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Show More/Less Button */}
      <div className="flex justify-center mt-6">
        {!searchTerm && filteredCountries.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 pr-3 text-sm cursor-pointer py-2 rounded-full border border-[#423577] transition-all flex items-center gap-2"
          >
            {showAll ? (
              <>
                <span>Less</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </>
            ) : (
              <>
                <span>More</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
