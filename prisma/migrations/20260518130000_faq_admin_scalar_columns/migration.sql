-- Legacy nuvisa-admin may read scalar `faqType` / `title` instead of relation-only fields
ALTER TABLE "faqs"
  ADD COLUMN IF NOT EXISTS "faqType" TEXT;

UPDATE "faqs"
SET "faqType" = "category"
WHERE "faqType" IS NULL AND "category" IS NOT NULL;

ALTER TABLE "faq_types"
  ADD COLUMN IF NOT EXISTS "title" TEXT;

UPDATE "faq_types"
SET "title" = "name"
WHERE "title" IS NULL;
