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

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [letters, setLetters] = useState(
    countries[0].split("").map(() => "in")
  );

  useEffect(() => {
    const animateWord = () => {
      // Animate current word out
      countries[currentWordIndex].split("").forEach((_, i) => {
        setTimeout(() => {
          setLetters(prev => {
            const copy = [...prev];
            copy[i] = "out";
            return copy;
          });
        }, i * 80);
      });

      // After out animation, switch word
      setTimeout(() => {
        const nextWordIndex =
          currentWordIndex === countries.length - 1 ? 0 : currentWordIndex + 1;
        setCurrentWordIndex(nextWordIndex);

        // Prepare next word letters
        const newWordLetters = countries[nextWordIndex]
          .split("")
          .map(() => "behind");

        setLetters(newWordLetters);

        // Animate next word letters down to in
        countries[nextWordIndex].split("").forEach((_, i) => {
          setTimeout(() => {
            setLetters(prev => {
              const copy = [...prev];
              copy[i] = "in";
              return copy;
            });
          }, i * 80);
        });
      }, countries[currentWordIndex].length * 80 + 100);
    };

    const interval = setInterval(
      animateWord,
      200 + countries[currentWordIndex].length * 100
    );

    return () => clearInterval(interval);
  }, [currentWordIndex, letters, countries]);

  return (
    <div className="flex flex-col gap-1 mt-[13px] md:mt-0 items-center justify-center relative">
      <style>
        {`
          .letter {
            display: inline-block;
            transition: all 0.3s ease;
          }
          .letter.behind {
            opacity: 0;
            transform: translateY(-10px); /* start slightly above */
          }
          .letter.out {
            opacity: 0;
            transform: translateY(10px); /* move down when leaving */
          }
       
        `}
      </style>

      <h2 className="text-[40px] md:text-[60px] font-gilroy-bold uppercase whitespace-nowrap">
        {countries[currentWordIndex].split("").map((letter, i) => (
          <span key={i} className={`letter ${letters[i]}`}>
            {letter}
          </span>
        ))}
      </h2>
    </div>
  );
};

export default VisaHeroSection;
