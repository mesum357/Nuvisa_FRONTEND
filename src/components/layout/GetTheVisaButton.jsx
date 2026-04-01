import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const GetTheVisaButton = ({ frosted = false, removeArrow, btnClassName }) => {
  const router = useRouter();

  const handleNavigate = () => {
    router.push("/get-the-visa");
  };

  return (
    <button
      onClick={handleNavigate}
      className={`${
        frosted
          ? "group relative flex items-center justify-center bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-medium px-8 py-4 rounded-full transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:shadow-lg cursor-pointer"
          : removeArrow
          ? "group flex items-center bg-[#7350FF] text-white font-medium px-3 py-2 rounded-full transition-all duration-300 hover:bg-[#6247D3] cursor-pointer"
          : "group flex items-center bg-[#7350FF] text-white font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-[#6247D3] cursor-pointer"
      } ${btnClassName}`}
    >
      <span
        className={frosted ? "mr-3 text-2xl!" : removeArrow ? "mr-0!" : "mr-3 text-2xl!"}
      >
        GET THE VISA
      </span>

      {!removeArrow && (
        <span
          className={
            frosted
              ? "bg-white/20 rounded-full p-1.5 transition-all duration-300 group-hover:bg-white/30 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1"
              : "bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0"
          }
        >
          <ArrowUpRight
            className={
              frosted ? "w-5 h-5 text-white" : "w-5 h-5 text-[#7350FF]"
            }
          />
        </span>
      )}

      {frosted && (
        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="absolute inset-0 rounded-full bg-white/10 blur-md animate-pulse"></span>
        </span>
      )}
    </button>
  );
};

export default GetTheVisaButton;
