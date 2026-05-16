import { useEffect, useMemo, useState } from "react";
import { getFaqGroupKey } from "@/utils/faqHelpers";

const ADMIN_FAQ_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL || "https://nuvisa-admin.vercel.app";

export default function FaqCmsPanel() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/faqs");
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        setFaqs(list);
        if (!list.length) {
          setError("No FAQs returned from the live API.");
        }
      } catch (e) {
        setError(e.message || "Failed to load FAQs");
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map();
    faqs.forEach((faq) => {
      const key = getFaqGroupKey(faq) || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(faq);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [faqs]);

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-2">FAQs (live on website)</h2>
      <p className="text-white/50 text-sm mb-4">
        The homepage and <code className="text-[#c4b5fd]">/faq</code> read from{" "}
        <strong className="text-white/80">nuvisa-admin</strong>{" "}
        <code className="text-[#c4b5fd]">/api/public/faqs</code> (field:{" "}
        <code className="text-[#c4b5fd]">category</code>). Edit categories and
        questions in the external admin. If the FAQ list there looks empty but
        you see items below, the admin UI may still be filtering by legacy{" "}
        <code className="text-[#c4b5fd]">faqType</code> — republish using{" "}
        <code className="text-[#c4b5fd]">category</code> only.
      </p>
      <a
        href={`${ADMIN_FAQ_URL.replace(/\/+$/, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-[#c4b5fd] hover:underline mb-4"
      >
        Open nuvisa-admin →
      </a>

      {loading && <p className="text-white/50 text-sm">Loading live FAQs…</p>}
      {error && !loading && (
        <p className="text-amber-300 text-sm mb-2">{error}</p>
      )}
      {!loading && byCategory.length > 0 && (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {byCategory.map(([category, items]) => (
            <div key={category} className="border border-white/10 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-[#c4b5fd] mb-2">
                {category}{" "}
                <span className="text-white/40 font-normal">({items.length})</span>
              </h3>
              <ul className="space-y-1 text-xs text-white/70">
                {items.slice(0, 5).map((faq) => (
                  <li key={faq.id} className="truncate">
                    {faq.question}
                  </li>
                ))}
                {items.length > 5 && (
                  <li className="text-white/40">+{items.length - 5} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
