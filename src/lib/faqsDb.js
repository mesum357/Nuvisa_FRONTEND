import prisma from "@/lib/prisma";

/** Same `faqs` table nuvisa-admin uses. */
export async function fetchFaqsFromDb(filters = {}) {
  try {
    const where = { isActive: true };

    if (filters.category) {
      const tab = String(filters.category);
      where.OR = [{ category: tab }, { faqType: tab }];
    }

    if (filters.faqType) {
      const tab = String(filters.faqType);
      where.OR = [{ category: tab }, { faqType: tab }];
    }

    if (filters.isFeatured === true || filters.isFeatured === "true") {
      where.isFeatured = true;
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
        faqTypeCreatedAt: row.faqTypeCreatedAt ?? row.createdAt,
        order: row.order,
        isActive: row.isActive,
        isFeatured: row.isFeatured,
        is_featured: row.isFeatured,
      };
    });
  } catch (error) {
    console.warn("faqs DB read:", error?.message || error);
    return [];
  }
}
