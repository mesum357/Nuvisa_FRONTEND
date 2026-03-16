import React, { useState, useEffect, useRef, useMemo } from "react";
import { Check, Gavel } from "lucide-react";
import Image from "next/image";

const FeaturesSection = React.memo(() => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const sectionRef = useRef(null);
  const maxOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const animationFrameRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // Calculate maxOffset once and cache it
  useEffect(() => {
    const calculateMaxOffset = () => {
      maxOffsetRef.current = (window.innerWidth / 1) * 0.35;
    };

    calculateMaxOffset();
    window.addEventListener('resize', calculateMaxOffset);
    return () => window.removeEventListener('resize', calculateMaxOffset);
  }, []);

  useEffect(() => {
    let ticking = false;
    let isInitialized = false;

    // Smooth interpolation function (lerp)
    const lerp = (start, end, factor) => {
      return start + (end - start) * factor;
    };

    // Calculate target offset based on scroll position
    const calculateTargetOffset = () => {
      if (!sectionRef.current) return 0;

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const windowHeight = window.innerHeight;
      const rectHeight = rect.height;
      const maxOffset = maxOffsetRef.current;

      // If section is below viewport (not yet visible), start at maxOffset
      if (sectionTop >= windowHeight) {
        return maxOffset;
      }
      // If section is above viewport (already scrolled past), end at -maxOffset
      if (sectionTop <= -rectHeight) {
        return -maxOffset;
      }
      // If section is in viewport, calculate based on scroll progress
      const scrollProgress =
        (windowHeight - sectionTop) / (windowHeight + rectHeight);
      return maxOffset - scrollProgress * maxOffset * 2;
    };

    // Animation loop for smooth interpolation
    const animate = () => {
      const currentOffset = currentOffsetRef.current;
      const targetOffset = targetOffsetRef.current;
      const difference = Math.abs(currentOffset - targetOffset);

      // Only animate if there's a meaningful difference
      if (difference > 0.1) {
        // Smooth interpolation factor (lower = smoother but slower)
        const factor = 0.08;
        const newOffset = lerp(currentOffset, targetOffset, factor);
        currentOffsetRef.current = newOffset;
        setScrollOffset(newOffset);
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to target when close enough
        currentOffsetRef.current = targetOffset;
        setScrollOffset(targetOffset);
        // Continue animation loop to check for new target changes
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const updateOffset = () => {
      ticking = false;
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const windowHeight = window.innerHeight;
      const rectHeight = rect.height;

      if (sectionTop < windowHeight && sectionTop > -rectHeight) {
        const scrollProgress =
          (windowHeight - sectionTop) / (windowHeight + rectHeight);

        // Use cached maxOffset
        const maxOffset = maxOffsetRef.current;
        const newTargetOffset = maxOffset - scrollProgress * maxOffset * 2;
        targetOffsetRef.current = newTargetOffset;

        // Always restart animation loop when target changes (after initialization)
        if (isInitialized && !isAnimatingRef.current) {
          isAnimatingRef.current = true;
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      } else {
        // Handle cases when section is outside viewport
        const newTargetOffset = calculateTargetOffset();
        targetOffsetRef.current = newTargetOffset;

        // On initial load, set immediately without animation to prevent flicker
        if (!isInitialized) {
          currentOffsetRef.current = newTargetOffset;
          setScrollOffset(newTargetOffset);
          isInitialized = true;
        } else {
          // Stop animation when section is out of viewport
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          isAnimatingRef.current = false;
          // Set position immediately when out of viewport
          currentOffsetRef.current = newTargetOffset;
          setScrollOffset(newTargetOffset);
        }
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateOffset);
      }
    };

    // Initialize on mount - calculate and set initial position immediately
    const initializePosition = () => {
      if (!sectionRef.current) {
        // Retry after a short delay if ref isn't ready
        setTimeout(initializePosition, 10);
        return;
      }
      const initialOffset = calculateTargetOffset();
      currentOffsetRef.current = initialOffset;
      targetOffsetRef.current = initialOffset;
      setScrollOffset(initialOffset);
      isInitialized = true;
    };

    // Wait for next frame to ensure layout is complete
    requestAnimationFrame(() => {
      initializePosition();
      updateOffset();
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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
            className="text-[30px] md:text-[50px] lg:text-[70px] font-extrabold leading-tight max-md:tracking-tight max-sm:hidden"
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
                  priority
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
                  priority
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
                priority
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
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
