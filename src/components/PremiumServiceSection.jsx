import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PremiumServiceSection = () => {
  return (
    <div className="bg-gray-900 text-white py-20 pb-10 px-6">
      <div className="max-w-[85rem] mx-auto flex items-center flex-col justify-center">
        {/* Header with Title and Badges */}
        <div className="flex flex-col w-full lg:flex-row justify-between items-start lg:items-center mb-16">
          <div className="mb-8 lg:mb-0 md:ml-5 max-md:w-fit max-md:mx-auto">
            <h1 className="text-[32px] max-md:text-center md:text-[40px] lg:text-[64px] font-gilroy-bold leading-tight">
              Premium service,
              <br />
              End-to-end security
            </h1>
          </div>

          {/* Compliance Badges */}
          <div className="flex md:gap-6 flex-wrap max-md:items-center max-md:justify-center">
            {/* GDPR Badge */}
            <div className="  rounded-full flex flex-col items-center justify-center relative">
              <Image
                src="/image/gdpr.webp"
                alt="Icon"
                width={200}
                height={200}
                className="object-contain"
                priority
              />{" "}
            </div>

            <div className="  rounded-full flex flex-col items-center justify-center relative">
              <Image
                src="/image/ICO-new.png"
                alt="Icon"
                width={200}
                height={200}
                className="object-contain"
                priority
              />{" "}
            </div>
            {/* ICO Badge */}
            <div className="  rounded-full flex flex-col items-center justify-center relative">
              <Image
                src="/image/pci-dss.png"
                alt="Icon"
                width={200}
                height={200}
                className="object-contain"
                priority
              />{" "}
            </div>
            {/* PCI-DSS Compliance Badge */}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="flex gap-4 md:gap-8 w-full overflow-auto hide-scrollbar">
          {/* Always in Touch Card */}
          <div className="group cursor-pointer min-w-[370px] md:min-w-[545px] w-full">
            <div className="rounded-3xl h-[350px] w-full mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-2xl bg-[linear-gradient(to_bottom,#FCB398_26%,#FB7F94_90%)]">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent"></div>
              <Image
                src="/image/grid-showcase-1.png"
                alt="Icon"
                width={500}
                height={500}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div>
              <h3 className="text-[32px] md:text-[45px] font-gilroy-bold mb-1 md:mb-3">
                Always in touch
              </h3>
              <p className="text-white text-[16px] font-gilroy-bold">
                Got any question? Get in touch with 24/7 live human support
                available.
              </p>
            </div>
          </div>

          {/* Realtime Reporting Card */}
          <div className="group cursor-pointer min-w-[370px] md:min-w-[545px] w-full">
            <div className="rounded-3xl h-[350px] w-full mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-2xl bg-[linear-gradient(to_top_right,#A9F423,#3ACDFB,#62DCAA)]">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent"></div>
              <Image
                src="/image/grid-showcase-2.png"
                alt="Icon"
                width={500}
                height={500}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div>
              <h3 className="text-[32px] md:text-[45px] font-gilroy-bold mb-1 md:mb-3">
                Realtime reporting
              </h3>
              <p className="text-white text-[16px] font-gilroy-bold">
                On the go online updates for your visa process with instant
                handy notifications.
              </p>
            </div>
          </div>

          {/* Peace of Mind Card */}
          <div className="group cursor-pointer min-w-[370px] md:min-w-[545px] w-full">
            <div className="rounded-3xl h-[350px] w-full mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-2xl bg-[linear-gradient(to_top,#F2BBA0,#E8A4BD,#DD8CDC)]">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent"></div>
              <Image
                src="/image/grid-showcase-3.webp"
                alt="Icon"
                width={500}
                height={500}
                className="w-full h-full object-contain"
                priority
              />
            </div>

            <div>
              <h3 className="text-[32px] md:text-[45px] font-gilroy-bold mb-1 md:mb-3">
                Peace of mind
              </h3>
              <div className="text-white text-[16px] font-gilroy-bold">
                <div>1. Registered with ICO & GDPR compliant.</div>
                <div>
                  2. End-to-end security, no data sharing with third parties.
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link href={"/get-the-visa"}>
          <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb] mt-10">
            <span className="mr-3 text-2xl">GET THE VISA</span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PremiumServiceSection;
