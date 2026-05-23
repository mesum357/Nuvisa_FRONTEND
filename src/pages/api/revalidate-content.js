/** Clears in-memory caches used by public content proxy routes after admin saves. */
import { clearContentApiCaches } from "@/lib/contentApiCache";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.REVALIDATE_SECRET || "";
  const provided = req.body?.secret || req.headers["x-revalidate-secret"] || "";
  if (expected && provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  clearContentApiCaches();
  return res.status(200).json({ success: true, revalidated: true });
}
