const GUARANTEE_PATH = '/our-guarantee';

/**
 * Normalizes hero_description from CMS into pill segments.
 * Supports production format (" I " + +Link+) and pipe-separated admin entries (" | ").
 */
export function parseHeroDescription(description) {
  if (!description || typeof description !== 'string') {
    return { isPill: false, segments: [], plainText: description || '' };
  }

  const normalized = description
    .replace(/\s*\|\s*/g, ' I ')
    .trim();

  const hasPillFormat =
    normalized.includes('+Link+') || normalized.includes(' I ');

  if (!hasPillFormat) {
    return { isPill: false, segments: [], plainText: description };
  }

  const segments = normalized.split(' I ').map((part) => {
    if (part.includes('+Link+')) {
      const [text, url] = part.split('+Link+');
      const label = text.trim();
      return {
        text: label,
        url: (url || GUARANTEE_PATH).trim(),
        isGuarantee: label.toLowerCase() === 'our guarantee',
      };
    }

    const label = part.trim();
    if (label.toLowerCase() === 'our guarantee') {
      return { text: label, url: GUARANTEE_PATH, isGuarantee: true };
    }

    return { text: label, url: null, isGuarantee: false };
  });

  return { isPill: segments.length > 0, segments, plainText: description };
}

export const DEFAULT_HERO_DESCRIPTION =
  'Everyday Steals I £90 Germany I Our Guarantee+Link+/our-guarantee';
