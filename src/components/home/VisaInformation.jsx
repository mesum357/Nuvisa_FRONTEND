import { useEffect } from "react";
import Image from "next/image";
import ClientOnly from "../ClientOnly";
import ComparisonSection from "../ComparisonSection";
import FAQSection from "../Faqs";
import Footer from "../Footer";
import Navbar from "../Navbar";
import OurMission from "../OurMission";
import SeamlessExperience from "../SeamlessExperience";
import CountrySlider from "../Slider";
import VisaSolution from "../VisaSolution";
import StickyBottomBar from "../StickyBottomBar";
import submit from "../../../public/icons/submit.png";
import { useKlarnaContent } from "../../hooks/useKlarnaContent";
import { useProcessContent } from "../../hooks/useProcessContent";

const VisaInformation = () => {
  const { processContent, loading: processLoading } = useProcessContent();
  const { klarnaContent, loading: klarnaLoading } = useKlarnaContent();

  // Handle hash fragment scrolling
  useEffect(() => {
    const scrollToHash = (retryCount = 0) => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;
      if (hash) {
        // Remove the # symbol
        const id = hash.substring(1);
        const element = document.getElementById(id);

        if (element) {
          // Small delay to ensure DOM is fully rendered
          setTimeout(() => {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        } else if (retryCount < 10) {
          // Retry if element not found (for async content)
          setTimeout(() => scrollToHash(retryCount + 1), 200);
        }
      }
    };

    // Scroll on initial load with retry mechanism
    scrollToHash();

    // Also handle hash changes (e.g., when user clicks a link with hash)
    const handleHashChange = () => {
      scrollToHash();
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <ClientOnly>
      <div className="bg-[#1E1E27] text-white w-full overflow-x-clip">
        <Navbar />
        <div className="w-full mx-auto flex flex-col gap-0 items-center justify-center mt-5 ">
          <CountrySlider />

          {/* Visa Type Selection */}
          <section id={"comparison-section"}>
            <ComparisonSection />
          </section>
          <VisaSolution video={true} title={'The next generation <br /> of visa solutions'} />


          <div className="px-3 pt-3 w-full flex items-center justify-center overflow-hidden">
            <div className="text-[#FFF] w-full rounded-3xl md:py-5 md:px-5 text-center shadow-2xl mt-10 md:mt-20 max-w-[88rem] overflow-x-hidden">
              <div className="row justify-content-center">
                <div className="col-12 py-4">
                  <div className="pdp_media_el bg-purple p-3 pt-5 pb-5">
                    {/* Top Section */}
                    <div className="w-full flex gap-5 md:gap-10 max-md:flex-col mb-10 overflow-hidden">
                      <h2 className="text-3xl md:text-6xl font-gilroy-bold text-[#FFF] text-start flex-1">
                        {processLoading ? (
                          "Loading..."
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: processContent.heading }} />
                        )}
                      </h2>
                      <p className="text-white text-[13px] md:text-[14px] font-medium leading-relaxed flex-[.6] text-left">
                        {processLoading ? "Loading..." : processContent.description}
                      </p>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      {/* Step Wrapper Loop / Step 1 */}
                      <div className="flex flex-col text-left">
                        {/* Mobile: Icon & Heading in one line | Desktop: Stacked */}
                        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                          <Image
                            src="/icons/submit.png"
                            alt="Confirm documents"
                            width={80}
                            height={80}
                            className="w-20 h-20 md:mb-3 object-contain"
                            priority
                          />
                          <h1 className="text-xl md:text-3xl md:my-6 font-bold">
                            {processLoading ? "Loading..." : processContent.steps[0].title}
                          </h1>
                        </div>
                        <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px]">
                          {processLoading ? "Loading..." : processContent.steps[0].description}
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col text-left">
                        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                          <Image
                            src="/icons/build.png"
                            alt="Upload & Prep"
                            width={80}
                            height={80}
                            className="w-20 h-20 md:mb-3 object-contain"
                            priority
                          />
                          <h1 className="text-xl md:text-3xl md:my-6 font-bold">
                            {processLoading ? "Loading..." : processContent.steps[1].title}
                          </h1>
                        </div>
                        <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px]">
                          {processLoading ? "Loading..." : processContent.steps[1].description}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col text-left">
                        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                          <Image
                            src="/icons/checkout.png"
                            alt="Visit Appointment"
                            width={80}
                            height={80}
                            className="w-20 h-20 md:mb-3 object-contain"
                            priority
                          />
                          <h1 className="text-xl md:text-3xl md:my-6 font-bold">
                            {processLoading ? "Loading..." : processContent.steps[2].title}
                          </h1>
                        </div>
                        <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px]">
                          {processLoading ? "Loading..." : processContent.steps[2].description}
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="flex flex-col text-left">
                        <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                          <Image
                            src="/icons/approved.png"
                            alt="Approved"
                            width={80}
                            height={80}
                            className="w-20 h-20 md:mb-3 object-contain"
                            priority
                          />
                          <h1 className="text-xl md:text-3xl md:my-6 font-bold">
                            {processLoading ? "Loading..." : processContent.steps[3].title}
                          </h1>
                        </div>
                        <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px]">
                          {processLoading ? "Loading..." : processContent.steps[3].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FAQSection />
          <SeamlessExperience />
          <div id="klarna-section" className=" bg-[#F3E6FF] px-5 pt-15 mt-16 w-full flex items-center justify-center overflow-x-hidden">
            <div className="max-w-[88rem] bg-[#1E1E27] text-white w-full rounded-3xl py-12 px-10 text-center shadow-2xl">
              <h2 className="text-[26px] max-md:px-8 lg:text-[38px] font-gilroy-bold text-white mb-2 leading-tight flex items-center gap-3 justify-center lg:flex-row flex-col">
                <Image src="/icons/klarna.png" alt="Klarna" width={100} height={40} className="" priority />
                {klarnaLoading ? "Loading..." : klarnaContent.heading}
              </h2>

              <div className="flex items-center gap-2 text-gray-400 justify-center font-gilroy-medium mt-1">
                <p className="text-[12px] md:text-lg font-semibold">
                  {klarnaLoading ? "Loading..." : klarnaContent.subtitle}
                </p>
                <span className="text-gray-600">|</span>
                <p className="font-semibold text-lg md:text-[20px] ">
                  {klarnaContent.paymentAmount && <span className="">
                    {!klarnaLoading && klarnaContent.paymentAmount}
                  </span>}
                  {klarnaContent.interestRate && <span className="mx-2">
                    {!klarnaLoading && klarnaContent.interestRate}
                  </span>}
                  <span> {!klarnaLoading && klarnaContent.fees}</span>
                </p>
              </div>
            </div>
          </div>
          <OurMission className="bg-[#F3E6FF] py-10" />
          <Footer />
        </div>

        {/* Sticky Bottom Bar */}
        <StickyBottomBar triggerElementId={'comparison-section'} key={'visa-info-page'} />
      </div>
    </ClientOnly>
  );
};

export default VisaInformation;
