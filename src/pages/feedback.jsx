"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !message.trim()) {
      setError("Email and message are required.");
      return;
    }

    setSubmitting(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          message: message.trim(),
          rating: Number(rating) || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Failed to submit feedback");
      }
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1E1E27] text-white">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-gilroy-bold mb-2">Leave us your feedback</h1>
        <p className="text-white/60 mb-8 text-sm">
          Tell us about your experience. We read every message.
        </p>

        {done ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-lg font-medium mb-4">Thank you for your feedback!</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#7350FF] rounded-lg font-medium hover:bg-[#6247D3] transition-colors"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <div>
              <label className="block text-sm text-white/70 mb-1">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7350FF]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7350FF]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7350FF]"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n} className="text-black">
                    {n} / 5
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Message *</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7350FF] resize-y"
                placeholder="What went well? What could we improve?"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#7350FF] hover:bg-[#6247D3] disabled:opacity-50 rounded-lg font-semibold transition-colors"
            >
              {submitting ? "Sending..." : "Submit feedback"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
