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
      include: { faqTypeRel: true },
      orderBy: [{ order: "asc" }, { question: "asc" }],
    });

    return rows.map((row) => {
      const typeName = row.faqTypeRel?.name || row.faqType || row.category;
      return {
        id: row.id,
        question: row.question,
        answer: row.answer,
        category: typeName,
        faqType: typeName,
        faqTypeId: row.faqTypeId,
        faqTypeCreatedAt: row.faqTypeRel?.createdAt || row.createdAt,
        order: row.order,
        isActive: row.isActive,
        isFeatured: row.isFeatured,
      };
    });
  } catch (error) {
    console.warn("faqs DB read:", error?.message || error);
    return [];
  }
}
