import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { getComparisonSection } from "@/api/comparisonSection";

const ComparisonSection = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchComparisonData = async () => {
    try {
      const response = await getComparisonSection();
      
      // Handle response structure
      if (response?.data?.status === 'success' && response?.data?.data?.results) {
        setComparisonData(response.data.data.results);
      } else if (response?.data) {
        setComparisonData(response.data);
      }
    } catch (error) {
      console.error("Error fetching comparison data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, []);


  // Fallback data if API fails or data is not available
  const defaultData = {
    title: "Travel Agency",
    leftSideTitle: "Traditional Agency",
    rightSideTitle: "NUvisa",
    leftSideImage: "/image/visa-agency.png",
    rightSideImage: "/image/nuvisa-image.jpg",
    leftSideItems: [
      "£250-£300 + extra fees",
      "Traditional, often heavy-paperwork",
      "Appointment in 6-8 weeks",
      "Application business hours only",
      "In-person or lengthy phone appointments",
    ],
    rightSideItems: [
      "Flat £250 - no hidden fees",
      "AI powered seamless process",
      "Appointment in 10 days or less",
      "24/7 instant submission & tracking",
      "Complete digital experience",
    ],
  };

  const data = defaultData;
  const leftItems = data.leftSideItems || [];
  const rightItems = data.rightSideItems || [];

  if (loading) {
    return (
      <div className="bg-gradient-to-br w-full from-purple-100 to-[#f3e6ff] py-20 px-6">
        <div className="max-w-[800px] mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br w-full from-purple-100 to-[#f3e6ff] py-20 px-6 overflow-x-hidden">
      <div className="max-w-[800px] mx-auto overflow-x-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="w-full items-center justify-center flex">
            <p className="text-[16px] md:text-[27px] font-gilroy-bold text-black">
              {data.title || "Travel Agency"}
            </p>
          </div>
          <div className="text-[#7350FF] text-3xl md:text-4xl w-full items-center justify-center flex">
            <Link href="/" className="">
              <Image
                src="/image/logo.png"
                alt="Icon"
                width={200}
                height={92}
                className="object-contain max-sm:w-32 max-sm:h-auto"
              />{" "}
            </Link>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-2 max-sm:gap-1 relative overflow-x-hidden mb-6">
          {/* Travel Agency Side */}
          <div className="rounded-3xl max-sm:rounded-2xl flex flex-col items-center gap-3">
            <div className="aspect-square w-full md:h-[335px] mb-4 max-sm:mb-2 rounded-[30px] max-sm:rounded-[20px] overflow-hidden bg-gray-100">
              <img
                src="/image/visa-agency.png"
                width={384}
                height={335}
                alt={data.leftSideTitle || "Travel Agency Representative"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex justify-center bg-white p-0.5 md:p-[8px] top-1/2 -translate-y-1/2 rounded-full absolute left-1/2 -translate-x-1/2 z-10">
            <img
              src="/image/vs.svg"
              alt=""
              className="w-8 h-8 max-sm:w-6 max-sm:h-6 md:w-20 md:h-20"
            />
          </div>
          {/* NUvisa Side */}
          <div className="rounded-3xl max-sm:rounded-2xl flex flex-col items-center gap-3">
            <div className="aspect-square w-full md:h-[346px] mb-4 max-sm:mb-2 rounded-[30px] max-sm:rounded-[20px] overflow-hidden bg-gray-100">
              <img
                src={data.rightSideImage || "/image/nuvisa-image.jpg"}
                width={384}
                height={346}
                alt={data.rightSideTitle || "Digital Experience"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Comparison List */}
        <div className="grid grid-cols-2 gap-2 max-sm:gap-1 overflow-x-hidden">
          {/* Traditional Side */}
          <div className="flex flex-col gap-2 max-sm:gap-1 pr-1">
            {leftItems.map((item, i) => (
              <div key={i} className="flex items-start gap-[4px] max-sm:gap-[2px]">
                <div className="size-3 max-sm:size-3 md:size-6 flex-shrink-0">
                  <CircleX
                    size={20}
                    strokeWidth={2}
                    className="text-gray-500 size-3 max-sm:size-3 md:size-5 mt-0.5 max-sm:mt-1"
                  />
                </div>
                <p className="text-black text-[10px] max-sm:text-[8px] md:text-[18.5px] font-gilroy-bold !font-gilroy-bold leading-tigh max-sm:mt-1">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* NUvisa Side */}
          <div className="flex flex-col gap-2 max-sm:gap-1 pl-1 md:ml-6">
            {rightItems.map((item, i) => (
              <div key={i} className="flex items-start gap-[4px] max-sm:gap-[2px]">
                <div className="p-0.5 w-4 h-4 max-sm:w-3 max-sm:h-3 md:w-5 md:h-5 flex items-center justify-center rounded-full bg-[#6F48FF] text-white flex-shrink-0 mt-1">
                  <Check
                    size={10}
                    strokeWidth={3}
                    className="size-2 max-sm:size-1.5 md:size-2 stroke-[4px]"
                  />
                </div>
                <p className="text-black text-[10px] max-sm:text-[8px] md:text-[19px] font-gilroy-bold !font-gilroy-bold leading-tight mt-1 ml-1">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSection;
