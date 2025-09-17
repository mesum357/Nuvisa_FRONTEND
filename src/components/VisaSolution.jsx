import { ArrowUpRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import { getCountryConfig } from "@/constants/countryConfig";

const VisaSolution = () => {
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
      name: "FRANCE",
      image: "https://www.nuvisa.co.uk/public/img/countries/France.jpg",
    },
    {
      name: "SWITZERLAND",
      image: "https://www.nuvisa.co.uk/public/img/countries/Switzerland.jpg",
    },
    {
      name: "ITALY",
      image: "https://www.nuvisa.co.uk/public/img/countries/Italy.jpg",
    },
    {
      name: "GERMANY",
      image: "https://www.nuvisa.co.uk/public/img/countries/Germany.jpg",
    },
    {
      name: "NETHERLANDS",
      image: "https://www.nuvisa.co.uk/public/img/countries/Netherlands.jpg",
    },
    {
      name: "BELGIUM",
      image: "https://www.nuvisa.co.uk/public/img/countries/Belgium.jpg",
    },
    {
      name: "SPAIN",
      image: "https://www.nuvisa.co.uk/public/img/countries/Spain.jpg",
    },
    {
      name: "PORTUGAL",
      image: "https://www.nuvisa.co.uk/public/img/countries/Portugal.jpg",
    },
    {
      name: "POLAND",
      image: "https://www.nuvisa.co.uk/public/img/countries/Poland.jpg",
    },
    // Duplicate items for infinite scroll effect
    {
      name: "FRANCE",
      image: "https://www.nuvisa.co.uk/public/img/countries/France.jpg",
    },
    {
      name: "SWITZERLAND",
      image: "https://www.nuvisa.co.uk/public/img/countries/Switzerland.jpg",
    },
    {
      name: "ITALY",
      image: "https://www.nuvisa.co.uk/public/img/countries/Italy.jpg",
    },
    {
      name: "GERMANY",
      image: "https://www.nuvisa.co.uk/public/img/countries/Germany.jpg",
    },
    {
      name: "NETHERLANDS",
      image: "https://www.nuvisa.co.uk/public/img/countries/Netherlands.jpg",
    },
    {
      name: "BELGIUM",
      image: "https://www.nuvisa.co.uk/public/img/countries/Belgium.jpg",
    },
    {
      name: "SPAIN",
      image: "https://www.nuvisa.co.uk/public/img/countries/Spain.jpg",
    },
    {
      name: "PORTUGAL",
      image: "https://www.nuvisa.co.uk/public/img/countries/Portugal.jpg",
    },
  ];

  const galleryRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
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

  return (
    <section className="w-full pri_bg py-[40px]  flex items-center justify-center gap-[32px] flex-col">
      <div className="w-full max-w-[86rem] mx-auto flex flex-col gap-6 items-center justify-center">
        <div className=" w-full flex items-center gap-5 md:gap-10 max-md:flex-col max-md:text-center px-6">
          <h2 className="text-2xl sm:text-5xl text-white  md:text-6xl font-extrabold leading-tight flex-1">
            The next generation of complete visa solutions
          </h2>

          {/* Right Side - Description */}
          <p className="text-white text-[13px] md:text-base font-medium leading-relaxed flex-[.6]">
            Benefit from document pre-checks, error-proof form filling, and
            personalized visa guidance, powered by AI with human oversight at
            critical checkpoints - all designed to prevent delays, mistakes, and
            rejections.
          </p>
        </div>
        <div className="w-[85%] md:w-[60%] min-h-[180px]">
          <video
            className=" object-cover rounded-[30px] mt-[44px] w-full h-full"
            style={{ objectFit: "cover" }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="//magic.fit/cdn/shop/files/Video_Overlay_1.png?v=1668943316&width=1200"
          >
            <source
              src="https://www.nuvisa.co.uk/public/video/video.mp4"
              type="video/mp4"
            />
            <source
              src="//magic.fit/cdn/shop/videos/c/vp/28b6da720a77479b995a18e6df6b1463/28b6da720a77479b995a18e6df6b1463.HD-720p-1.6Mbps-20580260.mp4?v=0"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="w-full overflow-hidden mt-20 mb-5">
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
              className="relative flex-shrink-0 w-[384px] h-[200px]  mx-4 group overflow-hidden rounded-xl cursor-pointer"
            >
              <img
                src={destination.image}
                alt={destination.name}
                className="w-full h-full object-cover rounded-[16px] shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-black rounded-full p-3 py-1 w-fit">
                <h3 className="text-sm uppercase font-medium text-white">
                  {destination.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
        <span className="mr-3 text-2xl">GET THE VISA</span>
        <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
          <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
        </span>
      </button>
    </section>
  );
};

export default VisaSolution;
