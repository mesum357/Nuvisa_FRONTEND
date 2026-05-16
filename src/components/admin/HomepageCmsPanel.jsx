import { useEffect, useState } from "react";
import { getHomepageCmsSettings, updateHomepageCmsSettings } from "@/api/admin";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";

const defaultFields = {
  topdestination_title: "Top Destinations",
  topdestination_subtitle:
    "Explore our most popular visa destinations loved by travellers worldwide.",
  topdestination_countries: JSON.stringify(
    [
      { name: "France", bgColor: "#5f9aff", isHidden: false },
      { name: "Spain", bgColor: "#ff8e59", isHidden: false },
    ],
    null,
    2
  ),
  price_match_title: "The NUvisa Price Match Promise",
  price_match_description:
    "At NUvisa, we want you to get your Schengen visa with total confidence, that's why we regularly review our prices.",
  price_match_tooltip:
    "We pride ourselves on our fair prices. Find it cheaper, and we'll match the price — that's a promise.",
};

export default function HomepageCmsPanel() {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const [fields, setFields] = useState(defaultFields);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getHomepageCmsSettings(token);
        const data = res?.data?.data?.results || res?.data?.results || {};
        setFields({ ...defaultFields, ...data });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateHomepageCmsSettings(token, fields);
      setMessage("Saved. Homepage will reflect changes on next load.");
    } catch (e) {
      setMessage(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-white/50 text-sm">Loading CMS settings...</p>;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Homepage content</h2>
      <p className="text-white/50 text-sm mb-4">
        Edit Top Destinations and Price Match sections shown on the public homepage.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-white/50">Top destinations title</label>
          <input
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.topdestination_title || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, topdestination_title: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Top destinations subtitle</label>
          <input
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.topdestination_subtitle || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, topdestination_subtitle: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Top destinations countries (JSON array)</label>
          <textarea
            rows={4}
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono"
            value={fields.topdestination_countries || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, topdestination_countries: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Price match title</label>
          <input
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.price_match_title || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, price_match_title: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Price match description</label>
          <textarea
            rows={3}
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.price_match_description || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, price_match_description: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Price match tooltip</label>
          <textarea
            rows={2}
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.price_match_tooltip || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, price_match_tooltip: e.target.value }))
            }
          />
        </div>
      </div>
      {message && <p className="text-sm text-emerald-400 mt-3">{message}</p>}
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="mt-4 px-6 py-2 bg-[#7350FF] rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save homepage content"}
      </button>
    </div>
  );
}
