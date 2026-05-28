/** Fallback get-visa slider copy — mirrors production nuvisa.co.uk CMS keys. */
export const SLIDER_CONTENT_DEFAULTS = {
  slider_header: "Schengen visa from the UK",
  slider_description:
    "Complete visa service end-to-end with all necessary documents",
  slider_save: "You save ",
  slider_traditional: "Traditional fee",
};

export const sliderContentDefaultsAsItems = Object.entries(
  SLIDER_CONTENT_DEFAULTS,
).map(([key, value], index) => ({
  key,
  value,
  type: "text",
  section: "header",
  order: index + 1,
  isActive: true,
}));

export function mergeSliderContentMap(cmsMap = {}) {
  const merged = { ...SLIDER_CONTENT_DEFAULTS };
  Object.entries(cmsMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      merged[key] = value;
    }
  });
  return merged;
}

export function mergeSliderContentResponse(data) {
  if (!data || typeof data !== "object") {
    return { success: true, data: sliderContentDefaultsAsItems };
  }

  const items = Array.isArray(data.data)
    ? [...data.data]
    : Array.isArray(data)
      ? [...data]
      : [];

  const existingKeys = new Set(items.map((item) => item?.key).filter(Boolean));

  sliderContentDefaultsAsItems.forEach((item) => {
    if (!existingKeys.has(item.key)) {
      items.push(item);
    }
  });

  return { ...data, success: data.success ?? true, data: items };
}
