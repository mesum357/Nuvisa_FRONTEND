const slugify = (name) =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const RAW = [
  { name: "Austria", basePrice: 169, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Belgium", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Bulgaria", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Croatia", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Czechia", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Denmark", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Estonia", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Finland", basePrice: 149, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "France", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Germany", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Greece", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Hungary", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Iceland", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Italy", basePrice: 149, strikeOutPrice: 200, reason: "Due to Global Crisis", showReason: true },
  { name: "Latvia", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Lithuania", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Luxembourg", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Malta", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "NORWAY", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Netherlands", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Poland", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Portugal", basePrice: 149, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Romania", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Slovenia", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Spain", basePrice: 149, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Sweden", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
  { name: "Switzerland", basePrice: 129, strikeOutPrice: 200, reason: "", showReason: false },
];

export const DEFAULT_VISA_PRICING = RAW.map((row) => ({
  id: `default-${slugify(row.name)}`,
  ...row,
}));

export const DEFAULT_VISA_PRICING_API_RESPONSE = {
  status: "success",
  data: {
    results: DEFAULT_VISA_PRICING,
    recordsCount: DEFAULT_VISA_PRICING.length,
  },
  message: "Default visa pricing",
};
