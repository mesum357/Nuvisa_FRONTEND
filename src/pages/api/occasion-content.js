import {
  DEFAULT_OCCASION_SECTION,
  DEFAULT_OCCASIONS,
} from "@/constants/defaultOccasions";

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

function resolveAdminBase() {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    "https://nuvisa-admin.vercel.app";
  return String(raw).replace(/\/+$/, "");
}

function withDefaults(data) {
  const occasions =
    Array.isArray(data?.occasions) && data.occasions.length > 0
      ? data.occasions
      : DEFAULT_OCCASIONS;

  return {
    title: data?.title || DEFAULT_OCCASION_SECTION.title,
    description: data?.description || DEFAULT_OCCASION_SECTION.description,
    occasions,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  if (cache.data && cache.expiresAt > now) {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(cache.data);
  }

  const adminBase = resolveAdminBase();
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  let payload = null;

  try {
    const adminRes = await fetch(`${adminBase}/api/occasion-content`, {
      headers: { Accept: "application/json" },
    });
    if (adminRes.ok) {
      const json = await adminRes.json();
      if (json?.success && json?.data) {
        payload = {
          success: true,
          data: withDefaults(json.data),
          source: "admin",
        };
      }
    }
  } catch (e) {
    console.warn("occasion-content admin:", e?.message);
  }

  if (!payload && apiBase) {
    try {
      const cmsRes = await fetch(`${apiBase}/cms/homepage`, {
        headers: { Accept: "application/json" },
      });
      if (cmsRes.ok) {
        const cmsJson = await cmsRes.json();
        const fields = cmsJson?.data?.results || cmsJson?.results || {};
        const occasions = parseOccasionsJson(fields.occasions_json);
        payload = {
          success: true,
          data: withDefaults({
            title:
              fields.occasion_section_title ||
              fields.ocassion_title ||
              "",
            description:
              fields.occasion_section_subtitle ||
              fields.ocassion_subtitle ||
              "",
            occasions,
          }),
          source: "backend-cms",
        };
      }
    } catch (e) {
      console.warn("occasion-content backend:", e?.message);
    }
  }

  if (!payload) {
    payload = {
      success: true,
      data: withDefaults({}),
      source: "defaults",
    };
  }

  cache = { data: payload, expiresAt: now + CACHE_TTL_MS };
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res.status(200).json(payload);
}
