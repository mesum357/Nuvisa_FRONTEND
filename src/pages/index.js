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
import { useHeroContent } from "@/hooks/useHeroContent";
import { useKlarnaContent } from "@/hooks/useKlarnaContent";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StickyBottomBar from "@/components/StickyBottomBar";

const Index = () => {
  const { heroContent, loading } = useHeroContent();
  const { klarnaContent, loading: klarnaLoading } = useKlarnaContent();

  return (
    <div className="w-full mx-auto h-full min-h-screen">
      <div className=" pri_bg text-white pb-[34px]">
        {/* Top Banner */}
        <Navbar />

        <main className="flex items-center justify-center flex-col pb-[45px] mt-16 md:mt-24 md:min-h-[calc(100vh-200px)]  px-8 md:px-6">
          <div className="text-left sm:text-center max-w-5xl">

            <div className="hidden lg:block">
              {/* <span className="text-[28px] font-gilroy-bold">
              Schengen visa for Indians from the UK
            </span> */}
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-[6.5rem] font-gilroy-bold leading-tight mb-4 sm:mb-8 max-sm:tracking-tighter">
              {loading ? "Don't Postpone Your Happiness!" : heroContent.title}
              {/* <br /> */}
              {/* <span className="text-white"></span> */}
            </h1>

            <p className="text-[25px] md:text-[28px] public_text_clr font-extrabold leading-tight">
              {loading ? "Flat £200 fee, faster processing, dedicated support" : heroContent.description}
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
              <h2 className="text-[26px] max-md:px-8 lg:text-[38px] font-gilroy-bold text-[#fff] mb-2 leading-tight flex items-center gap-3 justify-center">
                <Image src="/icons/klarna.png" alt="Klarna" width={40} height={40} className="" />
                {klarnaLoading ? "Loading..." : klarnaContent.heading}
              </h2>

              {/* Subheading with Details */}
              <div className=" flex items-center gap-2 max-md:flex-col text-white justify-center font-gilroy-medium">
                <p className="text-sm md:text-[16px] font-semibold">
                  {klarnaLoading ? "Loading..." : klarnaContent.subtitle}
                </p>
                <p className="font-gilroy-bold text-lg md:text-[20px] ">
                  <span className="">{!klarnaLoading && klarnaContent.paymentAmount}</span> each |
                  <span className="mx-2">{!klarnaLoading && klarnaContent.interestRate}</span>|
                  <span> {!klarnaLoading && klarnaContent.fees}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <OurMission />
        <Footer />
      </div>
      <StickyBottomBar/>
      {/* App Download Popup */}
      <AppDownloadPopup />
    </div>
  );
};

export default Index;
