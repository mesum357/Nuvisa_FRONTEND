import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SeamlessExperience = () => {
  return (
    <div className="pt-5 bg-[#1E1E27]">
      <div className="">
        <div className="section_holder my-4" id="accessories">
          <div
            className=" mb-3 text-center text-white"
            style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.0 }}
          >
            Pairs together for seamless experience
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 md:px-16 mx-auto">
          <div className="bg-white backdrop-blur-sm rounded-[2rem] flex items-center gap-5 md:gap-10 text-gray-800 p-6 md:py-12 md:px-5 shadow-none transition-shadow duration-300">
            <Image
              src="/image/certificatee.jpg"
              width={160}
              height={160}
              alt="Check Rectangle Icon"
              className="md:w-[160px] w-[100px] object-cover"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-gilroy-bold font-semibold text-gray-800">
                Insurance certificate
              </h3>
              <p className="text-sm md:text-lg font-medium leading-relaxed">
                Travel insurance certificate is required document for the
                schengen visa, add to your cart for a seamless experience.
              </p>

              <p className="font-semibold">
                <s className="text-gray-500">£45</s> £29
              </p>
            </div>
          </div>

          <div className="bg-white backdrop-blur-sm rounded-[2rem] flex items-center gap-5 md:gap-10 text-gray-800 p-6 md:py-12 md:px-5 shadow-none transition-shadow duration-300">
            <Image
              src="/image/gitftnewcard.png"
              width={160}
              height={160}
              alt="Check Rectangle Icon"
              className="md:w-[160px] w-[100px] object-cover"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-gilroy-bold font-semibold text-gray-800">
                NUvisa Digital Gift Card
              </h3>
              <p className="text-sm md:text-lg font-medium leading-relaxed">
                Give the gift of unforgettable memories this Christmas! Order
                now and your digital gift card will be sent to your email
                address immediately.
              </p>

              <p className="font-semibold">
                <s className="text-gray-500">£245</s> £188
              </p>
            </div>
          </div>
        </div>

        <div className="my-10 md:my-20 mx-auto w-fit">
          <Link href={"/get-the-visa"}>
            <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-full cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
              <span className="mr-3 text-xl font-semibold">GET THE VISA</span>
              <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
                <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
              </span>
            </button>
          </Link>
          {/* <GetTheVisaButton /> */}
        </div>
      </div>
    </div>
  );
};

export default SeamlessExperience;
