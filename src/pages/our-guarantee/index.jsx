import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import OurMission from "@/components/OurMission";
import React from "react";

const OurGuarantee = () => {
  return (
    <div className="min-h-screen bg-[#f7f3ff]">
      <div className="pri_bg text-white pb-12">
        <Navbar />

        <section className="max-w-6xl mx-auto mb-4 pt-10 md:pt-16 text-center">
          <h1 className="font-gilroy-bold text-4xl md:text-6xl leading-tight mb-4">
            Our Guarantee
          </h1>
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

                This is not just a guarantee; it is a reflection of the confidence we have in our process. Our success is built on a practice of approaching each application with the highest level of care and attention to detail, and before anything is submitted, it is thoroughly reviewed by our experts to give your application 100% chance of approval.<br /><br />
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
