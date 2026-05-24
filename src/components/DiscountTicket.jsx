// DiscountTicket.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";

const DISCOUNT_CODE_HASH = "discount-code";
const FALLBACK_DISCOUNT_LINK = `/get-the-visa#${DISCOUNT_CODE_HASH}`;
const SHOW_AFTER_MS = 4500;

const getDiscountTicketHref = (content) => {
  const configuredLink = content?.discountTicketLink?.trim();
  if (!configuredLink) return FALLBACK_DISCOUNT_LINK;

  const [baseLink] = configuredLink.split("#");
  return `${baseLink || "/get-the-visa"}#${DISCOUNT_CODE_HASH}`;
};

const DiscountTicket = ({ content }) => {
  const [visible, setVisible] = useState(true);
  const [showTicket, setShowTicket] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const reveal = () => {
      setShowTicket(true);
      requestAnimationFrame(() => setAnimateIn(true));
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(reveal, { timeout: SHOW_AFTER_MS });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(reveal, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !showTicket) return null;

  return (
    <div
      className="fixed left-0 top-[110%] -translate-y-[110%] sm:top-[62.5%] sm:-translate-y-[62.5%] z-50 flex items-center transition-transform duration-700 ease-out pointer-events-none"
      style={{
        transform: `translateY(-62.5%) translateX(${animateIn ? "0%" : "-100%"})`,
      }}
      aria-hidden={!animateIn}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
        className="pointer-events-auto absolute -top-3 -right-3 hover:rotate-180 duration-500 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center shadow-md z-10 hover:bg-gray-100 transition"
        aria-label="Close discount ticket"
      >
        <X size={11} strokeWidth={2.5} />
      </button>

      <Link
        href={getDiscountTicketHref(content)}
        className="pointer-events-auto"
      >
        <div
          className="sec_bg border-r-0 border-l border-t border-b border-[#423577] text-white text-xs font-bold tracking-widest cursor-pointer select-none"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            padding: "14px 8px",
            borderRadius: "8px 0 0 8px",
            letterSpacing: "0.12em",
            boxShadow: "2px 0 12px rgba(0,0,0,0.18)",
          }}
        >
          {content.discountTicketText}
        </div>
      </Link>
    </div>
  );
};

export default DiscountTicket;
