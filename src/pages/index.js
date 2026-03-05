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
import { ArrowUpRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StickyBottomBar from "@/components/StickyBottomBar";
import Reviews from "@/components/Reviews";
import VisaProcessSection from "@/components/home/VisaProcessSection";

const Index = () => {
  const { heroContent, loading } = useHeroContent();
  const { klarnaContent, loading: klarnaLoading } = useKlarnaContent();

  return (
    <div className="w-full mx-auto h-full min-h-screen">
      <div className=" pri_bg text-white pb-[34px]">
        {/* Top Banner */}
        <Navbar />

        <main className="flex items-center justify-center flex-col pb-[45px] mt-16 md:mt-24 md:min-h-[calc(100vh-200px)]  px-8 md:px-6">
          <div className="w-full max-w-5xl text-left">
            {/* Student badge: first line, left-aligned, clickable (same as Mars The Label promo link) */}
            <div className="mb-5 sm:mb-6">
              <Link
                href={heroContent.ctaLink || "/get-the-visa"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white font-gilroy-medium text-sm sm:text-base tracking-wide hover:bg-white/15 hover:border-white/30 transition-colors duration-200 no-underline"
                aria-label="Student discount - Get 10% off"
              >
                <GraduationCap className="w-5 h-5 flex-shrink-0 text-[#a78bfa]" aria-hidden />
                {loading ? "Students! Get 10% off" : heroContent.studentBadgeText}
              </Link>
            </div>
            {/* Headline + description */}
            <h1 className="text-4xl sm:text-4xl md:text-[4.5rem] font-gilroy-bold leading-tight mb-2 max-sm:mb-2 sm:mb-8 max-sm:tracking-tighter">
              {loading ? "Don't Postpone Your Happiness!" : heroContent.title}
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
          <Reviews />
        </main>
        <CountryCardsSection />

      </div>
      <ComparisonSection />
      <VisaSolution />
      <FeaturesSection />
      <PremiumServiceSection />
      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <div className=" py-16 px-6">
          <div className="max-[1200px] mx-auto">
            <div className="bg-[#1E1E27] rounded-3xl py-12 px-10 text-center shadow-2xl">
              {/* Main Heading */}
              <h2 className="text-[26px] flex-wrap max-md:px-8 lg:text-[38px] font-gilroy-bold text-[#fff] mb-2 leading-tight flex items-center gap-3 justify-center">
                <img src="/icons/klarna.png" alt="Klarna" className="" />
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
      </div>
      <div className="bg-[#1E1E27] text-white w-full overflow-x-hidden pb-16">
        <VisaProcessSection />
      </div>
      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <OurMission />
        <Footer />
      </div>
      <StickyBottomBar key={'index-page'} />
      {/* App Download Popup */}
      <AppDownloadPopup />
    </div>
  );
};

export default Index;
