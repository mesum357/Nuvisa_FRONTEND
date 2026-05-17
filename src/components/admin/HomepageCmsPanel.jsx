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
  occasion_section_title: "GREAT VALUE — £50 off your plan ahead",
  occasion_section_subtitle:
    "Lock it in today to maximise savings on top destinations.",
  occasions_json: JSON.stringify(
    [
      {
        title: "February Half Term 2026",
        subTitle: "School break travel",
        bgColor: "#5f9aff",
        textColor: "#ffffff",
      },
      {
        title: "Easter Break 2026",
        subTitle: "Spring getaway",
        bgColor: "#ff8e59",
        textColor: "#ffffff",
      },
      {
        title: "Summer Holidays 2026",
        subTitle: "Peak season deals",
        bgColor: "#daee69",
        textColor: "#1a1a1a",
      },
      {
        title: "October Half Term 2026",
        subTitle: "Autumn escape",
        bgColor: "#fdfd55",
        textColor: "#1a1a1a",
      },
    ],
    null,
    2
  ),
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

  const handleImportFromLiveSite = async () => {
    try {
      const res = await fetch("/api/occasion-content?defaults=true");
      const json = await res.json();
      const data = json?.data || {};
      setFields((f) => ({
        ...f,
        occasion_section_title: data.title || f.occasion_section_title,
        occasion_section_subtitle: data.description || f.occasion_section_subtitle,
        occasions_json:
          data.occasions?.length > 0
            ? JSON.stringify(data.occasions, null, 2)
            : f.occasions_json,
      }));
      setMessage(
        `Loaded preview from ${json.source || "API"}. Edit and Save to persist to the homepage.`
      );
    } catch (e) {
      setMessage(e.message || "Import failed");
    }
  };

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
      <p className="text-white/50 text-sm mb-6">
        Edit homepage sections. Price Match controls the guarantee block above the footer.
      </p>
      <div className="space-y-6">
        <h3
          id="top-destinations-cms"
          className="text-sm font-semibold text-white/90 uppercase tracking-wide pt-2"
        >
          Top destinations
        </h3>
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
        <h3
          id="occasions-cms"
          className="text-sm font-semibold text-white/90 uppercase tracking-wide pt-4 border-t border-white/10"
        >
          Everyday Steals / Occasions (yellow banner + coloured cards)
        </h3>
        <p className="text-xs text-white/40">
          Primary source: shared Postgres table{" "}
          <code className="text-[#c4b5fd]">occasion_content</code> (same as nuvisa-admin →
          Occasion Content). Use nuvisa-admin to edit boxes; the site reads that table
          automatically. Fields below are optional override via backend CMS.
        </p>
        <div>
          <label className="text-xs text-white/50">Occasion banner title</label>
          <input
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.occasion_section_title || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, occasion_section_title: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Occasion banner subtitle</label>
          <input
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"
            value={fields.occasion_section_subtitle || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, occasion_section_subtitle: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-xs text-white/50">Occasion cards (JSON array)</label>
          <textarea
            rows={8}
            className="w-full mt-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono"
            value={fields.occasions_json || ""}
            onChange={(e) =>
              setFields((f) => ({ ...f, occasions_json: e.target.value }))
            }
          />
        </div>
        <h3
          id="price-match-cms"
          className="text-sm font-semibold text-[#c4b5fd] uppercase tracking-wide pt-4 border-t border-white/10"
        >
          Price Match Promise (homepage guarantee section)
        </h3>
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
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleImportFromLiveSite}
          className="px-5 py-2 border border-white/20 hover:bg-white/10 rounded-lg text-sm font-medium"
        >
          Preview live API data
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-6 py-2 bg-[#7350FF] rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save homepage content"}
        </button>
      </div>
    </div>
  );
}
