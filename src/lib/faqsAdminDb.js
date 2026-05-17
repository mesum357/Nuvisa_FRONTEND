import prisma from "@/lib/prisma";

export async function listFaqTypes() {
  return prisma.faqType.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function ensureFaqType(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;

  const existing = await prisma.faqType.findUnique({ where: { name: trimmed } });
  if (existing) return existing;

  const maxOrder = await prisma.faqType.aggregate({ _max: { order: true } });
  return prisma.faqType.create({
    data: {
      name: trimmed,
      title: trimmed,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
}

export async function listAllFaqs() {
  const rows = await prisma.fAQ.findMany({
    include: { faqTypeRel: true },
    orderBy: [
      { faqTypeRel: { order: "asc" } },
      { order: "asc" },
      { question: "asc" },
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.faqTypeRel?.name || row.faqType || row.category || "",
    faqType: row.faqTypeRel?.name || row.faqType || row.category || "",
    faqTypeId: row.faqTypeId,
    order: row.order,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
  }));
}

export async function createFaq(payload) {
  const type = await ensureFaqType(payload.category);
  const category = type?.name || String(payload.category || "").trim();

  return prisma.fAQ.create({
    data: {
      question: String(payload.question || "").trim(),
      answer: String(payload.answer || "").trim(),
      category,
      faqType: category,
      faqTypeId: type?.id ?? null,
      order: Number(payload.order) || 0,
      isActive: payload.isActive !== false,
      isFeatured: Boolean(payload.isFeatured),
    },
  });
}

export async function updateFaq(id, payload) {
  const type = await ensureFaqType(payload.category);
  const category = type?.name || String(payload.category || "").trim();

  return prisma.fAQ.update({
    where: { id },
    data: {
      question: String(payload.question || "").trim(),
      answer: String(payload.answer || "").trim(),
      category,
      faqType: category,
      faqTypeId: type?.id ?? null,
      order: Number(payload.order) || 0,
      isActive: payload.isActive !== false,
      isFeatured: Boolean(payload.isFeatured),
    },
  });
}

export async function deleteFaq(id) {
  return prisma.fAQ.delete({ where: { id } });
}
