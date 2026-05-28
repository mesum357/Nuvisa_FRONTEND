import prisma from "@/lib/prisma";
import { normalizeOccasionList } from "@/utils/occasionData";

/** Same Postgres table nuvisa-admin reads/writes (`occasion_content`). */
export async function fetchOccasionContentFromDb() {
  try {
    const row =
      (await prisma.occasionContent.findUnique({ where: { id: "current" } })) ||
      (await prisma.occasionContent.findFirst({
        orderBy: { updatedAt: "desc" },
      }));
    if (!row) return null;

    const occasions = normalizeOccasionList(row.occasions);
    if (!row.title && !row.description && occasions.length === 0) {
      return null;
    }

    return {
      title: row.title || "",
      description: row.description || "",
      occasions,
      source: "database",
    };
  } catch (error) {
    console.warn("occasion_content DB read:", error?.message || error);
    return null;
  }
}
