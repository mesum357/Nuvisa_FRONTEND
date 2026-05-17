import prisma from "@/lib/prisma";

/** Same `faqs` table nuvisa-admin uses — field is `category` (not faqType). */
export async function fetchFaqsFromDb(filters = {}) {
  try {
    const where = { isActive: true };
    if (filters.category) {
      where.category = String(filters.category);
    }

    const rows = await prisma.fAQ.findMany({
      where,
      orderBy: [{ order: "asc" }, { question: "asc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category,
      faqType: row.category,
      order: row.order,
      isActive: row.isActive,
    }));
  } catch (error) {
    console.warn("faqs DB read:", error?.message || error);
    return [];
  }
}
