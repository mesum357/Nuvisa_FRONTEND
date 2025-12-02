import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import GetTheVisaButton from "./layout/GetTheVisaButton";
import { getCountryConfig } from "@/constants/countryConfig";
import { fetchAppointmentTexts } from "@/api/appointmentText";

const CountryCardsSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentTexts, setAppointmentTexts] = useState([]);
  const [sectionContent, setSectionContent] = useState({
    title: "Choose Your Country",
    description: "We support 20 countries over all the visa centres in the UK",
  });
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
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // TEMPORARILY COMMENTED OUT - Fetch appointment texts which now includes section content
      const appointmentTextsData = await fetchAppointmentTexts();
      // const appointmentTextsData = []; // Use empty array as fallback
      
    

      console.log("Frontend received appointment texts:", appointmentTextsData);

      setAppointmentTexts(
        Array.isArray(appointmentTextsData) ? appointmentTextsData : []
      );

      // Extract section content from appointment text records
      if (appointmentTextsData && appointmentTextsData.length > 0) {
        // Look for a record with section content (prefer DEFAULT record, then any record)
        const recordWithSectionContent =
          appointmentTextsData.find(
            (record) => record.sectionTitle && record.sectionDescription
          ) || appointmentTextsData[0];

        console.log("Record with section content:", recordWithSectionContent);

        const newSectionContent = {
          title: recordWithSectionContent.sectionTitle || "Choose Your Country",
          description:
            recordWithSectionContent.sectionDescription ||
            "We support 20 countries over all the visa centres in the UK",
        };

        console.log("Setting section content:", newSectionContent);
        setSectionContent(newSectionContent);
      } else {
        // Set fallback values if no data
        console.log("No appointment texts data, using fallback");
        setSectionContent({
          title: "Choose Your Country",
          description:
            "We support 20 countries over all the visa centres in the UK",
        });
      }

      setError(null);
    } catch (e) {
      console.error("Error fetching data:", e);
      setError("Failed to load data.");
      // Set fallback values on error
      setSectionContent({
        title: "Choose Your Country",
        description:
          "We support 20 countries over all the visa centres in the UK",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      await fetchData();
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const countries = [
    {
      name: "Germany",
      image: "/image/country/Germany.jpg",
      landmark: "Brandenburg Gate",
    },
    {
      name: "Netherlands",
      image: "/image/country/Netherlands.jpg",
      landmark: "Amsterdam Canal Houses",
    },
    {
      name: "Belgium",
      image: "/image/country/Belgium.jpg",
      landmark: "Atomium Brussels",
    },
    {
      name: "France",
      image: "/image/country/France.jpg",
      landmark: "Eiffel Tower",
    },
    {
      name: "Italy",
      image: "/image/country/Italy.jpg",
      landmark: "Colosseum Rome",
    },
    {
      name: "Bulgaria",
      image: "/image/country/Bulgaria.jpg",
      landmark: "Sagrada Familia",
    },
    {
      name: "Estonia",
      image: "/image/country/Estonia.jpg",
      landmark: "Tallinn Old Town",
    },
    {
      name: "Hungary",
      image: "/image/country/Hungary.jpg",
      landmark: "Parliament Building",
    },
    {
      name: "Portugal",
      image: "/image/country/Portugal.jpg",
      landmark: "Pena Palace",
    },
    {
      name: "Iceland",
      image: "/image/country/Iceland.jpg",
      landmark: "Blue Lagoon",
    },
    {
      name: "Poland",
      image: "/image/country/Poland.jpg",
      landmark: "Warsaw Old Town",
    },
    {
      name: "NORWAY",
      image: "/image/country/Norway.jpg",
      landmark: "Norwegian Fjords",
    },
    {
      name: "Switzerland",
      image: "/image/country/Switzerland.jpg",
      landmark: "Matterhorn",
    },
    {
      name: "Spain",
      image: "/image/country/Spain.jpg",
      landmark: "Sagrada Familia",
    },
    {
      name: "Malta",
      image: "/image/country/Malta.jpg",
      landmark: "Valletta Harbor",
    },
    {
      name: "Luxembourg",
      image: "/image/country/Luxembourg.jpg",
      landmark: "Grand Ducal Palace",
    },
    {
      name: "Greece",
      image: "/image/country/Greece.jpg",
      landmark: "Parthenon",
    },
    {
      name: "Finland",
      image: "/image/country/Finland.jpg",
      landmark: "Helsinki Cathedral",
    },
  ];

  const displayedCountries = useMemo(() => {
    // Create a map of appointment texts and images for quick lookup
    const appointmentTextMap = appointmentTexts.reduce((acc, item) => {
      acc[item.countryName] = {
        appointmentText: item.appointmentText,
        image: item.image || null,
      };
      return acc;
    }, {});

    // Create a map of static countries for quick lookup
    const staticCountriesMap = countries.reduce((acc, country) => {
      acc[country.name] = country;
      return acc;
    }, {});

    // Get all unique country names (from both static list and database)
    const allCountryNames = new Set([
      ...countries.map(c => c.name),
      ...appointmentTexts.map(item => item.countryName)
    ]);

    // Map all countries (static + database) with dynamic appointment text and image
    const list = Array.from(allCountryNames).map((countryName) => {
      const staticCountry = staticCountriesMap[countryName];
      const countryData = appointmentTextMap[countryName] || {};
      
      // Use image from database if available, otherwise use static image or default
      let countryImage;
      if (countryData.image) {
        // Image from database
        countryImage = countryData.image.startsWith('http') 
          ? countryData.image 
          : countryData.image.startsWith('/')
          ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL || ''}${countryData.image}`
          : countryData.image;
      } else if (staticCountry?.image) {
        // Use static image
        countryImage = staticCountry.image;
      } else {
        // Default fallback image
        countryImage = "/image/country/default.jpg";
      }

      return {
        name: countryName,
        image: countryImage,
        landmark: staticCountry?.landmark || countryName,
        visaFee: Number(getCountryConfig(countryName).visaFee),
        insuranceFee: Number(getCountryConfig(countryName).insuranceFee),
        appointmentText:
          countryData.appointmentText || "Appointment in 10 days or less",
      };
    });

    // Sort countries alphabetically
    list.sort((a, b) => a.name.localeCompare(b.name));

    return showAll ? list : list.slice(0, 6);
  }, [appointmentTexts, showAll]);

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
          support@nuvisa.co.uk do not follow the standard visa process.
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
