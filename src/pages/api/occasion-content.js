const CACHE_TTL_MS = 60 * 1000;
let cache = { data: null, expiresAt: 0 };

const parseOccasionsJson = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  if (cache.data && cache.expiresAt > now) {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(cache.data);
  }

  const { getAdminApiBase } = await import("@/utils/adminApiBase");
  const adminBase = getAdminApiBase();
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  let payload = null;

  // 1) External admin CMS (when deployed)
  try {
    const adminRes = await fetch(
      `${adminBase}/api/occasion-content?t=${Date.now()}`,
      { headers: { Accept: "application/json" } }
    );
    if (adminRes.ok) {
      const json = await adminRes.json();
      if (json?.success && json?.data) {
        payload = { success: true, data: json.data, source: "admin" };
      }
    }
  } catch (e) {
    console.warn("occasion-content admin fetch:", e?.message);
  }

  // 2) NUvisa backend site_content (Homepage CMS in /admin)
  if (!payload?.data && apiBase) {
    try {
      const cmsRes = await fetch(`${apiBase}/cms/homepage`, {
        headers: { Accept: "application/json" },
      });
      if (cmsRes.ok) {
        const cmsJson = await cmsRes.json();
        const fields = cmsJson?.data?.results || cmsJson?.results || {};
        const occasions = parseOccasionsJson(fields.occasions_json);
        if (
          occasions.length > 0 ||
          fields.occasion_section_title ||
          fields.occasion_section_subtitle ||
          fields.ocassion_title
        ) {
          payload = {
            success: true,
            data: {
              title:
                fields.occasion_section_title ||
                fields.ocassion_title ||
                "Everyday Steals",
              description:
                fields.occasion_section_subtitle ||
                fields.ocassion_subtitle ||
                "",
              occasions,
            },
            source: "backend-cms",
          };
        }
      }
    } catch (e) {
      console.warn("occasion-content backend fetch:", e?.message);
    }
  }

  if (!payload) {
    payload = { success: true, data: { title: "", description: "", occasions: [] }, source: "empty" };
  }

  cache = { data: payload, expiresAt: now + CACHE_TTL_MS };
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res.status(200).json(payload);
}
