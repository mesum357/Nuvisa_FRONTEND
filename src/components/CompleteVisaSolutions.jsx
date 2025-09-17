"use client";
import { ArrowUpRight, Link } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import GetTheVisaButton from "./layout/GetTheVisaButton";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import { getCountryConfig } from "@/constants/countryConfig";

const CompleteVisaSolutions = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleCountrySelect = (countryName) => {
    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    // Store the selected country and dynamic fees in Redux
    dispatch(setSelectedCountry(countryName));
    dispatch(setVisaFees(countryConfig.visaFee));
    dispatch(setInsuranceFees(countryConfig.insuranceFee));
    dispatch(setTravelers(1));

    // Redirect to checkout with dynamic country information
    router.push(
      `/visa-checkout?selectedCountry=${encodeURIComponent(
        countryName
      )}&visaFees=${countryConfig.visaFee}&insuranceFees=${
        countryConfig.insuranceFee
      }&travelers=1`
    );
  };

  const destinations = [
    {
      name: "BEGUN",
      image:
        "https://images.unsplash.com/photo-1588412195830-6a88dc8d7938?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      name: "SPAN",
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      name: "PONTUCA",
      image:
        "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      name: "COLAND",
      image:
        "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1487&q=80",
    },
    // Duplicate items for infinite scroll effect
    {
      name: "BEGUN",
      image:
        "https://images.unsplash.com/photo-1588412195830-6a88dc8d7938?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      name: "SPAN",
      image:
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      name: "PONTUCA",
      image:
        "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    },
    {
      name: "COLAND",
      image:
        "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1487&q=80",
    },
  ];

  const galleryRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  const speed = 0.5;

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;

    let animationFrameId;
    let scrollPosition = 0;

    const animate = () => {
      if (!isPaused) {
        scrollPosition += speed;
        if (scrollPosition >= gallery.scrollWidth / 2) {
          scrollPosition = 0;
        }
        gallery.scrollLeft = scrollPosition;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused]);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="w-full">
      <section className="w-full bg-gray-50 py-[40px] flex items-center justify-center gap-[32px] flex-col">
        <div className="max-w-[1200px] w-full mx-auto grid md:grid-cols-2 gap-10 items-center">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
            The next generation of complete visa solutions
          </h2>

          {/* Right Side - Description */}
          <p className="text-gray-500 text-lg leading-relaxed">
            Benefit from document pre-checks, error-proof form filling, and
            personalized visa guidance, powered by AI with human oversight at
            critical checkpoints – all designed to prevent delays, mistakes, and
            rejections.
          </p>
        </div>
        <div className="w-full overflow-hidden mt-[27px]">
          <div
            ref={galleryRef}
            className="flex w-full items-center justify-center overflow-x-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {destinations.map((destination, index) => (
              <div
                key={`${destination.name}-${index}`}
                onClick={() => handleCountrySelect(destination.name)}
                className="relative flex-shrink-0 w-64 h-96 mx-4 group cursor-pointer"
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-gilroy-bold text-white">
                    {destination.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
        <GetTheVisaButton />
      </section>
    </div>
  );
};

export default CompleteVisaSolutions;
