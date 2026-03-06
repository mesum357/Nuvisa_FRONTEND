const DEFAULT_SPOTS_LEFT = 12;
const SPOTS_LEFT_STORAGE_KEY = "expertSpotsLeft";
const LAST_RESET_DAY_STORAGE_KEY = "expertSpotsLastResetDayUk";
const PROCESSED_PAYMENTS_STORAGE_KEY = "expertSpotsProcessedPayments";
const MAX_PROCESSED_PAYMENTS = 200;

const getUkDateParts = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type) => parts.find((item) => item.type === type)?.value;
  const year = getPart("year") || "";
  const month = getPart("month") || "";
  const day = getPart("day") || "";

  return {
    dayKey: `${year}-${month}-${day}`,
  };
};

const normalizeSpotsLeft = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SPOTS_LEFT;
  return Math.max(0, Math.min(DEFAULT_SPOTS_LEFT, Math.floor(parsed)));
};

const readProcessedPayments = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROCESSED_PAYMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const writeProcessedPayments = (list) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PROCESSED_PAYMENTS_STORAGE_KEY,
    JSON.stringify(list.slice(-MAX_PROCESSED_PAYMENTS))
  );
};

export const syncExpertSpots = () => {
  if (typeof window === "undefined") return DEFAULT_SPOTS_LEFT;

  const storedSpots = localStorage.getItem(SPOTS_LEFT_STORAGE_KEY);
  const lastResetDay = localStorage.getItem(LAST_RESET_DAY_STORAGE_KEY);
  const { dayKey } = getUkDateParts();

  let spots = normalizeSpotsLeft(storedSpots);

  // Reset on first check after UK midnight only if remaining spots are low.
  if (lastResetDay !== dayKey && spots <= 5) {
    spots = DEFAULT_SPOTS_LEFT;
    localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(spots));
    localStorage.setItem(LAST_RESET_DAY_STORAGE_KEY, dayKey);
  } else {
    if (storedSpots === null) {
      localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(spots));
    }
    if (!lastResetDay) {
      localStorage.setItem(LAST_RESET_DAY_STORAGE_KEY, dayKey);
    }
  }

  return spots;
};

export const decrementExpertSpotsOnSuccessfulCheckout = (paymentId) => {
  if (typeof window === "undefined") return DEFAULT_SPOTS_LEFT;

  const normalizedPaymentId = String(paymentId || "").trim();
  if (!normalizedPaymentId) {
    return syncExpertSpots();
  }

  const processed = readProcessedPayments();
  if (processed.includes(normalizedPaymentId)) {
    return syncExpertSpots();
  }

  const current = syncExpertSpots();
  const next = Math.max(0, current - 1);
  localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(next));
  writeProcessedPayments([...processed, normalizedPaymentId]);
  return next;
};

export const expertSpotsConstants = {
  DEFAULT_SPOTS_LEFT,
};
