const DEFAULT_SPOTS_LEFT = 12;
const SPOTS_LEFT_STORAGE_KEY = "expertSpotsLeft";
const LAST_RESET_DAY_STORAGE_KEY = "expertSpotsLastResetDayUk";
const PROCESSED_PAYMENTS_STORAGE_KEY = "expertSpotsProcessedPayments";
const DEFAULT_SPOTS_FROM_API_STORAGE_KEY = "expertSpotsDefaultFromApi";
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

const normalizeDefaultSpots = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SPOTS_LEFT;
  return Math.max(1, Math.floor(parsed));
};

const getDynamicDefaultSpots = () => {
  if (typeof window === "undefined") return DEFAULT_SPOTS_LEFT;
  const storedDefault = localStorage.getItem(DEFAULT_SPOTS_FROM_API_STORAGE_KEY);
  return normalizeDefaultSpots(storedDefault);
};

const normalizeSpotsLeft = (value, maxSpots) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return maxSpots;
  return Math.max(0, Math.min(maxSpots, Math.floor(parsed)));
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

  const dynamicDefaultSpots = getDynamicDefaultSpots();
  const storedSpots = localStorage.getItem(SPOTS_LEFT_STORAGE_KEY);
  const lastResetDay = localStorage.getItem(LAST_RESET_DAY_STORAGE_KEY);
  const { dayKey } = getUkDateParts();

  let spots = normalizeSpotsLeft(storedSpots, dynamicDefaultSpots);

  // Reset to default at UK midnight (top up to admin default, usually 12).
  if (lastResetDay !== dayKey) {
    spots = dynamicDefaultSpots;
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

export const fetchDailySlotsFromApi = async () => {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/daily-slots", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data || data.remaining == null) return null;
    const defaultSpots = normalizeDefaultSpots(data.defaultSpots ?? data.remaining);
    const remaining = normalizeSpotsLeft(data.remaining, defaultSpots);
    localStorage.setItem(DEFAULT_SPOTS_FROM_API_STORAGE_KEY, String(defaultSpots));
    localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(remaining));
    const { dayKey } = getUkDateParts();
    localStorage.setItem(LAST_RESET_DAY_STORAGE_KEY, dayKey);
    try {
      window.dispatchEvent(
        new CustomEvent("expert-spots-updated", { detail: { spots: remaining } })
      );
    } catch {
      // ignore
    }
    return remaining;
  } catch {
    return null;
  }
};

export const decrementExpertSpotsViaApi = async (paymentId) => {
  if (typeof window === "undefined") return syncExpertSpots();
  const normalizedPaymentId = String(paymentId || "").trim();
  const processed = readProcessedPayments();
  if (normalizedPaymentId && processed.includes(normalizedPaymentId)) {
    return syncExpertSpots();
  }
  try {
    const res = await fetch("/api/daily-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const json = await res.json();
      const remaining = Number(json?.data?.remaining);
      if (Number.isFinite(remaining)) {
        const defaultSpots = getDynamicDefaultSpots();
        localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(remaining));
        if (normalizedPaymentId) {
          writeProcessedPayments([...processed, normalizedPaymentId]);
        }
        try {
          window.dispatchEvent(
            new CustomEvent("expert-spots-updated", { detail: { spots: remaining } })
          );
        } catch {
          // ignore
        }
        return remaining;
      }
    }
  } catch {
    // fall through to local decrement
  }
  return decrementExpertSpotsOnSuccessfulCheckout(paymentId);
};

export const setExpertSpotsDefaultFromApi = (value) => {
  if (typeof window === "undefined") return DEFAULT_SPOTS_LEFT;

  const previousDefault = getDynamicDefaultSpots();
  const normalizedDefault = normalizeDefaultSpots(value);
  localStorage.setItem(
    DEFAULT_SPOTS_FROM_API_STORAGE_KEY,
    String(normalizedDefault)
  );

  const storedSpots = localStorage.getItem(SPOTS_LEFT_STORAGE_KEY);
  const hasDefaultChanged = normalizedDefault !== previousDefault;

  if (storedSpots === null || hasDefaultChanged) {
    // Admin-controlled default changed (or first init): adopt it immediately.
    localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(normalizedDefault));
  } else {
    const normalizedCurrent = normalizeSpotsLeft(storedSpots, normalizedDefault);
    localStorage.setItem(SPOTS_LEFT_STORAGE_KEY, String(normalizedCurrent));
  }

  const synced = syncExpertSpots();
  try {
    window.dispatchEvent(
      new CustomEvent("expert-spots-updated", { detail: { spots: synced } })
    );
  } catch {
    // ignore
  }
  return synced;
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
  try {
    window.dispatchEvent(
      new CustomEvent("expert-spots-updated", { detail: { spots: next } })
    );
  } catch {
    // ignore
  }
  return next;
};

export const expertSpotsConstants = {
  DEFAULT_SPOTS_LEFT,
};
