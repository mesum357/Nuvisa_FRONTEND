"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

const AppDownloadPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl max-w-2xl w-full mx-4 relative shadow-2xl overflow-hidden">
        {/* Free Gift Badge */}
        <div className="absolute top-[10px] left-0 bg-lime-400 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
          Free Gift
        </div>

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
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-wider">NuVisa</h1>
            </div>

            {/* Main Heading */}
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
              Get your visa processed faster with our premium service worth £100 for free
            </h2>
            
            <p className="text-gray-300 mb-6">
              Ends soon!
            </p>

            {/* Free Services List */}
            <div className="mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Express Appointment</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-lg">Concierge Assistance</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Free</span>
              </div>
            </div>

            {/* Get Visa Button */}
            <button className="w-full flex justify-center items-center bg-[#7350FF] text-white font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-[#6247D3]">
              GET THE VISA
            </button>
          </div>

          {/* Right Side - Product Image */}
          <div className="flex-1 flex items-center justify-center p-8 bg-[#23232B]">
            <img 
              src="/image/calendar.jpg" 
              alt="Muscle Therapy Gun" 
              className="max-w-full max-h-80 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadPopup;
