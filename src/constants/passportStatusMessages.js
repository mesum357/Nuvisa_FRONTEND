/**
 * Applicant-facing copy for passport final-stage statuses.
 */

export const PASSPORT_STATUS_LABELS = {
  decision_made: "Decision Made",
  dispatched: "Dispatched",
  ready: "Ready",
};

export const PASSPORT_STATUS_MESSAGES = {
  decision_made:
    "A decision has been made on your passport application. Please check your application details for further instructions.",
  dispatched:
    "Your passport has been dispatched. Please allow 3–5 working days for delivery.",
  ready:
    "Your passport is ready for collection. Please visit us at your earliest convenience.",
};

export function resolvePassportVariant(status, statusDisplay) {
  const key = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (key === "PASSPORT_DISPATCHED") return "dispatched";
  if (key === "PASSPORT_READY") return "ready";

  const display = String(statusDisplay || status || "").toLowerCase();
  if (display.includes("dispatch")) return "dispatched";
  if (display.includes("ready") || display.includes("collection")) return "ready";
  if (
    display.includes("decision") ||
    display === "approved" ||
    display === "rejected" ||
    display.includes("decision_made")
  ) {
    return "decision_made";
  }

  return "decision_made";
}

export function getPassportStatusLabel(status, statusDisplay) {
  const variant = resolvePassportVariant(status, statusDisplay);
  return PASSPORT_STATUS_LABELS[variant];
}

export function getPassportStatusMessage(status, statusDisplay) {
  const variant = resolvePassportVariant(status, statusDisplay);
  return PASSPORT_STATUS_MESSAGES[variant];
}

export function isPassportFinalStage(status) {
  const v = String(status || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return v === "decision_made" || v === "approved" || v === "rejected";
}
