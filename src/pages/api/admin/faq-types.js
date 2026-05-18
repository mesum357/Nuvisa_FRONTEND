import { ensureFaqType, listFaqTypes } from "@/lib/faqsAdminDb";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = await listFaqTypes();
      return res.status(200).json({ success: true, data });
    }

    if (req.method === "POST") {
      const name = req.body?.name || req.body?.title;
      if (!name) {
        return res.status(400).json({ success: false, error: "Missing name" });
      }
      const row = await ensureFaqType(name);
      return res.status(201).json({ success: true, data: row });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin/faq-types:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "FAQ type operation failed",
    });
  }
}
