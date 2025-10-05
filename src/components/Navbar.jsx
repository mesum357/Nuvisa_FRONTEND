import GetTheVisaButton from "@/components/layout/GetTheVisaButton";
import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store";
import ClientOnly from "./ClientOnly";

const Navbar = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.authState);

  return (
    <ClientOnly>
      <div className="text-white">
        <div className="sec_bg px-4 py-2.5 text-center border-[#423577] border-b text-sm rounded-b-[23px]">
          <span className="font-medium md:font-semibold">
            NEW CUSTOMER OFFER - £149 fee for your first visa with us, then £200
          </span>
          <button className="ml-4 underline decoration-[#7351ff] public_text_clr rounded-md text-white font-medium transition-colors">
            Get now
          </button>
        </div>

        <div className="lg:hidden text-center mt-5">
          <span className="text-xl sm:text-2xl font-gilroy-bold">
            Schengen visa for Indians from the UK
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center mt-5 md:mt-[36px] border-[#423577] sec_bg rounded-[70px] border justify-between px-6 lg:px-4 py-3 md:py-4 mx-[20px]">
          <div className="flex items-center">
            <Link href="/" className="">
              <Image
                src="/image/logo.png"
                alt="Icon"
                width={130}
                height={20}
                className="object-contain"
              />{" "}
            </Link>
          </div>

          <div className="hidden lg:block">
            <span className="text-[28px] font-gilroy-bold">
              Schengen visa for Indians from the UK
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              <Link href="/login" className="cursor-pointer">
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
