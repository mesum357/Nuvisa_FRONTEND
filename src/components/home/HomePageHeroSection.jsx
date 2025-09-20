import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const HomePageHeroSection = () => {
  return (
    <section className="bg-gradient-to-r w-full mx-auto from-[#7350FF] to-purple-800 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 inline-flex items-center">
              <span className="text-sm font-semibold">NEW CUSTOMER OFFER</span>
              <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-purple-900 rounded-full text-xs font-gilroy-bold">
                £158
              </span>
              <span className="text-xs ml-1">for first visa</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-gilroy-bold leading-tight">
              Schengen visa for Indians from the UK
            </h1>

            <p className="text-lg text-purple-100">
              Don't Postpone Your Happiness!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href={"/get-the-visa"}>
                <span className="bg-white text-[#6247D3] hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl">
                  Get the Visa <ArrowRight className="ml-2" size={18} />
                </span>
              </Link>
              <Link
                href="/login"
                className="border-2 border-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-300"
              >
                Login
              </Link>
            </div>
          </motion.div>

          {/* Right content - pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-2xl p-6 text-gray-800 max-w-md ml-auto"
          >
            <div className="space-y-4">
              <h3 className="text-xl font-gilroy-bold text-purple-800">
                Why Choose Us?
              </h3>

              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg text-[#7350FF] mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Flat £200 fee</h4>
                  <p className="text-sm text-gray-600">No hidden charges</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg text-[#7350FF] mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Faster processing</h4>
                  <p className="text-sm text-gray-600">Get your visa quickly</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-lg text-[#7350FF] mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Dedicated support</h4>
                  <p className="text-sm text-gray-600">We're here to help</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomePageHeroSection;
