import { Phone, ChevronDown, MessageCircle, HelpCircle } from "lucide-react";
import React, { useState } from "react";
import { FaUser, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { logoutFunction } from "@/utils/logoutFunction";
import useParsedUser from "@/hooks/useParsedUser";

export const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { parsedUserData } = useParsedUser();

  const handleLogout = () => {
    logoutFunction();
  };
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 md:px-8 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="bg-[#7350FF] text-white rounded-lg p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              <path
                fillRule="evenodd"
                d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-[#7350FF] text-2xl md:text-3xl font-extrabold">
            NUvisa
          </h1>
        </motion.div>

        {/* Contact Info & Profile */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Help Center */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-[#7350FF] cursor-pointer"
          >
            <HelpCircle className="size-5" />
            <span className="text-sm font-medium">Help Center</span>
          </motion.div>

          {/* WhatsApp */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="https://wa.me/9417251840"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-green-50 rounded-full px-3 py-1.5 hover:bg-green-100 transition-colors"
          >
            <FaWhatsapp className="text-green-500 size-5" />
            <span className="text-sm font-medium text-gray-700 hidden md:inline">
              Chat with us
            </span>
          </motion.a>

          {/* Phone */}
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="tel:9417251840"
            className="flex items-center space-x-2 bg-purple-50 rounded-full px-3 py-1.5 hover:bg-purple-100 transition-colors"
          >
            <Phone className="size-5 text-[#7350FF]" />
            <span className="text-sm font-medium text-gray-700 hidden md:inline">
              9417251840
            </span>
          </motion.a>

          {/* Profile Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1.5 hover:bg-gray-100 transition-colors"
            >
              <div className="bg-[#7350FF] text-white rounded-full p-1">
                <FaUser className="size-4" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:inline">
                {parsedUserData?.name ||
                  parsedUserData?.email?.split("@")[0] ||
                  "User"}
              </span>
              <ChevronDown
                className={`size-4 text-gray-500 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </motion.button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
              >
                <a
                  href="/my-profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-500" />
                    My Profile
                  </div>
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {/* <div className="flex items-center gap-2">
                    <MessageCircle className="text-gray-500" size={16} />
                    Messages
                  </div> */}
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="text-gray-500" size={16} />
                    Help & Support
                  </div>
                </a>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer w-full"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
