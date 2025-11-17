import { useEffect } from "react";
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
  const { klarnaContent, loading: klarnaLoading } = useKlarnaContent();
  const { processContent, loading: processLoading } = useProcessContent();

  return (
    <ClientOnly>
      <div className="bg-[#1E1E27] text-white w-full overflow-x-hidden">
        <Navbar />
        <div className="w-full mx-auto flex flex-col gap-0 items-center justify-center mt-5 overflow-x-hidden">
          <CountrySlider />

          {/* Visa Type Selection */}

          <div className="px-5 pt-5 w-full flex items-center justify-center overflow-x-hidden">
            <div className="max-w-[88rem] bg-[#F3E5FF] text-[#FFF] w-full rounded-3xl py-12 px-10 text-center shadow-2xl">
              {/* Main Heading */}
              <h2 className="text-[26px] max-md:px-8 lg:text-[38px] font-gilroy-bold text-[#212529] mb-2 leading-tight flex items-center gap-3 justify-center lg:flex-row flex-col">
                <img src="/icons/klarna.png" alt="Klarna" className="" />
                {klarnaLoading ? "Loading..." : klarnaContent.heading}
              </h2>

              {/* Subheading with Details */}
              <div className=" flex items-center gap-2 max-md:flex-col text-[#212529] justify-center ">
                <p className="text-sm md:text-[16px] font-medium">
                  {klarnaLoading ? "Loading..." : klarnaContent.subtitle}
                </p>
                <p className="font-semibold text-lg md:text-[20px] ">
                  <span className="">
                    {!klarnaLoading && klarnaContent.paymentAmount}
                  </span>{" "}
                  each |
                  <span className="mx-2">
                    {!klarnaLoading && klarnaContent.interestRate}
                  </span>
                  | <span> {!klarnaLoading && klarnaContent.fees}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 w-full flex items-center justify-center overflow-x-hidden">
            <div className="text-[#FFF] w-full rounded-3xl md:py-5 md:px-5 text-center shadow-2xl mt-20 max-w-[88rem] overflow-x-hidden">
              <div className="row justify-content-center">
                <div className="col-12 py-4">
                  <div className="pdp_media_el bg-purple p-3 pt-5 pb-5">
                    <div className=" w-full flex items-center gap-5 md:gap-10 max-md:flex-col max-md:text-center px-6 mb-6 overflow-x-hidden">
                      <h2 className="text-3xl md:text-6xl font-gilroy-bold text-[#FFF] mb-4 text-left mb-10 flex-1 whitespace-pre-line">
                        {processLoading ? "Loading..." : processContent.heading}
                      </h2>

                      {/* Right Side - Description */}
                      <p className="text-white text-[13px] md:text-base font-medium leading-relaxed flex-[.6] text-left">
                        {processLoading
                          ? "Loading..."
                          : processContent.description}
                      </p>
                    </div>
                    {/* <p class="section-label">Benefits</p> */}

                    {/* <div className=" mx-auto">
                      <svg viewBox="0 0 934 280"
                        xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" className="wave-line">
                        <g id="Layer_1">
                          <title>Layer 1</title>
                          <g stroke="null" id="svg_13">
                            <path stroke="#000" id="svg_1" opacity="0.2" fill="none" strokeWidth="2" d="m27.632,125.9623c0,0 -3.29985,0 24.65186,0c47.94495,0 57.60836,69.37103 125.93476,69.37103c29.61328,0 60.72055,-24.62696 91.29661,-54.78118" />
                            <path stroke="#000" id="svg_2" opacity="0.2" fill="none" strokeWidth="2" d="m283.27784,99.53764c28.39585,-30.01279 55.67254,-55.54167 85.8093,-55.54167c71.68454,0 130.20251,146.10547 203.71573,146.10547c27.3791,0 58.00594,-25.16181 85.66301,-56.73642" />
                            <text stroke="null" transform="matrix(0.873633 0 0 0.822838 10.3052 58.7383)" id="svg_6" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="78.03552" x="190.49781">
                              <tspan x="190.49781" dy="-0.5em">Confirm required</tspan>
                              <tspan x="190.49781" dy="1.2em">docs &amp; Start</tspan>
                            </text>
                          <image href="/icons/submit.png" x="140" y="75" width="80" height="80" dominantBaseline="middle"/>
  
    <image href="/icons/build.png" x="320" y="65" width="100" height="100" />

    
    <image href="/icons/chekout.png" x="510" y="65" width="120" height="100" />


                            <text stroke="null" transform="matrix(0.999394 0 0 0.885242 22.9627 22.5922)" id="svg_7" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="110.57265" x="342.33334">Upload &amp; Prep</text>
                            <text stroke="null" transform="matrix(1.02386 0 0 1.01895 35.787 10.2292)" id="svg_8" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="105.57265" x="524.53332">Visit appointment</text>
                            <path stroke="#000" id="svg_9" fill="none" strokeWidth="2" d="m458.75437,132.51318c-27.66937,30.49046 -54.24821,56.42562 -83.61394,56.42562c-69.85053,0 -127.62236,-143.00509 -199.25481,-143.00509c-26.67863,0 -55.77092,20.1366 -82.7204,52.21373" />
                            <path stroke="#000" id="svg_10" fill="none" strokeWidth="2" d="m840.64011,129.4128c-27.05796,30.49045 -53.04949,56.42562 -81.76634,56.42562c-68.30706,0 -123.33353,-143.00509 -193.38311,-143.00509c-26.08912,0 -56.00736,20.1366 -82.36134,52.21373" />
                            <text stroke="null" transform="matrix(1.02386 0 0 1.01895 239.949 7.9039)" id="svg_11" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="105.57265" x="504.35552">Approved</text>
                             <image href="/icons/approved.png" dominantBaseline="middle"/>
                              <image href="/icons/approved.png" x="710" y="65" width="100" height="100" />
                            <path stroke="#000" id="svg_12" opacity="0.2" fill="none" strokeWidth="2" d="m916.52945,112.65633c0,0 3.29983,-0.0141 -24.65165,0.10536c-47.94455,0.2049 -57.87404,-69.12426 -126.19989,-68.83225c-29.61304,0.12656 -60.62555,24.88627 -91.08568,55.17091" />
                          </g>
                        </g>
                      </svg>
                    </div> */}

                    <div className="grid md:grid-cols-4 gap-8 text-center md:text-left">
                      {/* Step 1 */}
                      <div className="">
                        <img
                          src="/icons/submit.png"
                          alt="Confirm documents"
                          className="w-20 h-20 mb-3"
                        />
                        <h1 className="text-1xl md:text-3xl my-6">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[0].title}
                        </h1>
                        <p className="font-medium leading-relaxed">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[0].description}
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="">
                        <img
                          src="/icons/build.png"
                          alt="Upload & Prep"
                          className="w-20 h-20 mb-3"
                        />
                        <h1 className="text-1xl md:text-3xl my-6">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[1].title}
                        </h1>
                        <p className="font-medium leading-relaxed">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[1].description}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="">
                        <img
                          src="/icons/checkout.png"
                          alt="Visit Appointment"
                          className="w-20 h-20 mb-3"
                        />
                        <h1 className="text-1xl md:text-3xl my-6">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[2].title}
                        </h1>
                        <p className="font-medium leading-relaxed">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[2].description}
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="">
                        <img
                          src="/icons/approved.png"
                          alt="Approved"
                          className="w-20 h-20 mb-3"
                        />
                        <h1 className="text-1xl md:text-3xl my-6">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[3].title}
                        </h1>
                        <p className="font-medium leading-relaxed">
                          {processLoading
                            ? "Loading..."
                            : processContent.steps[3].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ComparisonSection />

          <VisaSolution />
          <FAQSection />
          <div className="w-full bg-white h-[1px]"></div>

          <SeamlessExperience />
          <OurMission className="bg-[#F3E6FF] py-10" />
          <Footer />
        </div>

        {/* Sticky Bottom Bar */}
        <StickyBottomBar />
      </div>
    </ClientOnly>
  );
};

export default VisaInformation;
