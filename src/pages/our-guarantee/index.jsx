import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import OurMission from "@/components/OurMission";
import Image from "next/image";
import React, { useState, useEffect } from "react";

const OurGuarantee = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f3ff]">
      <div className="pri_bg text-white pb-12 overflow-visible">
        <Navbar />

        <section className="relative max-w-6xl mx-auto mb-4 pt-10 md:pt-16 text-center flex items-center flex-col overflow-visible">
          <div
            className="absolute -top-5 left-[45%] pointer-events-none"
            style={{ transform: `translateY(${-scrollY * 0.1}px)` }}
          >
            <Image src="/image/quill.png" width={250} height={250} alt="Quill" />
          </div>
          <h1 className="z-10 font-gilroy-bold text-4xl md:text-6xl leading-tight">
            Our Guarantee
          </h1>
          <p className="z-10 text-neutral-300 max-w-2xl mx-auto text-base md:text-lg">
            Professional support built around one goal: your visa approval.
          </p>
        </section>
      </div>
      <main className="-mt-6 md:-mt-10 mb-6 md:mb-10">
        <section className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="bg-white rounded-3xl border border-[#e9ddff] shadow-sm p-5 lg:p-20">
            <div
              className="rounded-3xl border border-[#ebe3ff] bg-[#f6f0ff] px-6 py-8 transition-all duration-300 flex flex-col items-center text-center gap-4 min-h-[200px] justify-between"
            >
              <p className="text-neutral-500 max-w-2xl mx-auto text-base md:text-xl py-10">
                At NUvisa, we want every customer to have complete peace of mind with the service they receive. For that reason, we offer our guarantee: you only pay our fee if the application is successful.<br /><br />

                Suppose the application is unsuccessful, you will receive a full refund.<br /><br />

                This is not just a guarantee; it is a reflection of the confidence we have in our process. Our success is built on a practice of approaching each application with the highest level of care and attention to detail, and before anything is submitted, it is thoroughly reviewed by experts to give your application 100% chance of approval.<br /><br />
              </p>
            </div>

          </div>
          <div className="bg-white rounded-3xl border border-[#e9ddff] shadow-sm p-5 md:p-8 mt-5">
            <p className="text-neutral-500 max-w-2xl mx-auto text-sm">
              Please note: this guarantee is not valid in the event of non disclosure of information, where the client has misled NUvisa in any way, provided counterfeit documents, or where the client fails Embassy verification checks. This guarantee does not apply to any applications which come under the influence of Embassy discretion or applicant unable to reach on time at their appointment.
            </p>
          </div>
        </section>
      </main>

      <OurMission />

      <Footer />
    </div>
  );
};

export default OurGuarantee;
