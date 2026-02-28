'use client'

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Image from "next/image";
import WhatsAppBadge from "./WhatsAppBadge";

const DEFAULT_SPOTS_LEFT = 12;
const SPOTS_LEFT_STORAGE_KEY = "expertSpotsLeft";
const LAST_RESET_DAY_STORAGE_KEY = "expertSpotsLastResetDayUk";

const getUkDateParts = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const getPart = (type) => parts.find((item) => item.type === type)?.value;
  const year = getPart("year") || "";
  const month = getPart("month") || "";
  const day = getPart("day") || "";
  const hour = Number(getPart("hour") || "0");

  return {
    dayKey: `${year}-${month}-${day}`,
    hour,
  };
};

const normalizeSpotsLeft = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SPOTS_LEFT;
  return Math.max(0, Math.min(DEFAULT_SPOTS_LEFT, Math.floor(parsed)));
};

const ExpertSection = ({ checked = false, onChange = () => {} }) => {
  const [spotsLeft, setSpotsLeft] = useState(DEFAULT_SPOTS_LEFT);

  useEffect(() => {
    const syncSpots = () => {
      const storedSpots = localStorage.getItem(SPOTS_LEFT_STORAGE_KEY);
      const lastResetDay = localStorage.getItem(LAST_RESET_DAY_STORAGE_KEY);
      const { dayKey, hour } = getUkDateParts();

      let nextSpots = normalizeSpotsLeft(storedSpots);
      const shouldReset = nextSpots <= 5 && hour >= 2 && lastResetDay !== dayKey;

      if (shouldReset) {
        nextSpots = DEFAULT_SPOTS_LEFT;
        localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(nextSpots));
        localStorage.setItem(LAST_RESET_DAY_STORAGE_KEY, dayKey);
      } else if (storedSpots === null) {
        localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(nextSpots));
      }

      setSpotsLeft(nextSpots);
    };

    syncSpots();
    const intervalId = setInterval(syncSpots, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section
      className={`w-full mt-4 rounded-2xl overflow-hidden border bg-white/5 text-white transition-colors duration-300 ${
        checked ? "border-[#7350FF]" : "border-white/15"
      }`}
    >
      <div className="border-b border-white/10 bg-black/80 px-4 py-2 max-sm:px-3">
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lime-400" />
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
                <span className="block">Unlock Your Visa Success with</span>
                <span className="block">Unlimited Access to a <WhatsAppBadge /></span>
                <span className="block">Accountability Expert</span>
              </h3>

              <div className="mt-6 flex items-center gap-3 max-sm:gap-2 whitespace-nowrap max-sm:flex-wrap">
                <span className="text-white/50 line-through text-base max-sm:text-sm whitespace-nowrap">
                  £35/ Month
                </span>
                <span className="text-base leading-none font-gilroy-bold max-sm:text-sm whitespace-nowrap">
                  Free
                </span>
                <span className="text-base text-white/75 max-sm:text-sm whitespace-nowrap max-sm:basis-full">
                  with next 100 visa applications!
                </span>
              </div>
            </label>
          </div>

          <div className="absolute right-0 max-sm:-right-9 bottom-0 w-40 h-40 max-sm:w-32 max-sm:h-32 shrink-0">
            <Image
              src="/image/expert.png"
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