"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Check, CircleX, Shield, Headphones, Zap, Info } from "lucide-react";
import { getComparisonSection } from "@/api/comparisonSection";
import { useAppSelector } from "@/store";

// Portal Tooltip Component
const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const iconRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!show || !isMobile) return;
    const close = (e) => {
      if (iconRef.current && !iconRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [show, isMobile]);

  const updateCoords = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 12,
        left: rect.left + rect.width / 2,
      });
    }
  };

  return (
    <div ref={iconRef} className="relative inline-flex items-center cursor-pointer">
      <Info
        size={14}
        className="text-white/30 hover:text-white transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          if (isMobile) {
            updateCoords();
            setShow((p) => !p);
          }
        }}
        onMouseEnter={() => {
          if (!isMobile) {
            updateCoords();
            setShow(true);
          }
        }}
        onMouseLeave={() => {
          if (!isMobile) setShow(false);
        }}
      />

      {show && typeof window !== "undefined" &&
        createPortal(
          <div
            className="absolute w-56 p-2.5 bg-[#6F48FF] text-white text-[10px] font-gilroy-medium rounded-lg shadow-2xl pointer-events-none"
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 99999,
            }}
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-[#6F48FF]" />
          </div>,
          document.body
        )}
    </div>
  );
};

const ComparisonSection = () => {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const selectedCountry = useAppSelector((state) => state.visa.selectedCountry);
  const isOccasion = useAppSelector((state) => Boolean(state.visa.visaPriceDisplay?.isOccasion));
  const arrivalDate = useAppSelector((state) => state.visa.arrivalDate);
  const departureDate = useAppSelector((state) => state.visa.departureDate);

  const parseJsonField = (value) => {
    if (value == null) return null;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  };

  const normalizeComparisonPayload = (raw) => {
    if (!raw || typeof raw !== "object" || raw.error) return null;

    const parsed = {
      ...raw,
      detailSections: parseJsonField(raw.detailSections),
      comparisonColumns: parseJsonField(raw.comparisonColumns),
      comparisonRows: parseJsonField(raw.comparisonRows),
      experienceItems: parseJsonField(raw.experienceItems),
    };

    const detailSections =
      Array.isArray(parsed.detailSections) &&
      parsed.detailSections.some(
        (section) =>
          section?.title && Array.isArray(section.items) && section.items.length,
      )
        ? parsed.detailSections
            .filter(
              (section) =>
                section?.title &&
                Array.isArray(section.items) &&
                section.items.length,
            )
            .map((section) => ({
              title: section.title,
              items: section.items.filter(Boolean),
            }))
        : null;

    const comparisonColumns =
      Array.isArray(parsed.comparisonColumns) &&
      parsed.comparisonColumns.length >= 2
        ? parsed.comparisonColumns
        : null;

    const comparisonRows =
      Array.isArray(parsed.comparisonRows) && parsed.comparisonRows.length > 0
        ? parsed.comparisonRows.filter(
            (row) =>
              row?.feature &&
              Array.isArray(row.values) &&
              row.values.length >= 2,
          )
        : null;

    return {
      title: parsed.title || null,
      tooltip: parsed.tooltip ?? null,
      detailSections,
      comparisonColumns,
      comparisonRows,
      experienceType:
        parsed.experienceType === "TASKS" ? "TASKS" : "IMAGES",
      experienceItems: parsed.experienceItems,
      experienceTitle: parsed.experienceTitle || null,
      leftSideImage: parsed.leftSideImage || null,
      rightSideImage: parsed.rightSideImage || null,
      leftSideTitle: parsed.leftSideTitle || null,
      rightSideTitle: parsed.rightSideTitle || null,
    };
  };

  const fetchComparisonData = async (country, occasionEnabled, arrival, departure) => {
    try {
      setLoading(true);
      const countryName = country?.name || country || "";
      const formattedCountry = countryName.includes(",")
        ? countryName.split(", ")[1]
        : countryName;
      const response = await getComparisonSection(
        formattedCountry,
        occasionEnabled,
        arrival,
        departure,
      );

      let payload = null;
      if (
        response?.data?.status === "success" &&
        response?.data?.data?.results
      ) {
        payload = response.data.data.results;
      } else if (response?.data && !response.data.error) {
        payload = response.data;
      }

      setComparisonData(normalizeComparisonPayload(payload));
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      setComparisonData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData(selectedCountry, isOccasion, arrivalDate, departureDate);
  }, [selectedCountry, isOccasion, arrivalDate, departureDate]);

  const defaultData = {
    title: "Transparency builds trust",
    tooltip: "Competitor information gathered in March 2026; pricing is subject to change.",
    comparisonColumns: ["NUvisa", "IVISA", "SCOTT'S", "CIBT"],
    comparisonRows: [
      { feature: "Price", values: ["£169", "£295", "£395", "£475"] },
      { feature: "Savings", values: ["—", "+43%", "+57%", "+64%"] },
      {
        feature: "Average appointment time",
        values: ["10 days or less", "4-6 weeks", "4-6 weeks", "3-4 weeks"],
      },
      { feature: "Urgent appointment help", values: ["check", "x", "x", "x"] },
    ],
    detailSections: [
      {
        title: "Care & professionalism",
        items: [
          "Appointments with us are 2x faster than the industry average",
          "Real-time status tracking from anywhere",
          "Full itinerary included — flight reservations, hotel bookings, and cover letters, all in one place",
          "We prepare and verify every document so nothing gets rejected at the embassy",
          "Fast turnaround — we aim to review every application within 3 working hours",
        ],
      },
      {
        title: "Take a closer look",
        items: [
          "A criminal history may disqualify you from obtaining a visa",
          "Previous overstays or visa breaches can impact your application",
          "A passport valid for less than 3 months after your Schengen trip may affect your visa eligibility",
          "Valid and adequate travel insurance is mandatory. You can add it to your order or provide your existing policy",
        ],
      },
    ],
    experienceType: "IMAGES",
    experienceItems: null,
    experienceTitle: "THE EXPERIENCE",
    leftSideImage: "/image/visa-agency.png",
    rightSideImage: "/image/nuvisa-image.jpg",
    leftSideTitle: "Traditional Agency",
    rightSideTitle: "NUvisa",
  };

  const cmsOverrides = comparisonData
    ? Object.fromEntries(
        Object.entries(comparisonData).filter(([, value]) => value != null),
      )
    : {};

  const data = {
    ...defaultData,
    ...cmsOverrides,
  };
  const detailSections =
    Array.isArray(data.detailSections) && data.detailSections.length
      ? data.detailSections
      : defaultData.detailSections;
  const comparisonColumns =
    Array.isArray(data.comparisonColumns) && data.comparisonColumns.length >= 2
      ? data.comparisonColumns
      : defaultData.comparisonColumns;
  const comparisonRows =
    Array.isArray(data.comparisonRows) && data.comparisonRows.length
      ? data.comparisonRows
      : defaultData.comparisonRows;
  const trustBadges = [
    { icon: <Shield size={20} strokeWidth={1.5} />, label: "SECURE DATA" },
    { icon: <Headphones size={20} strokeWidth={1.5} />, label: "EXPERT GUIDANCE" },
    { icon: <Zap size={20} strokeWidth={1.5} />, label: "FAST PROCESS" },
  ];

  if (loading) {
    return (
      <div className="w-full bg-[#24242d] py-5 md:pb-32 md:pt-15 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6F48FF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#24242d] py-5 md:pb-32 md:pt-15 px-4 md:px-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr_1fr] gap-y-10 lg:gap-y-0 items-start">

          {/* Left Column */}
          <div className="flex flex-col h-full order-2 lg:order-1 lg:pr-6 lg:border-r border-white">
            <div className="flex flex-col gap-6">
              <div className="flex gap-8 border-b border-white/10 mb-2">
                {detailSections.map((section, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setActiveTab(sIdx)}
                    className={`text-sm md:text-[13px] font-gilroy-bold text-white leading-tight tracking-widest uppercase transition-all relative pb-4 ${activeTab === sIdx ? "opacity-100" : "opacity-40 hover:opacity-60"
                      }`}
                  >
                    {section.title}
                    {activeTab === sIdx && (
                      <div className="absolute -bottom-px left-0 w-full h-[2px] bg-[#6F48FF]" />
                    )}
                  </button>
                ))}
              </div>

              {detailSections[activeTab] && (
                <div className="flex flex-col min-h-[180px]">
                  <ul className="space-y-4">
                    {detailSections[activeTab].items.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-white" />
                        <span className="text-[13px] text-white/90 font-gilroy-medium leading-relaxed">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="my-6 hidden lg:flex flex-wrap justify-center items-center gap-5 pt-5 border-t border-white">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-white">{badge.icon}</span>
                  <p className="text-[9px] font-gilroy-bold tracking-widest text-white uppercase leading-tight">
                    {badge.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column */}
          <div className="flex flex-col order-1 lg:order-2 lg:px-6 lg:border-r border-white">
            <div className="pb-4 flex items-center gap-2">
              <h3 className="text-sm md:text-[13px] font-gilroy-bold font-bold text-white leading-tight tracking-tight uppercase">
                {data.title || "BEYOND COMPARE"}
              </h3>
              {data.tooltip && <Tooltip text={data.tooltip} />}
            </div>

            <div className="flex flex-col mt-4">
              <div
                className="grid border-b border-white/20 items-stretch"
                style={{ gridTemplateColumns: `1.5fr repeat(${comparisonColumns.length}, 1fr)` }}
              >
                <div className="py-4" />
                {comparisonColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-center px-4 py-4 relative ${idx === 0 ? "bg-white/5 rounded-t-2xl border-x border-t border-white/10" : ""
                      }`}
                  >
                    <p
                      className={`text-[8px] md:text-[11px] font-gilroy-bold uppercase tracking-wider text-center ${idx === 0 ? "text-[#6F48FF]" : "text-white/60"
                        }`}
                    >
                      {col}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col">
                {comparisonRows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="grid border-b border-white/10 items-stretch"
                    style={{ gridTemplateColumns: `1.5fr repeat(${comparisonColumns.length}, 1fr)` }}
                  >
                    <div className="flex items-center gap-2 pr-2 py-5">
                      <span className="text-[10px] md:text-[11px] font-gilroy-bold text-white uppercase tracking-widest">
                        {row.feature}
                      </span>
                      {row.tooltip && <Tooltip text={row.tooltip} />}
                    </div>

                    {row.values.map((val, cIdx) => {
                      const isValueBullet =
                        val.trim().toLowerCase() === "check" ||
                        val.trim() === "●" ||
                        val.trim() === "○";
                      const isValueCross =
                        val.trim().toLowerCase() === "x" ||
                        val.trim().toLowerCase() === "no";

                      return (
                        <div
                          key={cIdx}
                          className={`flex justify-center px-4 py-5 relative h-full items-center ${cIdx === 0 ? "bg-white/5 border-x border-white/10" : ""
                            } ${cIdx === 0 && rIdx === comparisonRows.length - 1
                              ? "rounded-b-2xl border-b"
                              : ""
                            }`}
                        >
                          {isValueBullet ? (
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${cIdx === 0 || val.trim() === "○" ? "bg-[#6F48FF]" : "bg-white/40"
                                }`}
                            />
                          ) : isValueCross ? (
                            <CircleX size={14} className="text-white/20" />
                          ) : (
                            <p
                              className={`text-[10px] md:text-[11px] font-gilroy-medium text-center ${cIdx === 0 ? "text-white font-gilroy-bold" : "text-white/70"
                                }`}
                            >
                              {val}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col order-3 lg:order-3 lg:pl-6">
            <div className="pb-4">
              <h3 className="text-sm md:text-[13px] font-gilroy-bold text-white leading-tight tracking-tight uppercase">
                {data.experienceTitle || "THE EXPERIENCE"}
              </h3>
            </div>

            {data.experienceType === "TASKS" && Array.isArray(data.experienceItems) ? (
              <div className="flex flex-col gap-4">
                <ul className="space-y-4">
                  {data.experienceItems.map((task, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#6F48FF]/50 transition-colors"
                    >
                      <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-white" />

                      <span className="text-[13px] text-white font-gilroy-medium leading-snug">
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="flex flex-col gap-2">
                  <div
                    className="flex-1 rounded-xl overflow-hidden relative"
                    style={{ minHeight: "240px" }}
                  >
                    <img
                      src={data.leftSideImage || "/image/visa-agency.png"}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt={data.leftSideTitle || "Traditional Agency"}
                    />
                  </div>
                  <p className="text-[9px] font-gilroy-medium text-white text-center uppercase tracking-widest shrink-0">
                    {data.leftSideTitle || "Traditional Agency"}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div
                    className="flex-1 rounded-xl overflow-hidden relative border-2 border-[#6F48FF]/30"
                    style={{ minHeight: "240px" }}
                  >
                    <img
                      src={data.rightSideImage || "/image/nuvisa-image.jpg"}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt={data.rightSideTitle || "NUvisa"}
                    />
                  </div>
                  <p className="text-[9px] font-gilroy-bold text-[#6F48FF] text-center uppercase tracking-widest shrink-0">
                    {data.rightSideTitle || "NUvisa"}
                  </p>
                </div>
              </div>
            )}

            <div className="my-6 lg:hidden flex flex-wrap justify-center items-center gap-5 pt-5 border-t border-white">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-white">{badge.icon}</span>
                  <p className="text-[9px] font-gilroy-bold tracking-widest text-white uppercase leading-tight">
                    {badge.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSection;