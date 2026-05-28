import React, { useEffect, useRef, useState } from "react";

const WORDS = [
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

const VisaHeroSection = () => {
  const wordRefs = useRef([]);
  const wordArray = useRef([]);
  const currentWord = useRef(0);
  const [animationsReady, setAnimationsReady] = useState(false);

  useEffect(() => {
    const start = () => setAnimationsReady(true);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(start, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!animationsReady) return undefined;

    wordArray.current = [];

    WORDS.forEach((word, idx) => {
      const letters = [];
      const node = wordRefs.current[idx];
      if (!node) return;

      const content = node.innerText;
      node.innerText = "";

      for (let i = 0; i < content.length; i++) {
        const span = document.createElement("span");
        span.className = "letter";
        span.innerText = content.charAt(i);
        node.appendChild(span);
        letters.push(span);
      }

      wordArray.current.push(letters);
    });

    if (wordRefs.current[0]) {
      wordRefs.current[0].style.opacity = 1;
    }

    const animateLetterOut = (cw, i) => {
      window.setTimeout(() => {
        cw[i].className = "letter out";
      }, i * 80);
    };

    const animateLetterIn = (nw, i) => {
      window.setTimeout(() => {
        nw[i].className = "letter in";
      }, 340 + i * 80);
    };

    const changeWord = () => {
      const cw = wordArray.current[currentWord.current];
      const nextIndex =
        currentWord.current === wordArray.current.length - 1
          ? 0
          : currentWord.current + 1;
      const nw = wordArray.current[nextIndex];
      if (!cw || !nw) return;

      for (let i = 0; i < cw.length; i++) {
        animateLetterOut(cw, i);
      }

      for (let i = 0; i < nw.length; i++) {
        nw[i].className = "letter behind";
        nw[0].parentElement.style.opacity = 1;
        animateLetterIn(nw, i);
      }

      currentWord.current = nextIndex;
    };

    changeWord();
    const interval = window.setInterval(changeWord, 2000);
    return () => window.clearInterval(interval);
  }, [animationsReady]);

  return (
    <div className="flex-col flex gap-1 mt-[6px] max-sm:mt-[6px] md:mt-0 items-center justify-center">
      <style>{`
        .highlight-animation-top {
          position: relative;
          display: block;
          height: 1em;
          min-height: 1em;
          min-width: 11ch;
          width: 100%;
        }

        .highlight-animation-word {
          position: absolute;
          display: block;
          color: #fff;
          text-align: center;
          opacity: 0;
          left: 50%;
          transform: translateX(-50%);
          text-transform: uppercase;
          font-weight: 800;
          white-space: nowrap;
        }

        .letter {
          display: inline-block;
          transform-origin: 50% 50% 25px;
        }

        .letter.out {
          transform: rotateX(90deg);
          transition: transform .32s cubic-bezier(.55,.055,.675,.19);
        }

        .letter.behind {
          transform: rotateX(-90deg);
        }

        .letter.in {
          transform: rotateX(0);
          transition: transform .38s cubic-bezier(.175,.885,.32,1.275);
        }
      `}</style>

      <p
        className="text-[40px] whitespace-nowrap uppercase md:text-[60px] font-gilroy-bold mt-2 max-sm:my-[-30px] md:mt-5 min-h-[1.1em]"
        aria-label="Schengen destinations"
      >
        <span className="highlight-animation-top">
          {WORDS.map((word, index) => (
            <span
              key={word}
              className="highlight-animation-word"
              ref={(el) => {
                wordRefs.current[index] = el;
              }}
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              {word}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
};

export default VisaHeroSection;
