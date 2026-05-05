//FaqLibraryPage.jsx

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GetTheVisaButton from "@/components/layout/GetTheVisaButton";
import { fetchFAQs as fetchFAQsFromAPI } from "@/api/faqs";
import { toSlug } from "@/utils/toSlug";

const ANSWER_LINKS = [
  { keyword: "Guarantee", href: "/our-guarantee" },
];

const renderAnswer = (text) => {
  if (!text) return null;
  let parts = [text];
  ANSWER_LINKS.forEach(({ keyword, href }) => {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return [part];
      const segments = part.split(keyword);
      return segments.flatMap((seg, i) =>
        i < segments.length - 1
          ? [seg, <Link key={`${keyword}-${i}`} href={href} className="text-[#7350FF] underline hover:opacity-80 transition-opacity">{keyword}</Link>]
          : [seg]
      );
    });
  });
  return parts;
};

const FAQ_CARD_ICON_MAP = {
  general_information: "/icons/faq/icon-1-general-information.svg",
  eligibility_requirements: "/icons/faq/icon-2-eligibility-requirements.svg",
  application_process: "/icons/faq/icon-3-application-process.svg",
  travel_insurance: "/icons/faq/icon-4-travel-insurance.svg",
  embassy_appointment: "/icons/faq/icon-5-embassy-appointment.svg",
  digital_gift_card: "/icons/faq/icon-6-digital-gift-card.svg",
  partner_and_children: "/icons/faq/icon-7-partner-children.svg",
  extend_visa: "/icons/faq/icon-8-extend-visa.svg",
  approval_rejection_reapply: "/icons/faq/icon-9-approval-rejections.svg",
};

const FAQ_CARD_CONTENT = [
  {
    title: "General information",
    description:
      "Everything you need to know about Schengen visas — what they are, how they work, and which countries they cover",
    icon: "general_information",
  },
  {
    title: "Eligibility & requirements",
    description:
      "Find out who can apply, what documents you'll need, and whether you meet the criteria for a Schengen visa",
    icon: "eligibility_requirements",
  },
  {
    title: "The application process",
    description:
      "A step-by-step guide to completing your Schengen visa application with confidence",
    icon: "application_process",
  },
  {
    title: "Travel insurance",
    description:
      "Understand the travel insurance requirements for your Schengen visa and make sure your policy meets them",
    icon: "travel_insurance",
  },
  {
    title: "Embassy appointment",
    description:
      "Everything you need to know about availability, preparing for, and attending your appointment at the embassy",
    icon: "embassy_appointment",
  },
  {
    title: "Price match promise",
    description:
      "Discover how our digital gift card works and how it can be used as a gift of unforgettable memories",
    icon: "digital_gift_card",
  },
  {
    title: "Your partner and children",
    description:
      "Guidance on including your spouse, partner, or children in your visa application or applying on their behalf",
    icon: "partner_and_children",
  },
  {
    title: "Extend your visa",
    description:
      "Find out if you can extend your stay beyond your current Schengen visa validity",
    icon: "extend_visa",
  },
  {
    title: "Approval, rejections & reapplication",
    description:
      "Understand what happens after a decision is made — including what to do if your application is refused and how to reapply",
    icon: "approval_rejection_reapply",
  },
];

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

    const groupsBySlug = new Map(
      Array.from(groups.entries()).map(([name, items], index) => [
        toSlug(name) || `category-${index + 1}`,
        {
          name,
          id: toSlug(name) || `category-${index + 1}`,
          items,
        },
      ])
    );

    const ordered = [];

    FAQ_CARD_CONTENT.forEach((card) => {
      const slug = toSlug(card.title);
      const matched = groupsBySlug.get(slug);
      if (matched) {
        ordered.push(matched);
        groupsBySlug.delete(slug);
      }
    });

    // Append any categories not present in FAQ_CARD_CONTENT at the end
    ordered.push(...Array.from(groupsBySlug.values()));

    return ordered;
  }, [faqs]);


  // render faqs answers
   

  const faqCategoryCards = useMemo(() => {
    const groupsBySlug = new Map(groupedFaqs.map((group) => [toSlug(group.name), group]));

    return FAQ_CARD_CONTENT.map((card) => {
      const matchedGroup = groupsBySlug.get(toSlug(card.title));
      return {
        id: matchedGroup?.id || toSlug(card.title),
        title: card.title,
        description: card.description,
        iconPath:
          FAQ_CARD_ICON_MAP[card.icon] ||
          "/icons/faq/icon-1-general-information.svg",
      };
    });
  }, [groupedFaqs]);

  const hasFaqs = groupedFaqs.length > 0;

  return (
    <div className="min-h-screen bg-[#f7f3ff]">
      <div className="pri_bg text-white pb-12">
        <Navbar />

        <section className="max-w-6xl mx-auto mb-4 pt-10 md:pt-16 text-center">
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
                {faqCategoryCards.map((group) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    className="group rounded-xl border border-[#ebe3ff] bg-[#f6f0ff] px-6 py-8 hover:bg-[#7350FF] transition-all duration-300 flex flex-col items-center text-center gap-4 min-h-[200px] justify-between"
                  >
                    {/* Title */}
                    <h3 className="font-gilroy-bold text-lg text-[#1E1E27] group-hover:text-white transition-colors">
                      {group.title}
                    </h3>

                    {/* Icon */}
                    <Image
                      src={group.iconPath}
                      alt={group.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 shrink-0 group-hover:scale-110 transition-all duration-300"
                    />

                    {/* Description / question count */}
                    <p className="text-sm text-neutral-500 group-hover:text-purple-100 transition-colors leading-snug">
                      {group.description}
                    </p>
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
          {groupedFaqs.map((group) => (
            <article
              id={group.id}
              key={group.id}
              className='rounded-2xl border px-5 md:px-8 py-6 md:py-8 bg-white border-none'
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
                        className={`w-full text-left px-4 md:px-5 py-4 flex items-center justify-between gap-3 transition-colors ${isOpen ? "bg-[#f1e8ff]" : "bg-white hover:bg-[#f8f8fb]"
                          }`}
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
                        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                      >
                        <div className="overflow-hidden">
                          <pre className="px-4 md:px-5 pt-2 pb-4 text-neutral-700 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap font-sans">
                            {renderAnswer(item.answer)}
                          </pre>
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
