import React, { useEffect, useMemo, useState } from "react";
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
import { fetchCountries } from "@/api/countries";

const CountryCardsSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countriesData, setCountriesData] = useState([]);
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
      `/visa-checkout?selectedCountry=${encodeURIComponent(
        countryName
      )}&visaFees=${countryConfig.visaFee}&insuranceFees=${countryConfig.insuranceFee
      }&travelers=1`
    );
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCountries();
        if (!active) return;
        setCountriesData(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError("Failed to load countries.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const displayedCountries = useMemo(() => {
    const list = countriesData?.map((c) => ({
      name: c?.name,
      image: c?.image,
      landmark: c?.landmark,
      visaFee: Number(c?.visaFee ?? 159),
      insuranceFee: Number(c?.insuranceFee ?? 400),
      appointmentText: c?.appointmentText || "Appointment in 10 days or less",
    })) || [];
    return showAll ? list : list.slice(0, 6);
  }, [countriesData, showAll]);

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6">
      {/* Cards Grid */}
      {loading && (
        <div className="text-center text-white py-8">Loading countries...</div>
      )}
      {error && !loading && (
        <div className="text-center text-red-400 py-8">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!loading && !error && displayedCountries.map((country, index) => (
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

              {/* Country Name Overlay */}
              <div className="absolute bottom-5 md:bottom-8 left-4">
                <h3 className="text-sm md:text-[16px] font-medium text-white drop-shadow-lg">
                  {country.name}
                </h3>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-3">
              <div className="mb-4 text-sm md:text-base font-medium text-white">
                £{country.visaFee} fee for your first visa with us
              </div>

              <div className="text-sm md:text-base font-medium text-white">
                {country.appointmentText}
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
