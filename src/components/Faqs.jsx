import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      // Choose a single endpoint to avoid multiple requests
      const adminEndpoint = process.env.NEXT_PUBLIC_ADMIN_API_URL
        ? `${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/public/faqs`
        : null;
      const endpoint = adminEndpoint || '/api/faqs';

      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to fetch FAQs (${response.status})`);
      const data = await response.json();
      if (!data?.success || !data?.data) throw new Error('Invalid FAQ response');
      setFaqs(data.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };


  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8  w-full  mx-auto flex-col gap-3 flex items-center justify-center bg-[#F3E5FF]">
      <div className=" max-w-2xl mx-auto w-full">
        <h1 className="text-gray-800 font-gilroy-bold text-4xl">FAQ</h1>
        <h2 className="text-4xl mt-1 font-gilroy-bold text-gray-800 mb-6">
          Empowering you with knowledge{" "}
        </h2>

        <div className="space-y-4 w-full ">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gray-500">Loading FAQs...</div>
            </div>
          ) : (
            faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 w-full"
              >
                <button
                  className="w-full flex justify-between items-center p-5 gap-2 text-left bg-gray-50 hover:bg-purple-50 transition-colors"
                  onClick={() => toggleAccordion(index)}
                >
                  <h3 className="text-lg font-medium text-gray-800">
                    {faq.question}
                  </h3>
                  {activeIndex === index ? (
                    <ChevronUp className="text-[#7350FF]" />
                  ) : (
                    <ChevronDown className="text-[#7350FF]" />
                  )}
                </button>

                {activeIndex === index && (
                  <div className="p-5 bg-white text-gray-600 ">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* <section className="w-full mt-[30px]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-gilroy-bold text-center text-gray-800 mb-12">
            Why Choose Our Visa Service?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-[32px] font-semibold text-center text-gray-800 mb-6">
                Travel Agency
              </h3>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">$250-$300 + extra fees</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    Traditional, often heavy-paperwork
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    Appointment in 6-8 weeks
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    Application business hours only
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    In-person or lengthy phone appointments
                  </span>
                </li>
              </ul>
            </div>


            <div className="flex items-center justify-center">
              <div className="bg-purple-100 text-purple-800 font-gilroy-bold rounded-full w-12 h-12 flex items-center justify-center">
                VS
              </div>
            </div>


            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-purple-200 relative">
              <div className="absolute top-0 right-0 bg-[#7350FF] text-white text-xs font-gilroy-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                RECOMMENDED
              </div>

              <h3 className="text-[32px] font-semibold text-center text-[#6247D3] mb-6">
                Our Visa Service
              </h3>

              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    Flat $200 - no hidden fees
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    AI powered seamless process
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    Appointment in 10 days or less
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    24/7 instant submission & tracking
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-700">
                    Complete digital experience
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section> */}

      {/* <section className="py-16 px-4 flex items-center flex-col w-full justify-center gap-[43px] sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-gilroy-bold text-center text-gray-800 mb-4">
            Pairs together for seamless experience
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Bundle these essential services for your visa application
          </p>

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="bg-purple-100 p-4 rounded-lg w-16 h-16 flex items-center justify-center">
                  <ShieldCheck className="text-[#7350FF]" size={28} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Insurance Certificate
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Travel insurance certificate is required document for the
                    Schengen visa, add to your cart for a seamless experience.
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-500 line-through mr-3">
                        £45
                      </span>
                      <span className="text-2xl font-gilroy-bold text-[#7350FF]">
                        £29
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-6"></div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="bg-purple-100 p-4 rounded-lg w-16 h-16 flex items-center justify-center">
                  <Gift className="text-[#7350FF]" size={28} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    NUVisa Digital Gift Card
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Give the gift of unforgettable memories this Christmas!
                    Order now and your digital gift card will be sent to your
                    email address immediately.
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-gray-500 line-through mr-3">
                        £245
                      </span>
                      <span className="text-2xl font-gilroy-bold text-[#7350FF]">
                        £188
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <GetTheVisaButton />
      </section> */}
    </section>
  );
};

export default FAQSection;
