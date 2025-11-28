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
  const wordArray = useRef([]);
  const currentWord = useRef(0);

  useEffect(() => {
    // EXACT JS SPLIT LETTERS LOGIC
    wordArray.current = [];

    words.forEach((word, idx) => {
      const letters = [];

      const node = wordRefs.current[idx];
      const content = node.innerText;

      node.innerText = ""; // clear original word

      for (let i = 0; i < content.length; i++) {
        let span = document.createElement("span");
        span.className = "letter";
        span.innerText = content.charAt(i);
        node.appendChild(span);
        letters.push(span);
      }

      wordArray.current.push(letters);
    });

    // Show first word like original code
    wordRefs.current[0].style.opacity = 1;

    const animateLetterOut = (cw, i) => {
      setTimeout(() => {
        cw[i].className = "letter out";
      }, i * 80);
    };

    const animateLetterIn = (nw, i) => {
      setTimeout(() => {
        nw[i].className = "letter in";
      }, 340 + i * 80);
    };

    const changeWord = () => {
      let cw = wordArray.current[currentWord.current];
      let nextIndex =
        currentWord.current === wordArray.current.length - 1
          ? 0
          : currentWord.current + 1;
      let nw = wordArray.current[nextIndex];

      // OUT ANIMATION
      cw.forEach((_, i) => animateLetterOut(cw, i));

      // IN ANIMATION
      nw.forEach((letter, i) => {
        letter.className = "letter behind";
        nw[0].parentElement.style.opacity = 1;
        animateLetterIn(nw, i);
      });

      currentWord.current = nextIndex;
    };

    changeWord();
    const interval = setInterval(changeWord, 2000);
    return () => clearInterval(interval);
  }, []);

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

      <h1 className="text-[40px] whitespace-nowrap uppercase md:text-[60px] font-gilroy-bold mt-5">
        <div className="highlight-animation-top">
          {words.map((word, index) => (
            <div
              key={index}
              className="highlight-animation-word"
              ref={(el) => (wordRefs.current[index] = el)}
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              {word}
            </div>
          ))}
        </div>
      </h1>
    </div>
  );
};

export default VisaHeroSection;
