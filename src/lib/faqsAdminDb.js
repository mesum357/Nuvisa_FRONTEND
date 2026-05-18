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

  return rows.map((row) => formatFaqForAdmin(row));
}

/** Shape expected by nuvisa-admin-updated FAQ screens. */
export function formatFaqForAdmin(row) {
  const typeName = row.faqTypeRel?.name || row.faqType || row.category || "";
  const typePayload = row.faqTypeRel
    ? {
        id: row.faqTypeRel.id,
        name: row.faqTypeRel.name,
        title: row.faqTypeRel.title || row.faqTypeRel.name,
        order: row.faqTypeRel.order,
        isActive: row.faqTypeRel.isActive,
      }
    : typeName
      ? { id: row.faqTypeId, name: typeName, title: typeName, order: 0, isActive: true }
      : null;

  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: typeName,
    faqType: typePayload,
    faqTypeId: row.faqTypeId,
    order: row.order,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createFaq(payload) {
  const categoryFromPayload =
    payload.category ||
    payload.faqType?.name ||
    (typeof payload.faqType === "string" ? payload.faqType : "");

  const type = await ensureFaqType(categoryFromPayload);
  const category = type?.name || String(categoryFromPayload || "").trim();

  const row = await prisma.fAQ.create({
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
    include: { faqTypeRel: true },
  });
  return formatFaqForAdmin(row);
}

export async function updateFaq(id, payload) {
  const categoryFromPayload =
    payload.category ||
    payload.faqType?.name ||
    (typeof payload.faqType === "string" ? payload.faqType : "");

  const type = await ensureFaqType(categoryFromPayload);
  const resolvedCategory =
    type?.name || String(categoryFromPayload || "").trim();

  const row = await prisma.fAQ.update({
    where: { id },
    data: {
      question: String(payload.question || "").trim(),
      answer: String(payload.answer || "").trim(),
      category: resolvedCategory,
      faqType: resolvedCategory,
      faqTypeId: type?.id ?? null,
      order: Number(payload.order) || 0,
      isActive: payload.isActive !== false,
      isFeatured: Boolean(payload.isFeatured),
    },
    include: { faqTypeRel: true },
  });
  return formatFaqForAdmin(row);
}

export async function deleteFaq(id) {
  return prisma.fAQ.delete({ where: { id } });
}
