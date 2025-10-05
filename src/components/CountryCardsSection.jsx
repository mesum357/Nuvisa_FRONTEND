import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import GetTheVisaButton from "./layout/GetTheVisaButton";
import { getCountryConfig } from "@/constants/countryConfig";

const CountryCardsSection = () => {
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleCountrySelect = (countryName) => {
    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    // Store the selected country and dynamic fees in Redux
    dispatch(setSelectedCountry(String(countryName)));
    dispatch(setVisaFees(Number(countryConfig.visaFee)));
    dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
    dispatch(setTravelers(Number(1)));

    // Redirect to checkout with dynamic country information
    router.push(
      `/get-the-visa?selectedCountry=${encodeURIComponent(
        countryName
      )}&visaFees=${countryConfig.visaFee}&insuranceFees=${countryConfig.insuranceFee
      }&travelers=1`
    );
  };

  const countries = [
    {
      name: "Germany",
      image:
        "/image/country/Germany.jpg",
      landmark: "Brandenburg Gate",
    },
    {
      name: "Netherlands",
      image:
        "/image/country/Netherlands.jpg",
      landmark: "Amsterdam Canal Houses",
    },
    {
      name: "Belgium",
      image:
        "/image/country/Belgium.jpg",
      landmark: "Atomium Brussels",
    },
    {
      name: "France",
      image:
        "/image/country/France.jpg",
      landmark: "Eiffel Tower",
    },
    {
      name: "Italy",
      image:
        "/image/country/Italy.jpg",
      landmark: "Colosseum Rome",
    },
    {
      name: "Bulgaria",
      image:
        "/image/country/Bulgaria.jpg",
      landmark: "Sagrada Familia",
    },
    {
      name: "Estonia",
      image:
        "/image/country/Estonia.jpg",
      landmark: "Tallinn Old Town",
    },
    {
      name: "Hungary",
      image:
        "/image/country/Hungary.jpg",
      landmark: "Parliament Building",
    },
    {
      name: "Portugal",
      image:
        "/image/country/Portugal.jpg",
      landmark: "Pena Palace",
    },
    {
      name: "Iceland",
      image:
        "/image/country/Iceland.jpg",
      landmark: "Blue Lagoon",
    },
    {
      name: "Poland",
      image:
        "/image/country/Poland.jpg",
      landmark: "Warsaw Old Town",
    },
    {
      name: "NORWAY",
      image:
        "/image/country/Norway.jpg",
      landmark: "Norwegian Fjords",
    },
  ];

  const displayedCountries = showAll ? countries : countries.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedCountries.map((country, index) => (
          <div
            key={index}
            onClick={() => handleCountrySelect(country.name)}
            className="group relative bg-[#18181e] rounded-xl transform hover:shadow-[0_0_15px_#3ed1ff] transition-shadow duration-300 cursor-pointer"
          >
            {/* Country Image */}
            <div className="relative h-[200px] rounded-t-xl overflow-hidden">
              <img
                src={country.image}
                alt={country.landmark}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>


            </div>

            {/* Card Content */}
            <div className="p-3">
              <div className="mb-4 text-sm md:text-base font-medium text-white">
                {country.name.toUpperCase()}
              </div>

              <div className="text-sm md:text-base font-medium text-white">
                Appointment in 10 days or less
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See More Button */}
      {!showAll && (
        <div className="text-center mt-12">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            See More
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Show Less Button (when expanded) */}
      {showAll && (
        <div className="text-center mt-12">
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-2 bg-gray-700 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-600 transition-colors duration-300"
          >
            Show Less
            <ChevronDown className="w-5 h-5 rotate-180" />
          </button>
        </div>
      )}

      <div className="my-14 sm:mt-12 sm:mb-0 max-sm:w-full flex items-center justify-center flex-col gap-10">
        <p className="text-[18px] mt-3 text-white font-gilroy-bold">
          *If require urgent appointment in 4-5 days kindly email
          info@nuvisa.co.uk do not follow the standard visa process.
        </p>
        <GetTheVisaButton
          btnClassName={
            "max-sm:w-full flex items-center justify-center text-xl tracking-widest"
          }
        />
      </div>
    </div>
  );
};

export default CountryCardsSection;
