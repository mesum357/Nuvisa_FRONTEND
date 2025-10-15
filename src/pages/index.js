import ComparisonSection from "@/components/ComparisonSection";
import CountryCardsSection from "@/components/CountryCardsSection";
import VisaHeroSection from "@/components/CountryRotator";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import GetTheVisaButton from "@/components/layout/GetTheVisaButton";
import Navbar from "@/components/Navbar";
import OurMission from "@/components/OurMission";
import PremiumServiceSection from "@/components/PremiumServiceSection";
import VisaSolution from "@/components/VisaSolution";
import AppDownloadPopup from "@/components/AppDownloadPopup";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const index = () => {
  return (
    <div className="w-full mx-auto h-full min-h-screen">
      <div className=" pri_bg text-white pb-[34px]">
        {/* Top Banner */}
        <Navbar />

        <main className="flex items-center justify-center flex-col pb-[45px] mt-16 md:mt-24 md:min-h-[calc(100vh-200px)]  px-8 md:px-6">
          <div className="text-left sm:text-center max-w-5xl">
            <h1 className="text-5xl sm:text-6xl md:text-[6.5rem] font-gilroy-bold leading-tight mb-4 sm:mb-8 max-sm:tracking-tighter">
              Don&apos;t Postpone Your Happiness!
              {/* <br /> */}
              {/* <span className="text-white"></span> */}
            </h1>

            <p className="text-[25px] md:text-[28px] public_text_clr font-extrabold leading-tight">
              Flat £200 fee, faster processing, dedicated support
            </p>
          </div>
          <div className="my-14 sm:mt-12 sm:mb-0 max-sm:w-full">
            <GetTheVisaButton
              btnClassName={
                "max-sm:w-full flex items-center justify-center text-xl tracking-widest"
              }
            />
          </div>
          <VisaHeroSection />
        </main>
        <CountryCardsSection />
      </div>
      <FeaturesSection />
      <VisaSolution />
      <ComparisonSection />
      <PremiumServiceSection />
      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <div className=" py-16 px-6">
          <div className="max-[1200px] mx-auto">
            <div className="bg-[#1E1E27] rounded-3xl py-12 px-10 text-center shadow-2xl">
              {/* Main Heading */}
              <h2 className="text-[26px] max-md:px-8 lg:text-[38px] font-gilroy-bold text-white mb-2 leading-tight font-gilroy-bold">
                Pay in small instalments with interest free financing!
              </h2>

              {/* Subheading with Details */}
              <div className=" flex items-center gap-2 max-md:flex-col text-white justify-center font-gilroy-medium">
                <p className="text-sm md:text-[16px] font-semibold">
                  Pay in 24 instalments with 0% interest.
                </p>
                <p className="font-gilroy-bold text-lg md:text-[20px] ">
                  <span className="">£42</span> per month |
                  <span className="mx-2">0% Interest</span> |
                  <span>No fees</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <OurMission />
        <Footer />
      </div>
      
      {/* App Download Popup */}
      <AppDownloadPopup />
    </div>
  );
};

export default index;
