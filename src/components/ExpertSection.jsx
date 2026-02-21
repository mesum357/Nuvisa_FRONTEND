import { Check, CircleHelp } from "lucide-react";
import Image from "next/image";
import WhatsAppBadge from "./WhatsAppBadge";

const ExpertSection = () => {
  return (
    <section className="w-full mt-4 rounded-2xl overflow-hidden border border-white/15 bg-[#171A20] text-white">
      <div className="w-full bg-black/70 px-4 py-2 flex items-center justify-center text-sm font-semibold">
        <span className="h-2.5 w-2.5 rounded-full bg-[#6B4EFF] mr-2"></span>
        <span>Only 19 spots left</span>
      </div>

      <div className="p-4 max-sm:p-3">
        <div className="relative pr-30 max-md:pr-0">
          <div className="flex items-start gap-4">
            <div className="relative mt-1 h-6 w-6 shrink-0">
              <input
                id="expert-accountability-coach"
                type="checkbox"
                aria-label="Select accountability coach add-on"
                className="peer h-6 w-6 appearance-none rounded-md border border-white/25 bg-transparent cursor-pointer transition-all duration-200 checked:border-[#6B4EFF] checked:bg-[#6B4EFF]"
              />
              <Check className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white opacity-0 scale-50 transition-all duration-200 ease-out peer-checked:opacity-100 peer-checked:scale-100" />
            </div>

            <label htmlFor="expert-accountability-coach" className="flex-1 cursor-pointer">
              <h3 className="text-md leading-tight font-gilroy-bold max-sm:text-base">
                Guarantee Your Results with Unlimited Access to a <WhatsAppBadge /> Accountability Coach
              </h3>

              <p className="mt-3 text-base text-white/85 max-sm:text-sm">
                95% of users achieve better results with a diet, nutrition +
                accountability coach
              </p>

              <div className="my-3 flex items-center gap-3 max-sm:gap-2">
                <span className="text-white/50 line-through text-base max-sm:text-sm">
                  £299/year
                </span>
                <span className="text-base leading-none font-gilroy-bold max-sm:text-sm">
                  £149
                </span>
                <span className="text-base text-white/75 max-sm:text-sm">
                  12 month access
                </span>
              </div>
            </label>
          </div>

          <div className="absolute right-0 bottom-0 w-30 h-36 shrink-0 max-md:hidden">
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

        <hr className="border-t border-t-gray-400/70 border-solid" />

        <div className="pt-3 flex items-center justify-center">
          <button
            type="button"
            className="flex items-center gap-2 text-sm underline text-white/85 hover:text-white transition-colors"
          >
            <CircleHelp className="w-4 h-4 text-white/70" />
            Learn what&apos;s included
          </button>
        </div>
      </div>
    </section>
  );
};

export default ExpertSection;