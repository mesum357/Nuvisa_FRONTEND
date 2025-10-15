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
    <div className="fixed inset-0 bg-transparent bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get the NUvisa app
          </h2>
          
          <p className="text-gray-600 mb-6">
            Download our app for faster visa processing and better experience
          </p>

          {/* Image instead of QR code */}
          <div className="mb-6 flex justify-center">
            <img 
              src="/image/nuvisa-image.jpg" 
              alt="NUvisa App" 
              className="w-48 h-32 object-cover rounded-lg shadow-md"
            />
          </div>

          <p className="text-gray-700 mb-6">
            or get a download link via SMS
          </p>

          {/* Phone Number Input */}
          <div className="flex gap-2 mb-4">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <img 
                src="https://flagcdn.com/w20/gb.png" 
                alt="UK Flag" 
                className="w-5 h-3 mr-2"
              />
              <span className="text-gray-700">+44</span>
            </div>
            <input
              type="tel"
              placeholder="Mobile number"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors">
              →
            </button>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 justify-center">
            <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
           
             Get The Nu-visa
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadPopup;
