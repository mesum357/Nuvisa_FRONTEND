import React from "react";
import { X, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CircleX } from "lucide-react";

const ComparisonSection = () => {
  const leftItems = [
    "£250-£300 + extra fees",
    "Traditional, often heavy-paperwork",
    "Appointment in 6-8 weeks",
    "Application business hours only",
    "In-person or lengthy phone appointments",
  ];

  const rightItems = [
    "Flat £200 - no hidden fees",
    "AI powered seamless process",
    "Appointment in 10 days or less",
    "24/7 instant submission & tracking",
    "Complete digital experience",
  ];

  return (
    <div className="bg-gradient-to-br w-full from-purple-100 to-[#f3e6ff] py-20 px-6">
      <div className="max-w-[800px] mx-auto">
        <div className="flex justify-between items-center">
          <div className="w-full items-center justify-center flex">
            <p className="text-3xl font-gilroy-bold text-black">
              Travel Agency
            </p>
          </div>
          <div className="text-[#7350FF] text-3xl md:text-4xl w-full items-center justify-center flex">
            <Link href="/" className="">
              <Image
                src="/image/logo.png"
                alt="Icon"
                width={200}
                height={92}
                className="object-contain"
              />{" "}
            </Link>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 relative">
          {/* Travel Agency Side */}
          <div className=" rounded-3xl flex flex-col items-center gap-3 ">
            <div className="max-md:aspect-square w-full md:h-[346px] mb-8 rounded-[30px] overflow-hidden bg-gray-100">
              <Image
                width={384}
                height={346}
                src="/image/visa-agency.png"
                alt="Travel Agency Representative"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex justify-center bg-white p-0.5 md:p-[8px] top-[31%] rounded-full left-[44%] absolute">
            <img
              src="/image/vs.svg"
              alt=""
              className="w-12 h-12 md:w-20 md:h-20"
            />
            {/* <div className="bg-black text-white w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center text-[20px] md:text-[30px] font-extrabold shadow-lg font-gilroy-heavy !leading-none">
              VS
            </div> */}
          </div>
          {/* NUvisa Side */}
          <div className="rounded-3xl flex flex-col items-center gap-3">
            <div className="max-md:aspect-square w-full md:h-[346px] mb-8 rounded-[30px] overflow-hidden bg-gray-100">
              <img
                src="/image/nuvisa-image.jpg"
                width={384}
                height={346}
                alt="Digital Experience"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Comparison List */}
        <div className="grid grid-cols-2 gap-4">
          {/* Traditional Side */}
          <div className="flex flex-col gap-2">
            {leftItems.map((item, i) => (
              <div key={i} className="flex items-center gap-[7px]">
                {/* <div className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 text-gray-600"> */}
                <div className="size-4 md:size-6">
                  <CircleX
                    size={26}
                    strokeWidth={2}
                    className="text-gray-500 size-4 md:size-6"
                  />
                </div>
                {/* </div> */}
                <p className="text-black text-xs md:text-[18px] font-gilroy-bold !font-gilroy-bold">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* NUvisa Side */}
          <div className="flex flex-col gap-2 md:ml-6">
            {rightItems.map((item, i) => (
              <div key={i} className="flex items-start gap-[7px]">
                <div className="p-0.5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-[#6F48FF] text-white">
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="size-3 stroke-[4px]"
                  />
                </div>
                <p className="text-black text-xs md:text-[18px] font-gilroy-bold !font-gilroy-bold">
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
