"use client";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GetTheVisaButton from "./layout/GetTheVisaButton";

const OurMission = ({ className }) => {
  const pathname = usePathname();

  const buttonText = pathname === "/get-the-visa" ? "Get The Visa" : "Check Required Documents";
  const targetHref = pathname === "/get-the-visa"
    ? "/get-the-visa"
    : "/get-the-visa#required-documents";

  return (
    <div
      id="our-mission"
      className={`relative flex flex-col items-center justify-center w-full overflow-hidden ${className}`}
    >
      {/* Top Section */}
      <div className="relative z-10 max-w-[1200px] w-full px-6 pt-0 md:pt-20 pb-8">
        <p className="text-2xl font-medium text-[#29003D] mb-4">Our vision:</p>
        <h1 className="text-[28px] lg:text-[32px] font-gilroy-bold mb-8 leading-tight text-[#29003D]">
          We believe quality travel can elevate your life.
        </h1>
        <p className="text-[14px] text-[#29003D] font-gilroy-bold text-left md:text-right max-w-md ml-auto">
          - Especially when they’re transparent & affordably priced.
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
      {/* <div className="relative z-10 text-center pb-5 md:pb-10">
        <h2 className="text-5xl max-md:tracking-tighter text-[#29003D]  md:text-6xl lg:text-8xl font-gilroy-bold leading-tight">
          Visa Process,
          <br />
          <span className="">Supercharged.</span>
        </h2>
      </div> */}

      <div className="mb-10 md:mb-20">
        <Link href={targetHref}>
          <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
            <span className="mr-3 text-md md:text-2xl uppercase">{buttonText}</span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>
        </Link>
      </div>

      <div className="w-full max-w-8xl px-6 md:px-20 pb-10 md:pb-20">
        <div className="w-full overflow-hidden">
          <div className="flex flex-col md:flex-row md:justify-around items-center">
             <div className="md:w-[38%] w-full py-8 md:px-10 md:py-10 flex flex-col items-center justify-center gap-6">
              <p className="text-[#29003D] text-center text-2xl md:text-3xl font-gilroy-bold leading-tight">
                You&apos;re this close getting your Schengen visa and going on holiday
              </p>
              <GetTheVisaButton btnClassName="tracking-[0.04em]" />
            </div>
            <div className="md:w-[32%] max-w-md w-full relative min-h-[470px] md:min-h-[510px] max-h-[550px] rounded-2xl overflow-hidden">
              <Image
                src="/image/supercharged.png"
                alt="Supercharged Schengen visa support"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 42vw"
              />
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurMission;