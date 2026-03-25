import Image from "next/image";
import { useProcessContent } from "@/hooks/useProcessContent";

const VisaProcessSection = () => {
  const { processContent, loading: processLoading } = useProcessContent();

  return (
    <div className="px-3 pt-3 w-full flex items-center justify-center overflow-hidden">
      <div className="text-[#fff] w-full rounded-3xl md:py-5 md:px-5 text-center shadow-2xl mt-10 md:mt-20 max-w-[88rem] overflow-x-hidden">
        <div className="row justify-content-center">
          <div className="col-12 py-4">
            <div className="pdp_media_el bg-purple p-3 pt-5 pb-5">
              <div className="w-full flex gap-5 md:gap-10 max-md:flex-col mb-10 overflow-hidden">
                <h2 className="text-3xl md:text-6xl font-gilroy-bold text-[#FFF] text-start flex-1">
                  {processLoading ? (
                    "Loading..."
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: processContent.heading }} />
                  )}
                </h2>
                <p className="text-white text-[13px] md:text-base font-medium leading-relaxed flex-[.6] text-left">
                  {processLoading ? "Loading..." : processContent.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="flex flex-col text-left">
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
                      {processLoading ? "Loading..." : processContent.steps?.[0]?.title}
                    </h1>
                  </div>
                  <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px] md:text-base">
                    {processLoading ? "Loading..." : processContent.steps?.[0]?.description}
                  </p>
                </div>

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
                      {processLoading ? "Loading..." : processContent.steps?.[1]?.title}
                    </h1>
                  </div>
                  <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px] md:text-base">
                    {processLoading ? "Loading..." : processContent.steps?.[1]?.description}
                  </p>
                </div>

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
                      {processLoading ? "Loading..." : processContent.steps?.[2]?.title}
                    </h1>
                  </div>
                  <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px] md:text-base">
                    {processLoading ? "Loading..." : processContent.steps?.[2]?.description}
                  </p>
                </div>

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
                      {processLoading ? "Loading..." : processContent.steps?.[3]?.title}
                    </h1>
                  </div>
                  <p className="font-medium leading-relaxed mt-3 md:mt-0 opacity-90 text-[14px] md:text-base">
                    {processLoading ? "Loading..." : processContent.steps?.[3]?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaProcessSection;
