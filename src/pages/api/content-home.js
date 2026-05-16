/** Public homepage key/value content (server proxy — admin /api/content requires auth). */
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { data: null, expiresAt: 0 };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  if (cache.data && cache.expiresAt > now) {
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    return res.status(200).json(cache.data);
  }

  const byKey = {};
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  if (apiBase) {
    try {
      const cmsRes = await fetch(`${apiBase}/cms/homepage`);
      if (cmsRes.ok) {
        const json = await cmsRes.json();
        Object.assign(byKey, json?.data?.results || json?.results || {});
      }
    } catch (e) {
      console.warn("content-home backend:", e?.message);
    }
  }

  const payload = { success: true, data: byKey };
  cache = { data: payload, expiresAt: now + CACHE_TTL_MS };
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
  return res.status(200).json(payload);
}
