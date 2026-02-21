import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenText, ChevronDown, ChevronUp, CircleHelp, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GetTheVisaButton from "@/components/layout/GetTheVisaButton";
import { fetchFAQs as fetchFAQsFromAPI } from "@/api/faqs";
import { toSlug } from "@/utils/toSlug";

const CATEGORY_ICONS = [BookOpenText, CircleHelp, FileText];

const FaqLibraryPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const data = await fetchFAQsFromAPI();
        setFaqs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const groupedFaqs = useMemo(() => {
    const groups = new Map();

    faqs
      .slice()
      .sort((a, b) => {
        const aOrder = Number.isFinite(a?.order) ? a.order : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(b?.order) ? b.order : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a?.question || "").localeCompare(b?.question || "");
      })
      .forEach((item) => {
        const category = (item?.category || "General").trim() || "General";
        if (!groups.has(category)) {
          groups.set(category, []);
        }
        groups.get(category).push(item);
      });

    return Array.from(groups.entries()).map(([name, items], index) => ({
      name,
      id: toSlug(name) || `category-${index + 1}`,
      items,
      Icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length],
    }));
  }, [faqs]);

  const hasFaqs = groupedFaqs.length > 0;

  return (
    <div className="min-h-screen bg-[#f7f3ff]">
      <div className="pri_bg text-white px-5 md:px-10 pb-12">
        <Navbar />

        <section className="max-w-6xl mx-auto pt-10 md:pt-16 text-center">
          <p className="public_text_clr font-gilroy-bold tracking-[0.2em] text-xs md:text-sm uppercase mb-4">
            Knowledge Library
          </p>
          <h1 className="font-gilroy-bold text-4xl md:text-6xl leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-neutral-300 max-w-2xl mx-auto text-base md:text-lg">
            Everything you need to know about our visa service, process, and policies in one place.
            Browse by category or jump directly to a section below.
          </p>
        </section>
      </div>

      <main className="-mt-6 md:-mt-10">
        <section className="max-w-6xl mx-auto px-5 md:px-6">
          <div className="bg-white rounded-3xl border border-[#e9ddff] shadow-sm p-5 md:p-8">
            <h2 className="font-gilroy-bold text-2xl md:text-3xl text-[#1E1E27] text-center mb-6">Browse by category</h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-30 animate-pulse rounded-xl border border-[#ebe3ff] bg-[#f7f3ff]"
                  />
                ))}
              </div>
            ) : hasFaqs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedFaqs.map((group) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    className="group rounded-xl border border-[#ebe3ff] bg-[#f6f0ff] px-5 py-4 hover:bg-[#ede3ff] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-gilroy-bold text-lg text-[#1E1E27]">{group.name}</h3>
                        <p className="text-sm text-neutral-600 mt-1">
                          {group.items.length} question{group.items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <group.Icon className="w-5 h-5 text-[#7350FF] shrink-0 group-hover:scale-110 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-600">No FAQs are available right now. Please check again soon.</p>
              </div>
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 md:px-6 py-10 md:py-14 space-y-7 md:space-y-8">
          {groupedFaqs.map((group, sectionIndex) => (
            <article
              id={group.id}
              key={group.id}
              className={`rounded-2xl border px-5 md:px-8 py-6 md:py-8 ${
                sectionIndex % 2 === 0
                  ? "bg-[#f1f9f5] border-[#d9efe4]"
                  : "bg-white border-[#ebe3ff]"
              }`}
            >
              <h2 className="font-gilroy-bold text-2xl md:text-3xl text-[#1E1E27] mb-5">{group.name}</h2>

              <div className="space-y-3">
                {group.items.map((item, itemIndex) => {
                  const itemKey = `${group.id}-${item.id || itemIndex}`;
                  const isOpen = activeItem === itemKey;

                  return (
                    <div key={itemKey} className="rounded-lg border border-[#dde6e2] bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActiveItem(isOpen ? null : itemKey)}
                        aria-expanded={isOpen}
                        className="w-full text-left px-4 md:px-5 py-4 flex items-center justify-between gap-3 hover:bg-[#f8f8fb] transition-colors"
                      >
                        <span className="text-[#1E1E27] font-gilroy-medium text-[15px] md:text-base">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-[#7350FF] shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#7350FF] shrink-0" />
                        )}
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 md:px-5 pt-2 pb-4 text-neutral-700 text-sm md:text-[15px] leading-relaxed">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="max-w-6xl mx-auto px-5 md:px-6 pb-14 text-center">
          <div className="rounded-3xl border border-[#ebe3ff] bg-white px-5 md:px-10 py-10">
            <h3 className="font-gilroy-bold text-3xl text-[#1E1E27] mb-3">Get Started</h3>
            <p className="text-neutral-600 max-w-xl mx-auto mb-8">
              Our team is ready to help you submit your visa application with clear steps and expert support.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {groupedFaqs.map((group) => (
                <a
                  key={`quick-${group.id}`}
                  href={`#${group.id}`}
                  className="text-sm md:text-base px-4 py-2 rounded-md bg-[#f1e8ff] text-[#5f45d1] hover:bg-[#e8dbff] transition-colors"
                >
                  {group.name}
                </a>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <GetTheVisaButton btnClassName="tracking-[0.08em]" />
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-full border border-[#7350FF] text-[#7350FF] font-medium hover:bg-[#7350FF] hover:text-white transition-colors"
              >
                Track an application
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FaqLibraryPage;