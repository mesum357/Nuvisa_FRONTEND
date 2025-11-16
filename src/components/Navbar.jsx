import GetTheVisaButton from "@/components/layout/GetTheVisaButton";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store";
import ClientOnly from "./ClientOnly";
import { FaEnvelope, FaWhatsapp, FaBars, FaTimes } from "react-icons/fa";

import { useState, useEffect } from "react";
import { fetchHeaderContent, getHeaderContentByKey } from "@/api/headerContent";

const Navbar = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.authState);
  const [headerContent, setHeaderContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadHeaderContent = async () => {
      try {
        setLoading(true);
        const content = await fetchHeaderContent();
        setHeaderContent(content);
      } catch (error) {
        console.error('Failed to load header content:', error);
        setHeaderContent([]);
      } finally {
        setLoading(false);
      }
    };

    loadHeaderContent();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    if (isMenuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  // Helper function to get content with fallback
  const getContent = (key, fallback = '') => {
    if (loading) return fallback;
    return getHeaderContentByKey(headerContent, key) || fallback;
  };

  return (
    <ClientOnly>
      <div className="text-white">
        <div className="sec_bg md:px-10 px-5  py-2.5 border-[#423577] border-b text-sm rounded-b-[23px] flex md:flex-row flex-col items-center justify-between">

          {/* Left Content (Text + Button aligned LEFT) */}
          <div className="flex items-center gap-3 md:flex-row   ">
            <span className="font-medium md:text-start text-center md:font-semibold md:text-base text-sm">
              {getContent('banner_offer_text', ' NEW CUSTOMER OFFER - £20 fee for your first visa with us, then £200')}

 <Link href={getContent('banner_button_link', '#')}>
              <span className="underline decoration-[#7351ff] public_text_clr ml-2 rounded-md text-white font-medium transition-colors">
                {getContent('banner_button_text', 'Get now')}
              </span>
            </Link>
            </span>
           
          </div>

          {/* Right Content (WhatsApp + Email aligned RIGHT) */}
          <div className=" items-center gap-4  hidden md:flex  ">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="text-green-400 size-4" />
              <span className="text-sm font-medium text-gray-300 hidden md:inline">
                {getContent('contact_phone', '+44 7876505800')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <FaEnvelope className="size-4" />
              <span>{getContent('contact_email', 'support@nuvisa.co.uk')}</span>
            </div>
          </div>

        </div>

        <div className="text-center mt-5 md:hidden block">
          <span className="text-xl sm:text-2xl font-gilroy-bold md:block ">
            {getContent('nav_tagline', 'Schengen visa for Indians from the UK')}
          </span>
        </div>

        {/* Navigation */}
        <nav className="relative flex items-center justify-between mt-5 md:mt-[36px] border-[#423577] sec_bg rounded-[70px] border px-6 lg:px-4 py-3 md:py-4 mx-[20px]">
          {/* Left Logo */}
          <div className="flex items-center">
            <Link href="/" className="">
              <Image
                src="/image/logo.png"
                alt="Icon"
                width={130}
                height={20}
                className="object-contain"
              />
            </Link>
          </div> 

           {/* Center Text */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:block hidden">
            <span className="text-[22px] font-gilroy-bold text-center">
              {getContent('nav_tagline') || 'Schengen visa for Indians from the UK'}
            </span>
          </div>


          {/* Right Section */}
          {/* Desktop actions */}
          <div className="flex items-center gap-2 max-[1302px]:hidden">
            <div className="relative inline-block">
              {/* Coming Soon badge */}
              <span className="absolute -top-4 right-3 bg-[#c2b1eb] text-[#7A4FFF] text-[10px] font-bold px-2 py-1 rounded-full transition-all duration-300 hover:bg-[#6247D3] cursor-pointer">
                Coming Soon
              </span>

              {/* Button */}
              <div className="hidden md:block">
                <button className="bg-green-600/20 border border-green-500/30 px-4 py-[7px] rounded-full font-medium text-sm text-white flex items-center">
                  <img
                    src="/icons/holiday.png"
                    alt="Holiday Packages"
                    className="inline-block mr-2 w-8"
                  />
                  {getContent('nav_holiday_packages_text', 'Holiday Packages')}
                </button>
              </div>
            </div>

            <div className="max-sm:hidden">
              <GetTheVisaButton removeArrow={true} />
            </div>

            {isAuthenticated ? (
              <Link href="/dashboard" className="cursor-pointer">
                <button className="border border-white hover:border-neutral-500 px-[16px] py-[7px] rounded-full font-medium transition-colors cursor-pointer">
                  My Applications
                </button>
              </Link>
            ) : (
              <Link href="/dashboard" className="cursor-pointer">
                <button className="border border-white hover:border-neutral-500 px-[16px] py-[7px] rounded-full font-medium transition-colors cursor-pointer">
                  {getContent('nav_login_text', 'Login')}
                </button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger (<=1302px) */}
          <button
            aria-label="Open Menu"
            className="hidden max-[1302px]:flex items-center justify-center w-10 h-10 rounded-full border border-white/30 hover:border-white/60 transition-colors"
            onClick={() => setIsMenuOpen(true)}
          >
            <FaBars className="text-lg" />
          </button>

          {/* Slide-in bar within nav height */}
          <div
            className={`max-[1302px]:block hidden absolute left-0 right-0 top-0 z-30 overflow-visible pointer-events-none`}
          >
            <div
              className={`relative pointer-events-auto absolute left-0 top-0 w-screen sec_bg backdrop-blur-sm border-y border-white/10 flex flex-col items-start gap-3 px-4 py-3 transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
              style={{ height: 'auto' }}
            >
              {/* Close button */}
              <button
                aria-label="Close Menu"
                className="absolute right-10 top-3 w-9 h-9 rounded-full border border-white/40 hover:border-white/70 flex items-center justify-center bg-black/50"
                onClick={() => setIsMenuOpen(false)}
              >
                <FaTimes />
              </button>

              {/* Vertical actions aligned left */}
              <div className="flex flex-col items-start gap-2 w-full pr-12 py-2">
                <Link href={getContent('banner_button_link', '#')}>
                  <button className="bg-green-600/20 border border-green-500/30 px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <img src="/icons/holiday.png" alt="Holiday Packages" className="inline-block mr-2 w-6" />
                    {getContent('nav_holiday_packages_text', 'Holiday Packages')}
                  </button>
                </Link>
                <GetTheVisaButton removeArrow={true} />
                {isAuthenticated ? (
                  <Link href="/dashboard" className="cursor-pointer">
                    <button className="border border-white/60 hover:border-white px-4 py-2 rounded-full text-sm font-medium">My Applications</button>
                  </Link>
                ) : (
                  <Link href="/dashboard" className="cursor-pointer">
                    <button className="border border-white/60 hover:border-white px-4 py-2 rounded-full text-sm font-medium">{getContent('nav_login_text', 'Login')}</button>
                  </Link>
                )}
              </div>
            </div>
          </div>

        </nav>

      </div>
    </ClientOnly>
  );
};

export default Navbar;
