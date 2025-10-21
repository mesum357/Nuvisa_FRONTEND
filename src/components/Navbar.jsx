import GetTheVisaButton from "@/components/layout/GetTheVisaButton";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store";
import ClientOnly from "./ClientOnly";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa";

const Navbar = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.authState);

  return (
    <ClientOnly>
      <div className="text-white">
     <div className="sec_bg px-10 py-2.5 border-[#423577] border-b text-sm rounded-b-[23px] flex items-center justify-between">

  {/* Left Content (Text + Button aligned LEFT) */}
  <div className="flex items-center gap-3">
    <span className="font-medium md:font-semibold">
      ❤️ NEW CUSTOMER OFFER - £129 fee for your first visa with us, then £200
    </span>
    <Link href={"/get-the-visa"}>
    <button className="underline decoration-[#7351ff] public_text_clr rounded-md text-white font-medium transition-colors">
      Get now
    </button>
    </Link>
  </div>

  {/* Right Content (WhatsApp + Email aligned RIGHT) */}
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <FaWhatsapp className="text-green-400 size-4" />
      <span className="text-sm font-medium text-gray-300 hidden md:inline">
        +44 7825528764
      </span>
    </div>

    <div className="flex items-center gap-2">
      <FaEnvelope className="size-4" />
      <span>support@nuvisa.co.uk</span>
    </div>
  </div>

</div>


        <div className="lg:hidden text-center mt-5">
          <span className="text-xl sm:text-2xl font-gilroy-bold">
            Schengen visa for Indians from the UK
          </span>
        </div>

        {/* Navigation */}
       <nav className="relative flex items-center justify-between mt-5 md:mt-[36px] border-[#423577] sec_bg rounded-[70px] border px-6 lg:px-4 py-3 md:py-4 mx-[20px]">
  {/* Left Logo */}
  <div className="flex items-center">
    <Link href="/" className="">
      <Image
        src="/image/logo.png"
        alt="Icon"
        width={130}
        height={20}
        className="object-contain"
      />
    </Link>
  </div>

  {/* Center Text */}
  <div className="absolute left-1/2 transform -translate-x-1/2">
    <span className="text-[22px] font-gilroy-bold text-center">
      Schengen visa for Indians from the UK
    </span>
  </div>

  {/* Right Section */}
  <div className="flex items-center gap-2">
    <div className="relative inline-block">
      {/* Coming Soon badge */}
      <span className="absolute -top-4 right-3 bg-[#c2b1eb] text-[#7A4FFF] text-[10px] font-bold px-2 py-1 rounded-full transition-all duration-300 hover:bg-[#6247D3] cursor-pointer">
        Coming Soon
      </span>

      {/* Button */}
      <div className="hidden md:block">
        <button className="bg-green-600/20 border border-green-500/30 px-4 py-[7px] rounded-full font-medium text-sm text-white flex items-center">
          <img
            src="/icons/holiday.png"
            alt="Holiday Packages"
            className="inline-block mr-2 w-8"
          />
          Holiday Packages
        </button>
      </div>
    </div>

    <div className="max-sm:hidden">
      <GetTheVisaButton removeArrow={true} />
    </div>

    {isAuthenticated ? (
      <Link href="/dashboard" className="cursor-pointer">
        <button className="border border-white hover:border-neutral-500 px-[16px] py-[7px] rounded-full font-medium transition-colors cursor-pointer">
          My Applications
        </button>
      </Link>
    ) : (
      <Link href="/dashboard" className="cursor-pointer">
        <button className="border border-white hover:border-neutral-500 px-[16px] py-[7px] rounded-full font-medium transition-colors cursor-pointer">
          Login
        </button>
      </Link>
    )}
  </div>
</nav>

      </div>
    </ClientOnly>
  );
};

export default Navbar;
