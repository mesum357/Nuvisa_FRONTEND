import {
  getPassportStatusLabel,
  getPassportStatusMessage,
  isPassportFinalStage,
  resolvePassportVariant,
} from "./passportStatusMessages";

export const APPLICATION_STATUS_COPY = {
  submitted: {
    heading: "Application submitted",
    description: "Your application has been received",
    label: "Application submitted",
    progressTitle: "Application submitted",
    progressDescription: "Your application has been received",
  },
  under_review: {
    heading: "Under review",
    description: "Documents are being reviewed by our team",
    label: "Under review",
    progressTitle: "Under review",
    progressDescription: "Documents are being reviewed by our team",
  },
  appointment_booked: {
    heading: "Appointment booked",
    description: "Visa appointment has been successfully scheduled",
    label: "Appointment booked",
    progressTitle: "Appointment booked",
    progressDescription: "Visa appointment has been successfully scheduled",
  },
  at_embassy: {
    heading: "At Embassy",
    description: "Application is currently at the embassy",
    label: "At Embassy",
    progressTitle: "At Embassy",
    progressDescription: "Application is currently at the embassy",
  },
  decision_made: {
    heading: "Decision made, passport dispatched/ready",
    description: "A final decision has been made on your application",
    label: "Decision made, passport dispatched/ready",
    progressTitle: "Decision made, passport dispatched/ready",
    progressDescription: "A final decision has been made on your application",
  },
  payment_required: {
    heading: "Payment required",
    description: "Additional payment is required to continue your application.",
    label: "Payment required",
    progressTitle: "Payment required",
    progressDescription: "Additional payment is required to continue your application.",
  },
  approved: {
    heading: "Application approved",
    description: "Congratulations! Your visa application has been approved.",
    label: "Approved",
    progressTitle: "Approved",
    progressDescription: "Your visa application has been approved.",
  },
  rejected: {
    heading: "Application rejected",
    description: "Your application has been rejected. Please contact support for more information.",
    label: "Rejected",
    progressTitle: "Rejected",
    progressDescription: "Your application has been rejected.",
  },
};

export function normalizeApplicationStatusKey(status) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Applicant-facing heading, description, and labels for a visa application status.
 */
export function getApplicationStatusContent(status, statusDisplay) {
  const key = normalizeApplicationStatusKey(status);

  if (key === "decision_made") {
    const variant = resolvePassportVariant(status, statusDisplay);
    if (variant !== "decision_made") {
      const passportLabel = getPassportStatusLabel(status, statusDisplay);
      const passportMessage = getPassportStatusMessage(status, statusDisplay);
      return {
        heading: passportLabel,
        description: passportMessage,
        label: passportLabel,
        progressTitle: passportLabel,
        progressDescription: passportMessage,
      };
    }
    return APPLICATION_STATUS_COPY.decision_made;
  }

  if (isPassportFinalStage(key)) {
    const passportLabel = getPassportStatusLabel(status, statusDisplay);
    const passportMessage = getPassportStatusMessage(status, statusDisplay);
    return {
      heading: passportLabel,
      description: passportMessage,
      label: passportLabel,
      progressTitle: passportLabel,
      progressDescription: passportMessage,
    };
  }

  const copy = APPLICATION_STATUS_COPY[key];
  if (copy) {
    return copy;
  }

  const fallbackLabel = String(status || "Processing")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    heading: fallbackLabel,
    description: "Your application is being processed.",
    label: fallbackLabel,
    progressTitle: fallbackLabel,
    progressDescription: "Your application is being processed.",
  };
}
