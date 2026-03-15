import React, { useState, useEffect } from "react";
import { Check, CircleX, Shield, Headphones, Zap } from "lucide-react";
import Image from "next/image";
import { getComparisonSection } from "@/api/comparisonSection";

const ComparisonSection = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchComparisonData = async () => {
    try {
      const response = await getComparisonSection();
      if (response?.data?.status === "success" && response?.data?.data?.results) {
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

  const defaultData = {
    title: "Travel Agency",
    leftSideTitle: "Traditional Agency",
    rightSideTitle: "NUvisa",
    leftSideImage: "/image/visa-agency.png",
    rightSideImage: "/image/nuvisa-image.jpg",
    leftSideItems: [
      { feature: "Price", value: "£250–£300 + extra fees" },
      { feature: "Process", value: "Traditional, often heavy-paperwork" },
      { feature: "Appointment Time", value: "Appointment in 6–8 weeks" },
      { feature: "Availability", value: "Application business hours only" },
      { feature: "Contact", value: "In-person or lengthy phone appointments" },
    ],
    rightSideItems: [
      { feature: "Price", value: "Flat £250 – no hidden fees" },
      { feature: "Process", value: "AI powered seamless process" },
      { feature: "Appointment Time", value: "Appointment in 10 days or less" },
      { feature: "Availability", value: "24/7 instant submission & tracking" },
      { feature: "Contact", value: "Complete digital experience" },
    ],
  };

  const data = comparisonData || defaultData;
  const leftItems = data?.leftSideItems || [];
  const rightItems = data?.rightSideItems || [];

  const detailBullets = [
    "Schengen visa processed in as little as 10 days",
    "Flat-fee pricing — no hidden costs or surcharges",
    "AI-powered document review reduces errors",
    "Real-time status tracking from anywhere",
    "Dedicated expert support throughout the process",
  ];

  const trustBadges = [
    { icon: <Shield size={20} strokeWidth={1.5} />, label: "SECURE DATA" },
    { icon: <Headphones size={20} strokeWidth={1.5} />, label: "EXPERT GUIDANCE" },
    { icon: <Zap size={20} strokeWidth={1.5} />, label: "FAST PROCESS" },
  ];

  if (loading) {
    return (
      <div className="w-full bg-[#f4eeff] py-20 px-6">
        <div className="max-w-[1280px] mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f4eeff] py-16 md:py-24 px-4 md:px-8 overflow-x-hidden">
      <div className="max-w-[1280px] mx-auto">

        {/*
          Single grid. Each column contains its own header + content.
          Mobile order: Beyond Compare (order-1) → Details (order-2) → Experience (order-3)
          Desktop: natural left-to-right via lg:order-*
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr_1fr] gap-y-10 lg:gap-y-0 items-start">

          {/* ===== COLUMN 1: DETAILS ===== */}
          {/* Mobile: order-2 | Desktop: col 1 */}
          <div className="flex flex-col order-2 lg:order-1 lg:pr-6 lg:border-r border-gray-200">
            {/* Header */}
            <div className="pb-4">
              {/* <p className="text-[10px] font-gilroy-bold tracking-[0.2em] uppercase text-gray-400 mb-1">
                Overview
              </p> */}
              <h3 className="text-xl md:text-2xl font-gilroy-bold text-gray-900 leading-tight tracking-tight uppercase">
                DETAILS
              </h3>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 pt-1">
              <ul className="space-y-3 flex-1">
                {detailBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-[6px] shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    <span className="text-[13px] text-gray-600 font-gilroy-medium leading-snug">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap items-center gap-5 pt-5 border-t border-gray-300">
                {trustBadges.map((badge, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-gray-500">{badge.icon}</span>
                    <p className="text-[9px] font-gilroy-bold tracking-widest text-gray-500 uppercase leading-tight">
                      {badge.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== COLUMN 2: BEYOND COMPARE ===== */}
          {/* Mobile: order-1 | Desktop: col 2 */}
          <div className="flex flex-col order-1 lg:order-2 lg:px-6 lg:border-r border-gray-200">
            {/* Header */}
            <div className="pb-4">
              <h3 className="text-xl md:text-2xl font-gilroy-bold text-gray-900 leading-tight tracking-tight uppercase">
                BEYOND COMPARE
              </h3>
            </div>

            {/* Column sub-headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-1 py-3 border-b border-gray-300">
              <div />
              <div className="flex items-center justify-start pl-1">
                <p className="text-[11px] font-gilroy-bold text-gray-500 uppercase tracking-wide leading-tight">
                  {data.leftSideTitle || "Traditional Agency"}
                </p>
              </div>
              <div className="flex items-center justify-start pl-1">
                <Image
                  src="/image/logo.png"
                  alt="NUvisa"
                  width={72}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Feature Rows */}
            <div className="flex flex-col">
              {leftItems.map((leftItem, i) => {
                const rightItem = rightItems[i] || {};
                const featureName =
                  leftItem?.feature || (typeof leftItem === "string" ? "Feature" : "");
                const leftValue =
                  leftItem?.value || (typeof leftItem === "string" ? leftItem : "");
                const rightValue =
                  rightItem?.value || (typeof rightItem === "string" ? rightItem : "");

                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_1fr] gap-1 py-[14px] border-b border-gray-200 items-start"
                  >
                    <div className="text-[9px] md:text-[10px] font-gilroy-bold text-gray-900 uppercase tracking-[0.14em] leading-snug pr-1 pt-0.5">
                      {featureName}
                    </div>
                    <div className="flex items-start gap-1.5 pl-1">
                      <div className="shrink-0 mt-0.5">
                        <CircleX size={13} strokeWidth={1.8} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-[11px] font-gilroy-medium leading-snug">
                        {leftValue}
                      </p>
                    </div>
                    <div className="flex items-start gap-1.5 pl-1">
                      <div className="shrink-0 mt-0.5 w-[15px] h-[15px] flex items-center justify-center rounded-full bg-[#6F48FF] text-white">
                        <Check size={8} strokeWidth={3} />
                      </div>
                      <p className="text-gray-900 text-[11px] font-gilroy-bold leading-snug">
                        {rightValue}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== COLUMN 3: THE EXPERIENCE ===== */}
          {/* Mobile: order-3 | Desktop: col 3 */}
          <div className="flex flex-col order-3 lg:order-3 lg:pl-6">
            {/* Header */}
            <div className="pb-4">
              <h3 className="text-xl md:text-2xl font-gilroy-bold text-gray-900 leading-tight tracking-tight uppercase">
                THE EXPERIENCE
              </h3>
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="flex flex-col gap-2">
                <div className="flex-1 rounded-xl overflow-hidden relative" style={{ minHeight: "240px" }}>
                  <img
                    src={data.leftSideImage || "/image/visa-agency.png"}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Traditional Agency"
                  />
                </div>
                <p className="text-[9px] font-gilroy-medium text-gray-500 text-center uppercase tracking-widest shrink-0">
                  {data.leftSideTitle || "Traditional Agency"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex-1 rounded-xl overflow-hidden relative border-2 border-[#6F48FF]/30" style={{ minHeight: "240px" }}>
                  <img
                    src={data.rightSideImage || "/image/nuvisa-image.jpg"}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="NUvisa"
                  />
                </div>
                <p className="text-[9px] font-gilroy-bold text-[#6F48FF] text-center uppercase tracking-widest shrink-0">
                  {data.rightSideTitle || "NUvisa"}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComparisonSection;
