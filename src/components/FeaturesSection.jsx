import React, { useState, useEffect, useRef } from "react";
import { Check, Gavel } from "lucide-react";
import Image from "next/image";

const FeaturesSection = () => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const sectionTop = rect.top;
        const windowHeight = window.innerHeight;

        if (sectionTop < windowHeight && sectionTop > -rect.height) {
          const scrollProgress =
            (windowHeight - sectionTop) / (windowHeight + rect.height);

          // Make it move from right to left - start from right, move to left as user scrolls
          const maxOffset = window.innerWidth / 1;
          // Start from positive (right) and move to negative (left)
          setScrollOffset(maxOffset - scrollProgress * maxOffset * 2);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={sectionRef}
      className="bg-gradient-to-br from-purple-100 to-[#f3e6ff] py-10 md:py-20 px-6 overflow-hidden"
    >
      <div className="w-full flex items-center flex-col justify-center">
        {/* Animated Heading */}
        <div className="mb-10 md:mb-16">
          <h1
            className="text-[30px] md:text-[50px] lg:text-[70px] font-extrabold leading-tight transition-transform duration-300 ease-out max-md:tracking-tight max-sm:hidden"
            style={{
              transform: `translateX(${scrollOffset}px)`,
            }}
          >
            More cash in your pocket
          </h1>
          <h1 className="text-[25px] sm:text-[39px] md:text-[55px] lg:text-[60px] font-extrabold leading-tight transition-transform duration-300 ease-out max-md:tracking-tight sm:hidden block text-center px-4">
            More cash in your pocket
          </h1>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[70rem] mx-auto ">
          {/* Left Column - Two Cards */}
          <div className="space-y-8">
            {/* Flat Fee Card */}
            <div className="bg-white backdrop-blur-sm rounded-[2.5rem] p-10 md:py-14 md:px-12 shadow-none transition-shadow duration-300">
              <div className="flex items-start gap-4 mb-2">
                <Image
                  src={"/icons/check-rectangle.svg"}
                  width={75}
                  height={75}
                  alt="Check Rectangle Icon"
                />
              </div>
              <div>
                <h3 className="text-[24px] md:text-[28px] font-gilroy-bold text-gray-800 mb-5">
                  Flat £200 fee
                </h3>
              </div>
              <p className="text-sm md:text-base md:font-medium leading-relaxed">
                No more convoluted fee or confusing conditions — enjoy flat £200
                fee on your visas.
              </p>
            </div>

            {/* Easy Process Card */}
            <div className="bg-white backdrop-blur-sm rounded-[2.5rem] p-10 md:py-14 md:px-12 shadow-none transition-shadow duration-300">
              <div className="flex items-start gap-4 mb-2">
                <Image
                  src={"/icons/easy-process.svg"}
                  width={75}
                  height={75}
                  alt="Easy Process Icon"
                />
              </div>
              <div>
                <h3 className="text-[24px] md:text-[28px] font-gilroy-bold text-gray-800 mb-5">
                  Easy Process
                </h3>
              </div>
              <p className="text-sm md:text-base md:font-medium leading-relaxed">
                Enjoy a far simpler process than dealing with foreign
                governments.
              </p>
            </div>
          </div>

          {/* Right Column - AI Powered Card */}
          <div className="flex items-center">
            <div className="bg-white backdrop-blur-sm rounded-[2.5rem] p-10 md:py-14 md:px-12 shadow-none transition-shadow duration-300 w-full">
              <Image
                src={"/icons/ai.svg"}
                width={75}
                height={75}
                alt="AI Icon"
              />
              <div>
                <h3 className="text-[24px] md:text-[28px] font-gilroy-bold text-gray-800 mb-5 mt-5 md:mt-2">
                  Powered by AI
                </h3>
              </div>
              <p className="text-sm md:text-base md:font-medium leading-relaxed">
                AI detects, organises and validates all your documents while
                maintaining human oversight at critical checkpoints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
