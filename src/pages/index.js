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
import { ArrowUpRight, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StickyBottomBar from "@/components/StickyBottomBar";
import Reviews from "@/components/Reviews";
import VisaProcessSection from "@/components/home/VisaProcessSection";
import DiscountTicket from "@/components/DiscountTicket";

const Index = () => {
  const { heroContent, loading } = useHeroContent();
  
  const secondSectionCountries = [
    { name: "Lithuania", image: "/image/country/lithuania.jpg", bgColor: "#5f9aff" },
    { name: "Greece", image: "/image/country/Greece.jpg", bgColor: "#ff8e59" },
    { name: "Malta", image: "/image/country/Malta.jpg", bgColor: "#daee69" },
    { name: "Latvia", image: "/image/country/latvia.jpg", bgColor: "#fdfd55" },
    { name: "Luxembourg", image: "/image/country/Luxembourg.jpg", bgColor: "#ffb1ee" },
  ];

  return (
    <div className="w-full mx-auto h-full min-h-screen">
      <div className=" pri_bg text-white pb-[34px]">
        {/* Top Banner */}
        <Navbar />

        <main className="flex items-center justify-center flex-col pb-[45px] mt-4 md:min-h-[calc(100vh-200px)] px-5 md:px-6">
          <DiscountTicket loading={loading} content={heroContent} />
          <div className="relative flex flex-col items-center justify-center text-left sm:text-center max-w-[1200px] min-h-[350px] sm:min-h-[500px] w-full overflow-hidden rounded-[30px] px-4 sm:px-8 pt-3 sm:pt-8 pb-12 sm:pb-20">
            <div className="absolute inset-0 -z-0">
              <video
                className="w-full h-full object-cover scale-[1.2]"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="/video/nuvisa.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative z-10 max-w-4xl">
              <div className="hidden lg:block">
                {/* <span className="text-[28px] font-gilroy-bold">
                Schengen visa for Indians from the UK
              </span> */}
              </div>
              <h1 className="text-4xl sm:text-4xl md:text-[5.5rem] font-gilroy-bold leading-tight mb-2 max-sm:mb-2 sm:mb-8 max-sm:tracking-tighter">
                {loading ? "Don't Postpone Your Happiness!" : heroContent.title}
                {/* <br /> */}
                {/* <span className="text-white"></span> */}
              </h1>

              <p className="text-[25px] md:text-[28px] font-extrabold leading-tight">
                {loading ? (
                  "Flat £200 fee, faster processing, dedicated support"
                ) : heroContent.description?.includes("+Link+") ? (
                  heroContent.description.split(" I ").map((part, index, array) => {
                    const isLast = index === array.length - 1;
                    if (part.includes("+Link+")) {
                      const [text, url] = part.split("+Link+");
                      return (
                        <span key={index}>
                          <Link
                            href={url.trim()}
                            className="hover:underline decoration-white/50 transition-all"
                          >
                            {text.trim()}
                          </Link>
                          {!isLast && " I "}
                        </span>
                      );
                    }
                    return (
                      <span key={index}>
                        {part}
                        {!isLast && " I "}
                      </span>
                    );
                  })
                ) : (
                  heroContent.description
                )}
              </p>
            </div>
          </div>
          <div className="relative z-20 -mt-2 md:-mt-12">
            <VisaHeroSection />
          </div>
          <Reviews />
        </main>
        <CountryCardsSection />

      </div>
      {/* <ComparisonSection /> */}
      <VisaSolution />
      <div className="bg-[#1E1E27] text-white w-full overflow-x-hidden pb-16">
        <VisaProcessSection />
      </div>
      <VisaSolution 
      title="Everyday Steals"
      countriesData={secondSectionCountries}
      customColors={['#5f9aff', '#ff8e59', '#daee69', '#fdfd55', '#ffb1ee', '#daee69']} />
      <div className="bg-[#1E1E27] text-white w-full overflow-x-hidden py-16">
        <CountryCardsSection id="everyday-steals" image="/image/everyday_steals.png" />
      </div>
      {/* <FeaturesSection /> */}
      {/* <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff] text-white w-full overflow-x-hidden py-16"> */}
      <PremiumServiceSection />
      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <div className=" py-16 px-6">
          <div className="max-[1200px] mx-auto">
            <div className="bg-[#1E1E27] rounded-3xl py-12 px-10 text-center shadow-2xl border border-gray-800">
  {/* Price Guarantee Content inside Big Box */}
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="flex items-center gap-3 justify-center flex-wrap">
      <Image src={"/image/BadgeIcon.png"} width={60} height={60} alt="Badge Icon" />
      <h2 className="text-[26px] lg:text-[38px] font-gilroy-bold text-[#fff] uppercase leading-tight">
        Price match guarantee
      </h2>
      
      {/* Tooltip Icon */}
      <div className='relative group flex items-center cursor-pointer'>
        <Info size={24} className="text-gray-400 group-hover:text-[#6F48FF] transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-[#6F48FF] text-white text-[12px] font-normal leading-tight rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none">
          <p>Find it cheaper, we'll match the price</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#6F48FF]"></div>
        </div>
      </div>
    </div>

    <p className="text-gray-400 text-sm md:text-lg max-w-2xl font-gilroy-medium">
      At NUvisa, we want you to get your Schengen visa with total confidence, 
      knowing you're getting the best price in the market.
    </p>
  </div>
</div>
          </div>
        </div>
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
