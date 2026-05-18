-- nuvisa-admin-updated FAQ UI expects `faq_types` + `faqs.faqTypeId` (relation `faqType`)
CREATE TABLE IF NOT EXISTS "faq_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "faq_types_name_key" ON "faq_types"("name");

ALTER TABLE "faqs"
  ADD COLUMN IF NOT EXISTS "faqTypeId" TEXT,
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faqs_faqTypeId_fkey'
  ) THEN
    ALTER TABLE "faqs"
      ADD CONSTRAINT "faqs_faqTypeId_fkey"
      FOREIGN KEY ("faqTypeId") REFERENCES "faq_types"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed categories from existing FAQ rows (stable admin uses `category` text)
INSERT INTO "faq_types" ("id", "name", "order", "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  d.category,
  COALESCE(
    (SELECT MIN(f2."order") FROM "faqs" f2 WHERE f2."category" = d.category),
    0
  ),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "category"
  FROM "faqs"
  WHERE "category" IS NOT NULL AND TRIM("category") <> ''
) AS d
WHERE NOT EXISTS (
  SELECT 1 FROM "faq_types" ft WHERE ft."name" = d.category
);

UPDATE "faqs" f
SET "faqTypeId" = ft."id"
FROM "faq_types" ft
WHERE f."category" = ft."name"
  AND (f."faqTypeId" IS NULL OR f."faqTypeId" <> ft."id");

CREATE INDEX IF NOT EXISTS "faqs_faqTypeId_idx" ON "faqs"("faqTypeId");
