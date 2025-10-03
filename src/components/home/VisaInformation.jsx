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
    <div className="bg-[#1E1E27] text-white">
      <Navbar />
      <div className=" mx-auto flex-col gap-0 flex items-center justify-center mt-5">
        <ClientOnly>
          <CountrySlider />
        </ClientOnly>

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
                Pay in 24 instalments with 0% interest.
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
                    Get your visa in 3 simple steps
                  </h2>

                  <div className="w-[80%] mb-5 md:w-[75%] mx-auto">
                    <svg
                      className="wave-line"
                      viewBox="0 0 934 280"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <path
                        d="M-468,-1 C-468,-1 -472.25,-1 -436.25,-1 C-374.5,-1 -363,102 -275,102 C-236.86,102 -195.85,63.28 -156.47,19.96"
                        transform="translate(467,140)"
                        stroke="#000"
                        strokeWidth={2}
                        fill="none"
                        opacity="0.2"
                      />
                      <path
                        d="M-116.31,-24.33 C-77.49,-66.03 -40.20,-101.5 1,-101.5 C99,-101.5 179,101.5 279.5,101.5 
             C316.93,101.5 358.80,66.54 396.61,22.67"
                        transform="translate(467,140)"
                        stroke="#000"
                        strokeWidth={2}
                        fill="none"
                        opacity="0.2"
                      />
                      <path
                        d="M-468.19,-0.43 C-469.60,-0.42 -466.42,-0.43 -436.44,-0.54 C-374.69,-0.76 -362.81,102.19 -274.81,101.87 
             C-236.68,101.74 -195.80,62.86 -156.58,19.41"
                        transform="matrix(-0.99146,0,0,-1,468,140)"
                        stroke="#000"
                        strokeWidth={2}
                        fill="none"
                      />
                      <path
                        d="M-462.58,6.13 L-469.01,-0.44 L-461.95,-7.25"
                        transform="matrix(-0.99146,0,0,-1,468,140)"
                        stroke="#000"
                        strokeWidth={2}
                        fill="none"
                      />
                      <path
                        d="M-116.31,-24.33 C-77.49,-66.03 -40.20,-101.5 1,-101.5 C99,-101.5 179,101.5 279.5,101.5 
             C316.93,101.5 358.80,66.54 396.61,22.67"
                        transform="matrix(-0.99146,0,0,-1,468,140)"
                        stroke="#000"
                        strokeWidth={2}
                        fill="none"
                      />
                      <text
                        x="20%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={16}
                        fontWeight={500}
                      >
                        Confirm required docs &amp; Start
                      </text>
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={16}
                        fontWeight={500}
                      >
                        Upload &amp; Prep
                      </text>
                      <text
                        x="80%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={16}
                        fontWeight={500}
                      >
                        Visit appointment
                      </text>
                    </svg>
                  </div>

                  <div className="grid md:grid-cols-3 gap-1 max-md:text-sm max-md:text-left px-5 mx-5">
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
  );
};

export default VisaInformation;
