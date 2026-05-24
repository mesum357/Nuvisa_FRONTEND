import { DEFAULT_VISA_PRICING_API_RESPONSE } from "@/data/defaultVisaPricing";

const withFallbackIfEmpty = (data) => {
  const results = data?.data?.results;
  if (Array.isArray(results) && results.length > 0) {
    return data;
  }
  return DEFAULT_VISA_PRICING_API_RESPONSE;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { getAdminApiBase, getPublicApiBase } = await import("@/utils/adminApiBase");
    const adminUrl = getAdminApiBase().replace(/\/+$/, "");
    const apiUrl = getPublicApiBase();
    const bases = [apiUrl, adminUrl].filter(Boolean);
    const paths = [
      "/visa_pricing",
      "/visa-pricing",
      "/api/visa_pricing",
      "/api/visa-pricing",
      "/api/public/visa_pricing",
      "/api/public/visa-pricing",
    ];
    const endpoints = bases.flatMap((base) => paths.map((path) => `${base}${path}`));

    let lastStatus = null;
    let lastError = "";
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          lastStatus = response.status;
          continue;
        }

        const data = await response.json();
        return res.status(200).json(withFallbackIfEmpty(data));
      } catch (error) {
        lastError = error?.message || "Network error";
        // Try next endpoint
      }
    }

    return res.status(200).json(DEFAULT_VISA_PRICING_API_RESPONSE);
  } catch (error) {
    console.error("Error fetching visa pricing:", error);
    return res.status(500).json({ error: "Failed to fetch visa pricing" });
  }
}
