import React, { useState, useEffect } from "react";

const VisaHeroSection = () => {
  const countries = [
    "Germany",
    "France",
    "Italy",
    "Spain",
    "Netherlands",
    "Austria",
    "Belgium",
    "Switzerland",
    "Portugal",
    "Greece",
  ];

  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentCountryIndex((prevIndex) =>
          prevIndex === countries.length - 1 ? 0 : prevIndex + 1
        );
        setIsAnimating(false);
      }, 1000);
    }, 2000);

    return () => clearInterval(interval);
  }, [countries.length]);
  return (
    <div className=" flex-col flex gap-1 mt-[13px] md:mt-0 items-center justify-center">
      <h2 className="text-[40px] whitespace-nowrap uppercase md:text-[60px] font-gilroy-bold">
        {countries[currentCountryIndex].split("").map((letter, letterIndex) => (
          <span
            key={`${currentCountryIndex}-${letterIndex}`}
            className={`inline-block transition-all duration-300 ease-out ${
              isAnimating
                ? "transform translate-y-[27px] opacity-0"
                : "transform translate-y-0 opacity-100"
            }`}
            style={{
              transitionDelay: isAnimating
                ? `${letterIndex * 100}ms`
                : `${
                    (countries[currentCountryIndex].length - letterIndex) * 120
                  }ms`,
            }}
          >
            {letter}
          </span>
        ))}
      </h2>
      {/* <p className="text-[21px] md:text-2xl mt-3 text-[#c5c6dd] font-gilroy-bold">
        We are as picky as you are
      </p> */}
    </div>
  );
};

export default VisaHeroSection;
