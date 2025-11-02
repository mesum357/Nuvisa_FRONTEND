import { useState, useEffect } from "react";
import { Gift, Shield } from "lucide-react";

const StickyBottomBar = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Get footer element
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : documentHeight;
      
      // Show when scrolled a little bit (200px from top)
      const hasScrolledEnough = scrollPosition > 200;
      
      // Hide when footer is visible (when scroll position + window height reaches footer)
      const isFooterVisible = scrollPosition + windowHeight >= footerTop;
      
      if (hasScrolledEnough && !isFooterVisible) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-purple-200 shadow-2xl animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Digital Gift Card Option */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">NUvisa Digital Gift Card</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Give the gift of unforgettable memories this Christmas! Order now and your digital gift card will be sent to your email address immediately.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-medium">Auto-booking appointment</span>
                    <span className="text-gray-500">(In 10 days or less)</span>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    £100 Free
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Certificate Option */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">Insurance Certificate</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Protect your travel investment with comprehensive coverage. Get peace of mind for your visa application process.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600 font-medium">Concierge assistance</span>
                    <span className="text-gray-500">(Keeping your financials risk-free)</span>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    £35 Free
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default StickyBottomBar;
