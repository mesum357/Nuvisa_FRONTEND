import { useCallback, useEffect, useMemo, useState } from "react";
import { getFaqGroupKey } from "@/utils/faqHelpers";

const STABLE_ADMIN_URL = "https://nuvisa-admin.vercel.app";

const emptyForm = {
  id: "",
  question: "",
  answer: "",
  category: "",
  order: 0,
  isActive: true,
};

export default function FaqCmsPanel() {
  const [faqs, setFaqs] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [faqRes, typeRes] = await Promise.all([
        fetch("/api/admin/faqs"),
        fetch("/api/admin/faq-types"),
      ]);
      const faqJson = await faqRes.json();
      const typeJson = await typeRes.json();
      setFaqs(Array.isArray(faqJson?.data) ? faqJson.data : []);
      setTypes(Array.isArray(typeJson?.data) ? typeJson.data : []);
    } catch (e) {
      setError(e.message || "Failed to load FAQs");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byCategory = useMemo(() => {
    const map = new Map();
    faqs.forEach((faq) => {
      const key = getFaqGroupKey(faq) || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(faq);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [faqs]);

  const categoryOptions = useMemo(() => {
    const names = new Set(types.map((t) => t.name).filter(Boolean));
    faqs.forEach((f) => {
      const k = getFaqGroupKey(f);
      if (k) names.add(k);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [types, faqs]);

  const showForm = Boolean(form.id || form.question || form.answer);

  const startEdit = (faq) => {
    setMessage("");
    setForm({
      id: faq.id,
      question: faq.question || "",
      answer: faq.answer || "",
      category: getFaqGroupKey(faq) || "",
      order: faq.order ?? 0,
      isActive: faq.isActive !== false,
    });
  };

  const startNew = () => {
    setMessage("");
    setForm({
      ...emptyForm,
      category: categoryOptions[0] || "",
    });
  };

  const saveFaq = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const isNew = !form.id;
      const res = await fetch("/api/admin/faqs", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Save failed");
      }
      setMessage(isNew ? "FAQ created." : "FAQ saved.");
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const removeFaq = async (id) => {
    if (!id || !window.confirm("Delete this FAQ?")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/faqs?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Delete failed");
      }
      setMessage("FAQ deleted.");
      if (form.id === id) setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
      <h2 className="text-lg font-semibold text-white mb-2">FAQ content</h2>
      <p className="text-white/50 text-sm mb-3">
        The live site reads the shared Postgres <code className="text-[#c4b5fd]">faqs</code>{" "}
        table ({faqs.filter((f) => f.isActive !== false).length} active / {faqs.length}{" "}
        total).
      </p>
      <p className="text-amber-200/90 text-sm mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
        <strong>nuvisa-admin-updated</strong> FAQ API is broken (
        <code className="text-amber-100">/api/public/faqs</code> → 500). Use{" "}
        <a
          href={STABLE_ADMIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-amber-100"
        >
          nuvisa-admin.vercel.app
        </a>{" "}
        for TailAdmin, or edit below on this dashboard.
      </p>

      {!showForm ? (
        <button
          type="button"
          onClick={startNew}
          className="text-sm px-4 py-2 rounded-lg bg-[#7350FF] text-white hover:opacity-90"
        >
          + Add FAQ
        </button>
      ) : (
        <div className="mt-4 space-y-3 border border-white/10 rounded-lg p-4">
          <FaqEditorToolbar
            form={form}
            saving={saving}
            onSave={saveFaq}
            onCancel={() => setForm(emptyForm)}
          />
          <FaqEditorBody
            form={form}
            setForm={setForm}
            categoryOptions={categoryOptions}
          />
        </div>
      )}

      {message && <p className="text-emerald-300 text-sm mt-3">{message}</p>}
      {error && <p className="text-amber-300 text-sm mt-3">{error}</p>}
      {loading && <p className="text-white/50 text-sm mt-4">Loading…</p>}

      {!loading && byCategory.length > 0 && (
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 mt-6">
          {byCategory.map(([category, items]) => (
            <div key={category} className="border border-white/10 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-[#c4b5fd] mb-2">
                {category}{" "}
                <span className="text-white/40 font-normal">({items.length})</span>
              </h3>
              <ul className="space-y-2">
                {items.map((faq) => (
                  <li
                    key={faq.id}
                    className="flex items-start justify-between gap-2 text-xs text-white/70"
                  >
                    <span
                      className={
                        faq.isActive === false ? "line-through opacity-50" : ""
                      }
                    >
                      {faq.question}
                    </span>
                    <span className="shrink-0 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(faq)}
                        className="text-[#c4b5fd] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFaq(faq.id)}
                        className="text-red-300/80 hover:underline"
                      >
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FaqEditorToolbar({ form, saving, onSave, onCancel }) {
  return (
    <div className="flex flex-wrap gap-2 justify-between items-center">
      <h3 className="text-sm font-medium text-white">
        {form.id ? "Edit FAQ" : "New FAQ"}
      </h3>
      <FaqEditorToolbarActions
        saving={saving}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}

function FaqEditorToolbarActions({ saving, onSave, onCancel }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="text-xs px-3 py-1.5 rounded border border-white/20 text-white/70"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="text-xs px-3 py-1.5 rounded bg-[#7350FF] text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function FaqEditorBody({ form, setForm, categoryOptions }) {
  return (
    <>
      <label className="block text-xs text-white/60">
        Category
        <select
          className="mt-1 w-full rounded bg-black/40 border border-white/10 text-white text-sm px-2 py-2"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-white/60">
        Question
        <input
          className="mt-1 w-full rounded bg-black/40 border border-white/10 text-white text-sm px-2 py-2"
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
        />
      </label>
      <label className="block text-xs text-white/60">
        Answer
        <textarea
          rows={4}
          className="mt-1 w-full rounded bg-black/40 border border-white/10 text-white text-sm px-2 py-2"
          value={form.answer}
          onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
        />
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="text-xs text-white/60">
          Order
          <input
            type="number"
            className="mt-1 block w-20 rounded bg-black/40 border border-white/10 text-white text-sm px-2 py-1"
            value={form.order}
            onChange={(e) =>
              setForm((f) => ({ ...f, order: Number(e.target.value) || 0 }))
            }
          />
        </label>
        <label className="text-xs text-white/60 flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active on site
        </label>
      </div>
    </>
  );
}
