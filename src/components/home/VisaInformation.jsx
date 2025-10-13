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

const VisaInformation = () => {
  return (
    <ClientOnly>
      <div className="bg-[#1E1E27] text-white">
        <Navbar />
        <div className=" mx-auto flex-col gap-0 flex items-center justify-center mt-5">
          <CountrySlider />

          {/* Visa Type Selection */}

          <div className="px-5 pt-5 w-full flex items-center justify-center">
            <div className="max-w-[88rem] bg-[#F3E5FF] text-[#212529] w-full rounded-3xl py-12 px-10 text-center shadow-2xl">
              {/* Main Heading */}
              <h2 className="text-[26px] max-md:px-8 lg:text-[38px] font-gilroy-bold text-[#212529] mb-2 leading-tight">
                Pay in small instalments with interest free financing!
              </h2>

              {/* Subheading with Details */}
              <div className=" flex items-center gap-2 max-md:flex-col text-[#212529] justify-center ">
                <p className="text-sm md:text-[16px] font-medium">
                  4 payments of £37 with 0% interest.
                </p>
                <p className="font-semibold text-lg md:text-[20px] ">
                  <span className="">£42</span> per month |
                  <span className="mx-2">0% Interest</span> |<span>No fees</span>
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5 w-full flex items-center justify-center">
            <div className="bg-[#F3E5FF] text-[#212529] w-full rounded-3xl md:py-5 md:px-10 text-center shadow-2xl mt-20 max-w-[88rem]">
              <div className="row justify-content-center">
                <div className="col-12 py-4 text-center">
                  <div className="pdp_media_el bg-purple p-3 pt-5 pb-5">
                    {/* <p class="section-label">Benefits</p> */}
                    <h2 className="text-3xl md:text-6xl font-gilroy-bold text-[#212529] mb-4">
                      Get your visa in 4 simple steps
                    </h2>

                    <div className=" mx-auto">
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
                            <text stroke="null" transform="matrix(0.999394 0 0 0.885242 22.9627 22.5922)" id="svg_7" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="110.57265" x="342.33334">Upload &amp; Prep</text>
                            <text stroke="null" transform="matrix(1.02386 0 0 1.01895 35.787 10.2292)" id="svg_8" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="105.57265" x="524.53332">Visit appointment</text>
                            <path stroke="#000" id="svg_9" fill="none" strokeWidth="2" d="m458.75437,132.51318c-27.66937,30.49046 -54.24821,56.42562 -83.61394,56.42562c-69.85053,0 -127.62236,-143.00509 -199.25481,-143.00509c-26.67863,0 -55.77092,20.1366 -82.7204,52.21373" />
                            <path stroke="#000" id="svg_10" fill="none" strokeWidth="2" d="m840.64011,129.4128c-27.05796,30.49045 -53.04949,56.42562 -81.76634,56.42562c-68.30706,0 -123.33353,-143.00509 -193.38311,-143.00509c-26.08912,0 -56.00736,20.1366 -82.36134,52.21373" />
                            <text stroke="null" transform="matrix(1.02386 0 0 1.01895 239.949 7.9039)" id="svg_11" fontWeight="500" fontSize={16} dominantBaseline="middle" textAnchor="middle" y="105.57265" x="504.35552">Approved</text>
                            <path stroke="#000" id="svg_12" opacity="0.2" fill="none" strokeWidth="2" d="m916.52945,112.65633c0,0 3.29983,-0.0141 -24.65165,0.10536c-47.94455,0.2049 -57.87404,-69.12426 -126.19989,-68.83225c-29.61304,0.12656 -60.62555,24.88627 -91.08568,55.17091" />
                          </g>
                        </g>
                      </svg>
                    </div>

                    <div className="grid md:grid-cols-4 gap-1 max-md:text-sm max-md:text-left px-5 mx-5">
                      <div className="">
                        <p className="font-medium">
                          1. <span>Confirm required documents then start</span>
                        </p>
                      </div>
                      <div className="">
                        <p className="font-medium">
                          2.{" "}
                          <span>
                            Upload docs and complete your details. Former
                            consulate officers or VFS expert will review and get
                            your complete application ready
                          </span>
                        </p>
                      </div>
                      <div className=" md:text-center">
                        <p className="font-medium">
                          3.{" "}
                          <span style={{ marginRight: "auto" }}>
                            Visit the visa centre to submit <br /> all gathered
                            documents
                          </span>
                        </p>
                      </div>
                      <div className=" md:text-center">
                        <p className="font-medium">
                          4.
                          <span style={{ marginRight: "auto" }}>
                            Once approved, you're eligible to travel.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <VisaSolution />
          <FAQSection />
          <div className="w-full bg-white h-[1px]"></div>
          <ComparisonSection />
          <SeamlessExperience />
          <OurMission className="bg-[#F3E6FF] py-10" />
          <Footer />
        </div>
      </div>
    </ClientOnly>
  );
};

export default VisaInformation;
