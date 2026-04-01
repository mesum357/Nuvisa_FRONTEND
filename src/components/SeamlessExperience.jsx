import { useKlarnaContent } from "@/hooks/useKlarnaContent";
import { useRecommendedSection } from "@/hooks/useRecommendedSection";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SeamlessExperience = () => {
  const { recommendedContent, loading: recommendedLoading } = useRecommendedSection();

  // If loading or no cards, we could show nothing or the static ones. 
  // Given the user's request, I'll display the dynamic ones if available.
  const displayCards = (!recommendedLoading && recommendedContent.cards.length > 0)
    ? recommendedContent.cards
    : [
      {
        title: "Insurance certificate",
        description: "Travel insurance certificate is required document for the schengen visa, add to your cart for a seamless experience.",
        image: "/image/certificatee.jpg",
        price: "£30",
        strikeOutPrice: "£45"
      },
      {
        title: "NUvisa E-Gift Card",
        description: "Give the gift of unforgettable memories this Christmas! Order now and your digital gift card will be sent to your email address immediately.",
        image: "/image/gitftnewcard.png",
        price: "£159",
        strikeOutPrice: "£245"
      }
    ];

  const sectionTitle = (!recommendedLoading && recommendedContent.title) ? recommendedContent.title : "More to love";

  return (
    <div className="pt-5 bg-[#1E1E27]">
      <div className="">

        <div className="flex flex-col lg:flex-row gap-8 px-6 md:px-16 mx-auto">
          {/* Left side - two cards stacked */}
          <div className="flex flex-col justify-center gap-8 flex-1">

            <div className="section_holder mt-10" id="accessories">
              <div
                className="text-left text-white text-4xl md:text-6xl font-gilroy-bold"
              >
                {sectionTitle}
              </div>
            </div>
            {displayCards.map((card, index) => (
              <div key={index} className="bg-white backdrop-blur-sm rounded-[2rem] flex items-center gap-5 md:gap-10 text-gray-800 p-6 md:py-12 md:px-5 shadow-none transition-shadow duration-300">
                <Image
                  src={card.image}
                  width={160}
                  height={160}
                  alt={card.title}
                  className={`md:w-[160px] w-[100px] object-cover ${index === 0 ? "rounded-[10px]" : ""}`}
                  priority
                />
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-gilroy-bold font-semibold text-gray-800">
                    {card.title}
                  </h3>
                  <p className="text-sm md:text-lg font-medium leading-relaxed text-gray-600">
                    {card.description}
                  </p>
                  <p className="font-semibold">
                    {card.strikeOutPrice && <s className="text-gray-500">{card.strikeOutPrice}</s>}{" "}
                    <span className="text-black">{card.price}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right side - single image */}
          <div className="flex-1 flex items-center justify-center">
            <Image
              src="/image/get-the-visa-image.png"
              width={500}
              height={500}
              alt="Side image"
              className="w-full h-full object-cover rounded-[2rem]"
            />
          </div>
        </div>


        <div className="my-5 md:my-10 mx-auto w-fit">
          <Link href={"/get-the-visa"}>
            <button className="group flex items-center bg-[#6B4EFF] text-white gap-[16px] font-medium px-[24px] py-3 rounded-full cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
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
