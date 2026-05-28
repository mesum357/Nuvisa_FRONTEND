/** Fallback comparison block — mirrors production / Vercel CMS (Default + country fallback). */
export const comparisonSectionDefaults = {
  title: "Transparency builds trust",
  tooltip:
    "Competitor information gathered in April 2026 pricing is subject to change.",
  comparisonColumns: ["NUVIsa", "IVISA", "SCOTT'S", "CIBT"],
  comparisonRows: [
    {
      feature: "Price",
      values: ["£110", "£295", "£395", "£475"],
    },
    {
      feature: "Savings",
      values: ["—", "+63%", "+72%", "+77%"],
    },
    {
      feature: "Average appointment time",
      values: ["10 days or less", "4-6 weeks", "4-6 weeks", "3-4 weeks"],
    },
    {
      feature: "Urgent appointment help",
      values: ["check", "x", "x", "x"],
    },
  ],
  detailSections: [
    {
      title: "care & professionalism",
      items: [
        "Appointments with us are 2x faster than the industry average",
        "Real-time status tracking from anywhere",
        "Full itinerary included — flight reservations, hotel bookings, and cover letters, all in one place",
        "We prepare and verify every document so nothing gets rejected at the embassy",
        "Fast turnaround — we aim to review every application within 3 working hours",
      ],
    },
  ],
  experienceType: "TASKS",
  experienceTitle: "Take a closer look",
  experienceItems: [
    "A criminal history may disqualifies you from obtaining a visa",
    "Previous overstays or visa breaches can impact your application",
    "A passport valid for less than 3 months after Schengen trip may affect your visa eligibility",
    "Valid and adequate travel insurance is mandatory. You can add it to your order or provide your existing policy",
  ],
  leftSideImage: "/image/visa-agency.png",
  rightSideImage: "/image/nuvisa-image.jpg",
  leftSideTitle: "Traditional Agency",
  rightSideTitle: "NUvisa",
};
