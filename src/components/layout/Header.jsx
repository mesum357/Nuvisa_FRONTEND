import { Phone, ChevronDown, MessageCircle, HelpCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { logoutFunction } from "@/utils/logoutFunction";
import useParsedUser from "@/hooks/useParsedUser";
import { fetchHeaderContent, getHeaderContentByKey } from "@/api/headerContent";
import Sidebar from "@/components/Sidebar";

export const Header = ({ href }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [headerContent, setHeaderContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { parsedUserData } = useParsedUser();
  const openSidebar = () => {
    setIsDropdownOpen(false); // Close dropdown when opening sidebar
    setIsSidebarOpen(true);
  };
  const closeSidebar = () => setIsSidebarOpen(false);

  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

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

  const handleLogout = () => {
    logoutFunction();
  };

  // Helper function to get content with fallback
  const getContent = (key, fallback = '') => {
    if (loading) return '';
    return getHeaderContentByKey(headerContent, key) || '';
  };

  return (
    <div className="pri_bg text-white pb-5">
      {/* Top Promotional Banner */}
      <div className="sec_bg px-4 py-2.5 text-center border-[#423577] border-b text-sm rounded-b-[23px]">
        <span className="font-medium md:font-semibold">
          {getContent('banner_offer_text')}
        </span>
        <Link href={getContent('banner_button_link')}>
          <button className="ml-4 underline decoration-[#7351ff] public_text_clr rounded-md text-white font-medium transition-colors">
            {getContent('banner_button_text')}
          </button>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex items-center mt-5 md:mt-[36px] border-[#423577] sec_bg rounded-[70px] border justify-between px-6 lg:px-4 py-3 md:py-4 mx-[20px]">
        {/* Logo */}
        <div className="flex items-center">
          <Link href={href || "/"} className="">
            <Image
              src="/image/logo.png"
              alt="NUvisa Logo"
              width={130}
              height={20}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Tagline - Hidden on small screens */}
        <div className="hidden lg:block">
          <span className="text-[28px] font-gilroy-bold">
            {getContent('nav_tagline')}
          </span>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Help Center - Hidden on small screens */}
          <Link
            href={"/get-the-visa#faq"}
            className="hidden xl:flex items-center space-x-2 text-gray-300 hover:text-white cursor-pointer"
          >
            <HelpCircle className="size-5" />
            <span className="text-sm font-medium">Help</span>
          </Link>

          {/* WhatsApp */}
          {/* <motion.a
            
            whileHover={{ scale: 1.05 }}
            href="https://wa.me/447387667534" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-green-600/20 border border-green-500/30 rounded-full px-3 py-1.5 hover:bg-green-600/30 transition-colors"
          >
            <FaWhatsapp className="text-green-400 size-4" />
            <span className="text-sm font-medium text-gray-300 hidden md:inline">
              Chat
            </span>
          </motion.a> */}

          <a
            href="https://wa.me/447387667534"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-green-600/20 border border-green-500/30 rounded-full px-3 py-1.5 hover:bg-green-600/30 transition-colors"
          >
            <FaWhatsapp className="text-green-400 size-4" />
            <span className="text-sm font-medium text-gray-300 hidden md:inline">
              Chat
            </span>
          </a>

          {/* Phone */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="tel:+447387667534"
            className="flex items-center space-x-2 bg-[#7350FF] border border-[#7350FF]/30 rounded-full px-3 py-1.5 hover:bg-[#7350FF]/30 transition-colors"
          >
            <Phone className="size-4" />
            <span className="text-sm font-medium hidden md:inline">
              Call
            </span>
          </motion.a>

          {/* Profile Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 border border-white/30 rounded-full px-3 py-1.5 hover:border-white/50 transition-colors"
            >
              <div className="bg-[#7350FF] text-white rounded-full p-1">
                <FaUser className="size-3" />
              </div>
              <span className="text-sm font-medium text-gray-300 hidden md:inline">
                {/* {parsedUserData?.firstName || parsedUserData?.name || "User"} */}
                {parsedUserData?.name ||
                  parsedUserData?.email?.split("@")[0] ||
                  "User"}
              </span>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </motion.button>
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-[#23232b] border border-[#423577] rounded-md shadow-lg py-1 z-50"
              >
                 <div
        onClick={openSidebar}
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#1e1e27] hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-400" />
                    My Profile
                  </div>
                </div>
                <Link
                  href="/get-the-visa#faq"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#1e1e27] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="text-gray-400" size={16} />
                    Help & Support
                  </div>
                </Link>
                <div className="border-t border-[#423577] my-1"></div>
                <button
                  onClick={handleLogout}
                  className="block px-4 py-2 text-sm text-red-400 hover:bg-[#1e1e27] hover:text-red-300 cursor-pointer w-full text-left transition-colors"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
    </div>
   
  );
};
