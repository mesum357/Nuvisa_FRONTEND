'use client'

import { Check } from "lucide-react";
import Image from "next/image";
import WhatsAppBadge from "./WhatsAppBadge";

const ExpertSection = ({ checked = false, onChange = () => {} }) => {

  return (
    <section
      className={`w-full mt-4 rounded-2xl overflow-hidden border bg-white/5 text-white transition-colors duration-300 ${
        checked ? "border-[#7350FF]" : "border-white/15"
      }`}
    >
      <div className="pt-4 px-4 max-sm:pt-3 max-sm:px-3">
        <div className="relative pr-30 max-md:pr-0">
          <div className="flex items-start gap-4">
            <div className="relative mt-1 h-4 w-4 shrink-0">
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

            <label htmlFor="expert-accountability-coach" className="flex-1 cursor-pointer">
              <h3 className="text-md leading-tight font-gilroy-bold max-sm:text-base">
                <span className="block">Unlock your visa success</span>
                <span className="block">with unlimited access to a <WhatsAppBadge /></span>
                <span className="block">Accountability expert.</span>
              </h3>

              <div className="my-3 flex items-center gap-3 max-sm:gap-2">
                <span className="text-white/50 line-through text-base max-sm:text-sm">
                  £35/ Month
                </span>
                <span className="text-base leading-none font-gilroy-bold max-sm:text-sm">
                  Free
                </span>
                <span className="text-base text-white/75 max-sm:text-sm">
                  3 month access
                </span>
              </div>
            </label>
          </div>

          <div className="absolute right-0 bottom-0 w-32 h-32 shrink-0 max-md:hidden">
            <Image
              src="/image/expert.png"
              alt="Expert coach"
              fill
              sizes="180px"
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