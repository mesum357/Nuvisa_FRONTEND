import { useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchFAQs as fetchFAQsFromAPI } from '@/api/faqs';
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      const faqData = await fetchFAQsFromAPI({ isFeatured: true });
      setFaqs(Array.isArray(faqData) ? faqData : []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const faqTabs = useMemo(() => {
    const typeMeta = new Map();

    (Array.isArray(faqs) ? faqs : []).forEach((faq) => {
      const type = typeof faq?.faqType === 'string' ? faq.faqType.trim() : '';
      if (type) {
        const rawCreatedAt = faq?.faqTypeCreatedAt || faq?.createdAt || null;
        const createdAtMs = rawCreatedAt ? new Date(rawCreatedAt).getTime() : Number.MAX_SAFE_INTEGER;
        const existing = typeMeta.get(type);

        if (!existing) {
          typeMeta.set(type, {
            label: type,
            createdAtMs,
          });
          return;
        }

        if (createdAtMs < existing.createdAtMs) {
          existing.createdAtMs = createdAtMs;
        }
      }
    });

    return Array.from(typeMeta.entries())
      .sort((a, b) => {
        if (a[1].createdAtMs !== b[1].createdAtMs) {
          return a[1].createdAtMs - b[1].createdAtMs;
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([type, meta]) => ({
        value: type,
        label: meta.label,
      }));
  }, [faqs]);

  useEffect(() => {
    if (faqTabs.length === 0) {
      setActiveTab(null);
      return;
    }

    const tabStillExists = faqTabs.some((tab) => tab.value === activeTab);
    if (!tabStillExists) {
      setActiveTab(faqTabs[0].value);
      setActiveIndex(null);
      setShowAll(false);
    }
  }, [faqTabs, activeTab]);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqsByType = useMemo(() => {
    const grouped = {};

    // Initialize groups for each tab
    faqTabs.forEach(tab => {
      grouped[tab.value] = [];
    });

    (Array.isArray(faqs) ? faqs : [])
      .slice()
      .sort((a, b) => {
        const aOrder = Number.isFinite(a?.order) ? a.order : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(b?.order) ? b.order : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a?.question || '').localeCompare(b?.question || '');
      })
      .forEach((faq) => {
        const type = typeof faq?.faqType === 'string' ? faq.faqType.trim() : '';
        if (type && grouped.hasOwnProperty(type)) {
          grouped[type].push(faq);
        }
      });

    return grouped;
  }, [faqs, faqTabs]);

  const activeFaqs = activeTab && faqsByType[activeTab] ? faqsByType[activeTab] : [];


  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8  w-full  mx-auto flex-col gap-3 flex items-center justify-center bg-[#F3E5FF]">
      <div id="faq" className=" max-w-2xl mx-auto w-full">
        <h1 className="text-gray-800 font-gilroy-bold text-4xl">FAQ</h1>
        <h2 className="text-4xl mt-1 font-gilroy-bold text-gray-800 mb-6 flex items-center justify-between gap-2">
          Empowering you with knowledge{" "}
          <Link href={'/faq'}>
            <ArrowRight className="text-[#7350FF]" size={40} />
          </Link>
        </h2>

        <div className="mb-6 border-b border-[#D8C7FF] flex flex-wrap gap-6 sm:gap-8">
          {faqTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setActiveIndex(null);
                setShowAll(false);
              }}
              className={`relative pb-3 -mb-px font-gilroy-bold text-sm sm:text-base transition-colors duration-200 ${
                activeTab === tab.value
                  ? 'text-[#7350FF]'
                  : 'text-gray-500 hover:text-[#7350FF]'
              }`}
            >
              {tab.label}
              <span
                className={`absolute left-0 right-0 bottom-0 h-[2px] rounded-full transition-colors duration-200 ${
                  activeTab === tab.value ? 'bg-[#7350FF]' : 'bg-transparent'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4 w-full ">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gray-500">Loading FAQs...</div>
            </div>
          ) : activeFaqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No FAQs available in this section yet.
            </div>
          ) : (
            (showAll ? activeFaqs : activeFaqs.slice(0, 4)).map((faq, index) => (
              <div
                key={faq.id || `${activeTab}-${index}`}
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
        {!loading && activeFaqs.length > 4 && (
          <div className="w-full flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="px-6 py-2 font-bold rounded-md border border-[#7350FF] text-[#7350FF] hover:bg-[#7350FF] hover:text-white transition-colors"
            >
              {showAll ? 'See less' : 'See more'}
            </button>
          </div>
        )}
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
