import {
  createFaq,
  deleteFaq,
  listAllFaqs,
  updateFaq,
} from "@/lib/faqsAdminDb";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = await listAllFaqs();
      return res.status(200).json({ success: true, data });
    }

    if (req.method === "POST") {
      const row = await createFaq(req.body || {});
      return res.status(201).json({ success: true, data: row });
    }

    if (req.method === "PUT") {
      const id = req.body?.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing id" });
      }
      const row = await updateFaq(String(id), req.body || {});
      return res.status(200).json({ success: true, data: row });
    }

    if (req.method === "DELETE") {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "Missing id" });
      }
      await deleteFaq(String(id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin/faqs:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "FAQ operation failed",
    });
  }
}
