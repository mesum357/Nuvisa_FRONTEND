import React, { useEffect, useRef } from "react";

const VisaHeroSection = () => {
  const words = [
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

  const wordRefs = useRef([]);
  const lettersRef = useRef([]);
  const currentWord = useRef(0);

  useEffect(() => {
    // Split letters exactly like your original code
    words.forEach((word, wordIndex) => {
      const spans = wordRefs.current[wordIndex].querySelectorAll("span");
      lettersRef.current[wordIndex] = Array.from(spans);
    });

    const animateLetterOut = (cw, i) => {
      setTimeout(() => (cw[i].className = "letter out"), i * 80);
    };

    const animateLetterIn = (nw, i) => {
      setTimeout(() => (nw[i].className = "letter in"), 340 + i * 80);
    };

    const changeWord = () => {
      let cw = lettersRef.current[currentWord.current];
      let nextIndex =
        currentWord.current === words.length - 1 ? 0 : currentWord.current + 1;
      let nw = lettersRef.current[nextIndex];

      // OLD letters out
      for (let i = 0; i < cw.length; i++) {
        animateLetterOut(cw, i);
      }

      // NEW letters behind → in
      for (let i = 0; i < nw.length; i++) {
        nw[i].className = "letter behind";
        nw[0].parentElement.style.opacity = 1;
        animateLetterIn(nw, i);
      }

      currentWord.current = nextIndex;
    };

    changeWord();
    const interval = setInterval(changeWord, 2000);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <div className="flex-col flex gap-1 mt-[13px] md:mt-0 items-center justify-center">
      <style>{`
        .highlight-animation-top {
    position: relative;
    height: 1em;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .highlight-animation-word {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    white-space: nowrap;
  }

  .letter {
    display: inline-block;
    position: relative;
    opacity: 0;
    transform: translateY(0);
    transition: transform 0.5s ease, opacity 0.5s ease;
  }

  .letter.behind {
    opacity: 0;
    transform: translateY(-30px);
  }

  .letter.out {
    opacity: 0;
    transform: translateY(27px);
  }

  .letter.in {
    opacity: 1;
    transform: translateY(0);
  }
      `}</style>

      <h1 className="text-[40px] whitespace-nowrap uppercase md:text-[60px] font-gilroy-bold">
        <div className="highlight-animation-top">
          {words.map((word, index) => (
            <div
              key={index}
              className="highlight-animation-word"
              ref={(el) => (wordRefs.current[index] = el)}
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              {word.split("").map((letter, i) => (
                <span key={i} className="letter">
                  {letter}
                </span>
              ))}
            </div>
          ))}
        </div>
      </h1>
    </div>
  );
};

export default VisaHeroSection;
