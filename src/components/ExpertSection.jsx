'use client'

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import WhatsAppBadge from "./WhatsAppBadge";
import { expertSpotsConstants, syncExpertSpots, setExpertSpotsDefaultFromApi } from "@/utils/expertSpots";
import { getExpertSection } from "@/api/expertSection";

const { DEFAULT_SPOTS_LEFT } = expertSpotsConstants;

// Hardcoded defaults used as fallback while loading or on error
const DEFAULTS = {
  titleLine1: "Unlock Your Visa Success with",
  titleLine2: "Unlimited Access to a",
  titleLine3: "Accountability Expert",
  originalPrice: "£35/ Month",
  offerPrice: "Free",
  offerDescription: "with next 100 visa applications!",
  expertImage: "/image/expert.png",
  defaultSpotsLeft: DEFAULT_SPOTS_LEFT,
};

const ExpertSection = ({ checked = false, onChange = () => {} }) => {
  const [spotsLeft, setSpotsLeft] = useState(DEFAULT_SPOTS_LEFT);
  const [content, setContent] = useState(DEFAULTS);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch dynamic content from API
    getExpertSection()
      .then((response) => {
        const data = response?.data;
        if (data && typeof data === "object" && data.id) {
          // If the section is inactive from the admin, hide it
          if (data.isActive === false) {
            setIsVisible(false);
            return;
          }

          setContent({
            titleLine1: data.titleLine1 || DEFAULTS.titleLine1,
            titleLine2: data.titleLine2 || DEFAULTS.titleLine2,
            titleLine3: data.titleLine3 || DEFAULTS.titleLine3,
            originalPrice: data.originalPrice || DEFAULTS.originalPrice,
            offerPrice: data.offerPrice || DEFAULTS.offerPrice,
            offerDescription: data.offerDescription || DEFAULTS.offerDescription,
            expertImage: data.expertImage || DEFAULTS.expertImage,
            defaultSpotsLeft: data.defaultSpotsLeft ?? DEFAULTS.defaultSpotsLeft,
          });

          // Update the spots counter with the DB value
          if (data.defaultSpotsLeft != null) {
            const synced = setExpertSpotsDefaultFromApi(data.defaultSpotsLeft);
            setSpotsLeft(synced);
          }
        }
      })
      .catch(() => {
        // Silently fall back to defaults
      });
  }, []);

  useEffect(() => {
    const syncSpots = () => {
      setSpotsLeft(syncExpertSpots());
    };

    syncSpots();
    const intervalId = setInterval(syncSpots, 60 * 1000);
    const onSpotsUpdated = () => syncSpots();
    window.addEventListener("expert-spots-updated", onSpotsUpdated);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("expert-spots-updated", onSpotsUpdated);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <section
      className={`w-full mt-4 rounded-2xl overflow-hidden border bg-white/5 text-white transition-colors duration-300 ${
        checked ? "border-[#7350FF]" : "border-white/15"
      }`}
    >
      <div className="border-b border-white/10 bg-[#1e1e27] px-4 py-2 max-sm:px-3">
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          <span className="text-sm font-gilroy-medium max-sm:text-xs">
            Only {spotsLeft} left
          </span>
        </div>
      </div>

      <div className="pt-4 px-4 max-sm:pt-3 max-sm:px-3">
        <div className="relative pr-40 max-sm:pr-28 min-h-36">
          <div className="flex items-start gap-3 min-h-36">
            <div className="relative mt-2 h-4 w-4 shrink-0">
              <input
                id="expert-accountability-coach"
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                aria-label="Select accountability coach add-on"
                className="peer h-4 w-4 appearance-none rounded-sm border border-gray-400 bg-white cursor-pointer checked:border-[#6B4EFF] checked:bg-[#6B4EFF]"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Check
                  className={`h-3 w-3 text-white translate-y-px transition-all duration-200 ease-out ${
                    checked ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  }`}
                  strokeWidth={2}
                />
              </span>
            </div>

            <label htmlFor="expert-accountability-coach" className="flex-1 cursor-pointer flex flex-col justify-start min-h-36">
              <h3 className="text-base leading-normal font-gilroy-bold max-sm:text-sm">
                <span className="block">{content.titleLine1}</span>
                <span className="block">{content.titleLine2} <WhatsAppBadge /></span>
                <span className="block">{content.titleLine3}</span>
              </h3>

              <div className="mt-6 flex items-center gap-3 max-sm:gap-2 whitespace-nowrap max-sm:flex-wrap">
                <span className="text-white/50 line-through text-base max-sm:text-sm whitespace-nowrap">
                  {content.originalPrice}
                </span>
                <span className="text-base leading-none font-gilroy-bold max-sm:text-sm whitespace-nowrap">
                  {content.offerPrice}
                </span>
                <span className="text-base text-white/75 max-sm:text-sm whitespace-nowrap max-sm:basis-full">
                  {content.offerDescription}
                </span>
              </div>
            </label>
          </div>

          <div className="absolute right-0 max-sm:-right-9 bottom-0 w-40 h-40 max-sm:w-32 max-sm:h-32 shrink-0">
            <Image
              src={content.expertImage}
              alt="Expert coach"
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertSection;
