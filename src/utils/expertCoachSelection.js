export const EXPERT_COACH_SELECTED_KEY = "expertCoachSelected";

export function persistExpertCoachSelected(selected) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    EXPERT_COACH_SELECTED_KEY,
    selected ? "true" : "false",
  );
}

export function readExpertCoachSelectedFromStorage() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(EXPERT_COACH_SELECTED_KEY) === "true";
}

function isTruthyExpertFlag(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** True when checkout included the WhatsApp accountability expert add-on. */
export function isExpertCoachSelected({
  includeExpertCoach,
  paymentMetadata,
  sessionMetadata,
} = {}) {
  if (isTruthyExpertFlag(includeExpertCoach)) return true;
  if (isTruthyExpertFlag(paymentMetadata?.expertCoachSelected)) return true;
  if (isTruthyExpertFlag(paymentMetadata?.includeExpertCoach)) return true;
  if (isTruthyExpertFlag(sessionMetadata?.expertCoachSelected)) return true;
  if (isTruthyExpertFlag(sessionMetadata?.includeExpertCoach)) return true;
  return readExpertCoachSelectedFromStorage();
}
