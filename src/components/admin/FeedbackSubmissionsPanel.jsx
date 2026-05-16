import { useEffect, useState } from "react";
import { getFeedbackSubmissions } from "@/api/admin";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";

export default function FeedbackSubmissionsPanel() {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getFeedbackSubmissions(token);
        const data = res?.data?.data?.results || res?.data?.results || {};
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total) || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-1">Customer feedback</h2>
      <p className="text-white/50 text-sm mb-4">
        Submissions from the public form at{" "}
        <span className="text-white/80">/feedback</span> (also linked in the site footer).
      </p>
      {loading ? (
        <p className="text-white/50 text-sm">Loading feedback...</p>
      ) : items.length === 0 ? (
        <p className="text-white/50 text-sm">No feedback submissions yet.</p>
      ) : (
        <ul className="space-y-3 max-h-[420px] overflow-y-auto list-none p-0 m-0">
          {items.map((row) => (
            <li
              key={row.id}
              className="border border-white/10 rounded-lg p-4 bg-black/20"
            >
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-white font-medium">
                  {row.name || "Anonymous"}
                </span>
                <span className="text-white/50">{row.email}</span>
              </div>
              {row.rating != null && (
                <p className="text-amber-400 text-xs mt-1">
                  Rating: {row.rating}/5
                </p>
              )}
              <p className="text-white/80 text-sm mt-2 whitespace-pre-wrap">
                {row.message}
              </p>
              {row.createdAt && (
                <p className="text-white/40 text-xs mt-2">
                  {new Date(row.createdAt).toLocaleString("en-GB")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {total > items.length && (
        <p className="text-white/40 text-xs mt-3">
          Showing {items.length} of {total} submissions
        </p>
      )}
    </section>
  );
}
