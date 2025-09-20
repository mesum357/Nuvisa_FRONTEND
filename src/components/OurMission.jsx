"use client";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const OurMission = ({ className }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full overflow-hidden ${className}`}
    >
      {/* Top Section */}
      <div className="relative z-10 max-w-[1200px] w-full px-6 pt-0 md:pt-20 pb-8">
        <p className="text-2xl font-medium text-[#29003D] mb-4">Our mission:</p>
        <h1 className="text-[28px] lg:text-[32px] font-gilroy-bold mb-8 leading-tight text-[#29003D]">
          Streamline your journey — Globally.
        </h1>
        <p className="text-[22px] text-[#29003D] font-gilroy-bold text-left md:text-right max-w-md ml-auto">
          — empowering customers to get more.
        </p>
      </div>

      {/* Background Image */}
      <div
        className="relative z-0 w-full max-w-5xl h-[30vh] md:h-[70vh] bg-no-repeat bg-center bg-contain"
        style={{
          backgroundImage: "url('/image/Globally.webp')",
        }}
      ></div>

      {/* Bottom Section */}
      <div className="relative z-10 text-center pb-5 md:pb-10">
        <h2 className="text-5xl max-md:tracking-tighter text-[#29003D]  md:text-6xl lg:text-8xl font-gilroy-bold leading-tight">
          Visa Process,
          <br />
          <span className="">Supercharged.</span>
        </h2>
      </div>

      <div className="mb-10 md:mb-20">
        <Link href={"/get-the-visa"}>
          <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
            <span className="mr-3 text-2xl">GET THE VISA</span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>
        </Link>
        {/* <GetTheVisaButton /> */}
      </div>
    </div>
  );
};

export default OurMission;
