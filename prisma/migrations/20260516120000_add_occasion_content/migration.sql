-- Creates table required by nuvisa-admin "Occasion Content Management" (fixes 42P01)
CREATE TABLE IF NOT EXISTS "occasion_content" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "occasions" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "occasion_content_pkey" PRIMARY KEY ("id")
);

INSERT INTO "occasion_content" ("id", "title", "description", "occasions", "updatedAt")
VALUES (
    'current',
    'Save and bring your plans to your life',
    '',
    '[
      {
        "title": "February Half Term 2026 – 15/02 to 23/02",
        "subTitle": "School break travel",
        "textColor": "#ffffff",
        "bgColor": "#5f9aff",
        "arrivalDate": "2026-02-15",
        "departureDate": "2026-02-23"
      },
      {
        "title": "Easter Break 2026 – 29/03 to 12/04",
        "subTitle": "Spring getaway",
        "textColor": "#ffffff",
        "bgColor": "#ff8e59",
        "arrivalDate": "2026-03-29",
        "departureDate": "2026-04-12"
      },
      {
        "title": "Summer Holidays 2026 – 18/07 to 31/08",
        "subTitle": "Peak season deals",
        "textColor": "#1a1a1a",
        "bgColor": "#daee69",
        "arrivalDate": "2026-07-18",
        "departureDate": "2026-08-31"
      },
      {
        "title": "October Half Term 2026 – 17/10 to 01/11",
        "subTitle": "Autumn escape",
        "textColor": "#1a1a1a",
        "bgColor": "#fdfd55",
        "arrivalDate": "2026-10-17",
        "departureDate": "2026-11-01"
      }
    ]'::jsonb,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
