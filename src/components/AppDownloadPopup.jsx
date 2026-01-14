"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { X } from "lucide-react";
import Link from "next/link";
import SecondPopup from "@/components/SecondPopup";

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

  const [showFormPopup, setShowFormPopup] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);

  useEffect(() => {
    const completed = sessionStorage.getItem("visaFormCompleted");
    /* const data = sessionStorage.getItem("visaAnswers");
    alert(data); */
    if (completed === "true") {
      setFormCompleted(true);
    }
  }, []);

  const closePopup = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl max-w-7xl w-full mx-4 relative shadow-2xl overflow-hidden">


        {/* Close Button */}
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="flex flex-col md:flex-row  min-h-[600px] h-auto">
          {/* Right Side - Product Image */}
          <div className="flex-1 flex item-center justify-center  bg-[#23232B]">
            <img
              src="/image/popupnew.png"
              alt="Muscle Therapy Gun"
              className="object-cover"
            />
          </div>
          {/* Left Side - Text Content */}
          <div className="flex-1 p-8 text-white bg-[#23232B]">
            {/* Logo */}
            <div className="self-center flex justify-center">
              <img src="/image/logo.png" alt="" className="w-[100px] md:w-[300px]" />
            </div>

            {/* Main Heading */}
            <div className="border-b border-gray-600 mt-3 md:mt-6">
              <h2 className="text-[10px] md:text-[25px]  font-bold mb-4 leading-tight text-center">
                ❤️ NEW CUSTOMER OFFER - £129 fee for your first visa with us, then £200
              </h2>

            </div>

            {/* Free Services List */}
            <div className="space-y-3 mt-4 md:mt-9">
              <div className="flex justify-between items-center">
                <span className="text-white text-[15px] md:text-[22px]">Auto-booking appointment</span>
                <div className=" flex gap-[2px] items-center">
                  <span className="line-through font-bold">£100</span>
                  <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">Free</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-[15px] md:text-[22px]">Concierge Assistance</span>
                <div className=" flex gap-[2px] items-c`enter">
                  <span className="line-through font-bold">£35</span>
                  <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full  font-medium">Free</span>
                </div>
              </div>
            </div>


            <p className="text-gray-300 mb-5 text-center text-[15px] md:text-[28px] mt-9">
              Offer for everyone (ends soon) - Until Jan 2026
            </p>



            {/* Get Visa Button */}
            {/*  <Link href="/get-the-visa" className="w-full flex justify-center items-center bg-[#7350FF] text-white font-medium px-6 py-3 mt-4 md:mt-9 rounded-full transition-all duration-300 hover:bg-[#6247D3]" >
              GET VISA NOW
            </Link> */}
            {!formCompleted && (
              <button
                onClick={() => setShowFormPopup(true)}
                className="w-full flex justify-center items-center bg-[#7350FF] text-white px-6 py-3 mt-4 md:mt-9 rounded-full"
              >
                Continue
              </button>
            )}

            {formCompleted && (
              <Link
                href="/get-the-visa"
                className="w-full flex justify-center items-center bg-[#7350FF] text-white px-6 py-3 mt-4 md:mt-9 rounded-full"
              >
                GET VISA NOW
              </Link>
            )}
            {showFormPopup && (
              <SecondPopup
                onClose={() => setShowFormPopup(false)}
                onComplete={() => {
                  sessionStorage.setItem("visaFormCompleted", "true");
                  setFormCompleted(true);
                  setShowFormPopup(false);
                }}
              />
            )}
          </div>


        </div>
      </div>
    </div>
  );
};
export default AppDownloadPopup;
