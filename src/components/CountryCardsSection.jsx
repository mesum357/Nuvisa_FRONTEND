import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { ArrowUpRight } from "lucide-react";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import GetTheVisaButton from "./layout/GetTheVisaButton";
import { getCountryConfig } from "@/constants/countryConfig";
import { useCountriesWithAppointmentTexts } from "@/hooks/useCountriesWithAppointmentTexts";
import { staticCountries } from "@/constants/staticCountries";
import Link from "next/link";

const CountryCardsSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [sectionContent, setSectionContent] = useState({
    title: "Choose Your Country",
    description: "We support 20 countries over all the visa centres in the UK",
  });
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);

  // Memoize handleCountrySelect to prevent unnecessary re-renders
  const handleCountrySelect = useCallback((countryName) => {
    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    // Preserve existing traveler count, default to 0 if not set
    const currentTravelerCount = visaState.travelers !== undefined && visaState.travelers !== null
      ? visaState.travelers 
      : 0;

    // Store the selected country and dynamic fees in Redux
    dispatch(setSelectedCountry(String(countryName)));
    dispatch(setVisaFees(Number(countryConfig.visaFee)));
    dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
    dispatch(setTravelers(Number(currentTravelerCount)));

    // Redirect to checkout with dynamic country information
    router.push(
      `/get-the-visa?selectedCountry=${encodeURIComponent(
        countryName
      )}&visaFees=${countryConfig.visaFee}&insuranceFees=${
        countryConfig.insuranceFee
      }&travelers=${currentTravelerCount}`
    );
  }, [visaState.travelers, dispatch, router]);

  const {
    countries,
    appointmentTexts,
    isLoading: loading,
    error,
  } = useCountriesWithAppointmentTexts({
    staticCountries,
    fallbackAppointmentText: "Appointment in 10 days or less",
    includeFees: true,
    sortBy: "id",
    limit: 18,
  });

  useEffect(() => {
    if (appointmentTexts && appointmentTexts.length > 0) {
      const recordWithSectionContent =
        appointmentTexts.find(
          record => record.sectionTitle && record.sectionDescription
        ) || appointmentTexts[0];

      setSectionContent({
        title: recordWithSectionContent.sectionTitle || "Choose Your Country",
        description:
          recordWithSectionContent.sectionDescription ||
          "We support 20 countries over all the visa centres in the UK"
      });
      return;
    }

    if (!loading) {
      setSectionContent({
        title: "Choose Your Country",
        description:
          "We support 20 countries over all the visa centres in the UK"
      });
    }
  }, [appointmentTexts, loading]);

  const homepageCountries = countries;

  const displayedCountries = useMemo(() => {
    return showAll ? homepageCountries : homepageCountries.slice(0, 6);
  }, [homepageCountries, showAll]);

  return (
    <div className="max-w-6xl mx-auto  px-6">
      {/* Cards Grid */}
      <span className="text-4xl text-center font-gilroy-bold text-white flex item-center justify-center pb-4">
        {sectionContent.title}
      </span>
      <span className="text-3xl text-center font-gilroy text-white flex item-center justify-center pb-8">
        {sectionContent.description}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!loading &&
          !error &&
          displayedCountries.map((country, index) => (
            <div
              key={index}
              onClick={() => handleCountrySelect(country.name)}
              className="group relative bg-[#18181e] rounded-xl transform hover:shadow-[0_0_15px_#3ed1ff] transition-shadow duration-300 cursor-pointer"
            >
              {/* Country Image */}
              <div className="relative h-[200px] rounded-t-xl overflow-hidden">
                <Image
                  src={country.image}
                  alt={country.landmark}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={index < 6 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              </div>

              {/* Card Content */}
              <div className="p-3">
                <div className="mb-4 text-sm md:text-base font-medium text-white">
                  {country.name}
                </div>

                <div className="text-sm md:text-base font-medium text-white">
                  {country.appointmentText}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* See More Button */}
      {!showAll && homepageCountries.length > 6 && (
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
      {showAll && homepageCountries.length > 6 && (
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
          support@nuvisa.co.uk do not follow the standard visa process.
        </p>
        <div className="mb-10 md:mb-20">

        <Link href={"/get-the-visa#required-documents"}>
          <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
            <span className="mr-3 text-2xl">Check Required Documents</span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>
        </Link>
        {/* <GetTheVisaButton /> */}
      </div>
      </div>
    </div>
  );
};

export default CountryCardsSection;
