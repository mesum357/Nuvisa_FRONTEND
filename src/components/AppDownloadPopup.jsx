"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { X } from "lucide-react";
import Link from "next/link";

const AppDownloadPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if popup has been shown in this session (not from navigation)
    const hasShownInSession = sessionStorage.getItem('nuvisa-popup-shown-session');
    
    // Only show popup on home page and if it hasn't been shown in this session
    const isHomePage = router.pathname === '/' || router.pathname === '/home';
    
    if (!hasShownInSession && isHomePage) {
      // Show popup after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
        // Mark as shown in this session to prevent showing again during navigation
        sessionStorage.setItem('nuvisa-popup-shown-session', 'true');
      }, 6000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [router.pathname]);

  const closePopup = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl max-w-2xl w-full mx-4 relative shadow-2xl overflow-hidden">
        {/* Free Gift Badge */}
        {/* <div className="absolute top-[10px] left-0 bg-lime-400 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
          Free Gift
        </div> */}

        {/* Close Button */}
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Text Content */}
          <div className="flex-1 p-8 text-white bg-[#23232B]">
            {/* Logo */}
            <div className="mb-2 self-center flex justify-center">
             <img src="/image/logo.png" alt="" className="w-[146px]" />
            </div>

            {/* Main Heading */}
            <div className="border-b border-gray-600">
              <h2 className="text-[17px]  font-bold mb-4 leading-tight text-center">
            ❤️ NEW CUSTOMER OFFER - £129 fee for your first visa with us, then £200
            </h2>

            </div>
            
            
            <p className="text-gray-300 mb-2 text-center text-[14px] mt-2">
              Limited time Offer for everyone (ends soon) - Until Jan 2026
            </p>

            {/* Free Services List */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-[14px]">Auto-booking appointment</span>
                  <div className=" flex gap-[2px] items-center">
                 <span className="line-through">£100</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Free</span>
                  </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-[14px]">Concierge Assistance</span>
                  <div className=" flex gap-[2px] items-c`enter">
                 <span className="line-through">£35</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Free</span>
                  </div>
              </div>
            </div>

            {/* Get Visa Button */}
            <Link href="/get-the-visa" className="w-full flex justify-center items-center bg-[#7350FF] text-white font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-[#6247D3]" >
              GET VISA NOW
            </Link>
          </div>

          {/* Right Side - Product Image */}
          <div className="flex-1 flex item-center justify-center  bg-[#23232B]">
            <img 
              src="/image/popupnew.png" 
              alt="Muscle Therapy Gun" 
              className=" object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadPopup;
