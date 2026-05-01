import { backendApiEnums } from "@/enums/backendApi.enums";
import { apigateway } from "@/gateways/apigateway";

// Fetch application status using existing getApplicationById endpoint
export const getApplicationStatus = async (token, applicationId) => {
  try {
    const response = await apigateway({
      endpoint:
        backendApiEnums.ENDPOINTS.VISA_APPLICATION.GET_APPLICATION_BY_ID + `?id=${applicationId}`,
      method: backendApiEnums.METHODS.GET,
      token: token,
      payload: { id: applicationId },
      isDisplayResponsePopUp: false,
    });

    if (response?.success && response?.data) {
      const applicationData =
        response.data.results?.application || response.data.application || response.data;

      // Derive richer status with sub-states for appointment and embassy
      const rawStatus = String(applicationData.applicationStatus || "submitted").toLowerCase();

      // Extract appointment preferences (top-level or first traveler fallback)
      const appointment = applicationData.appointment || (Array.isArray(applicationData.travelersData) && applicationData.travelersData[0]?.appointment) || null;
      const pref1 = appointment?.preference1 || {};
      const hasPref1Range = !!(pref1?.dateRange && String(pref1.dateRange).trim());
      const hasPref1StartEnd = !!(pref1?.dateRangeStart || pref1?.dateRangeEnd);
      const hasPref1Slot = !!(pref1?.slot && String(pref1.slot).trim());
      const appointmentBooked = hasPref1Slot || hasPref1Range || hasPref1StartEnd;

      const stepInfo = applicationData.stepInfo || {};
      const currentStepKey = (stepInfo.currentStep || applicationData.currentStep || '').toString().toLowerCase();
      const currentStageText = (applicationData.currentStage || '').toString().toLowerCase();
      const atEmbassy = currentStepKey === 'at_embassy' || currentStageText === 'at embassy';

      let derivedStatus = rawStatus;
      if (rawStatus === 'approved' || rawStatus === 'rejected') {
        derivedStatus = rawStatus;
      } else if (atEmbassy) {
        derivedStatus = 'at_embassy';
      } else if (appointmentBooked) {
        derivedStatus = 'appointment_booked';
      } else if (rawStatus === 'under_review' || rawStatus === 'processing') {
        derivedStatus = 'under_review';
      } else if (rawStatus === 'submitted' || rawStatus === 'new' || rawStatus === 'draft') {
        derivedStatus = 'submitted';
      }

      // Normalize appointment preference ranges to human-readable string if needed
      const ensureRangeString = (p) => {
        if (!p) return '';
        if (p.dateRange) return p.dateRange;
        const toStr = (d) => {
          if (!d) return '';
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return '';
          const day = String(dt.getDate()).padStart(2, '0');
          const month = String(dt.getMonth() + 1).padStart(2, '0');
          const year = dt.getFullYear();
          return `${day}/${month}/${year}`;
        };
        const start = toStr(p.dateRangeStart);
        const end = toStr(p.dateRangeEnd);
        if (!start && !end) return '';
        return `${start} - ${end}`;
      };

      const appointmentPrefs = appointment
        ? {
            preference1: {
              city: pref1.city || '',
              dateRange: ensureRangeString(pref1),
              slot: pref1.slot || '',
            },
            preference2: {
              city: appointment?.preference2?.city || '',
              dateRange: ensureRangeString(appointment?.preference2 || {}),
              slot: appointment?.preference2?.slot || '',
            },
          }
        : null;

      // Format application and order IDs consistently
      const formatApplicationId = (rawId) => {
        if (!rawId) return null;
        const numericTail = (source, length) => {
          if (!source) return "".padStart(length, "0");
          let digits = String(source).replace(/\D+/g, "");
          if (digits.length < length) {
            const codes = Array.from(String(source))
              .map((c) => c.charCodeAt(0))
              .join("");
            digits = (digits + codes).replace(/\D+/g, "");
          }
          if (!digits.length) {
            digits = "0".repeat(length);
          }
          return digits.slice(-length).padStart(length, "0");
        };
        return `AI${numericTail(rawId, 8)}`;
      };

      const formatOrderId = (rawOrderId) => {
        if (!rawOrderId) return null;
        const numericTail = (source, length) => {
          if (!source) return "".padStart(length, "0");
          let digits = String(source).replace(/\D+/g, "");
          if (digits.length < length) {
            const codes = Array.from(String(source))
              .map((c) => c.charCodeAt(0))
              .join("");
            digits = (digits + codes).replace(/\D+/g, "");
          }
          if (!digits.length) {
            digits = "0".repeat(length);
          }
          return digits.slice(-length).padStart(length, "0");
        };
        return `ORD${numericTail(rawOrderId, 6)}`;
      };

      return {
        success: true,
        data: {
          id: applicationData.id || applicationId,
          status: derivedStatus,
          submittedAt: applicationData.createdAt || new Date().toISOString(),
          estimatedProcessingTime: '3 working hours',
          orderId: applicationData.orderId,
          formattedApplicationId: formatApplicationId(applicationData.id || applicationId),
          formattedOrderId: formatOrderId(applicationData.orderId),
          currentStage: getStatusStage(derivedStatus),
          progress: getStatusProgress(derivedStatus),
          nextSteps: getNextSteps(derivedStatus),
          statusHistory: [
            {
              status: derivedStatus,
              timestamp:
                applicationData.updatedAt ||
                applicationData.createdAt ||
                new Date().toISOString(),
              description: getStatusDescription(derivedStatus),
            },
          ],
          appointment: appointmentPrefs,
          applicationData: applicationData,
        },
      };
    }

    return {
      success: false,
      error: "Application not found",
    };
  } catch (error) {
    console.error("Error fetching application status:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch application status",
    };
  }
};

// Helper function to determine current stage based on status
const getStatusStage = (status) => {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under review";
    case "appointment_booked":
      return "Appointment Booked";
    case "at_embassy":
      return "At Embassy";
    case "payment_required":
      return "Payment Processing";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Processing";
  }
};

// Helper function to calculate progress percentage
const getStatusProgress = (status) => {
  switch (status) {
    case "submitted":
      return 25;
    case "under_review":
      return 50;
    case "appointment_booked":
      return 75;
    case "at_embassy":
      return 90;
    case "payment_required":
      return 75;
    case "approved":
      return 100;
    case "rejected":
      return 100;
    default:
      return 10;
  }
};

// Helper function to get next steps based on status
const getNextSteps = (status) => {
  switch (status) {
    case "submitted":
      // After submission the next logical steps are review, payment (if required) and decision
      return [
        "Application being queued for review",
        "Move to Under Review",
      ];
    case "under_review":
      return [
        "Application is being reviewed",
        "Book appointment",
      ];
    case "appointment_booked":
      return [
        "Attend appointment",
        "Documents submission at embassy",
      ];
    case "at_embassy":
      return [
        "Await decision",
      ];
    case "payment_required":
      return [
        "Complete payment for additional services",
        "Resume review after payment",
        "Decision notification",
      ];
    case "approved":
      return [
        "Visa approved - ready for collection",
        "Check collection details in your email",
        "Prepare for travel",
      ];
    case "rejected":
      return [
        "Review rejection reasons",
        "Consider reapplication options",
        "Contact support for guidance",
      ];
    default:
      return [
        "Application processing in progress",
        "Updates will be sent via email",
        "Check back for status updates",
      ];
  }
};

// Helper function to get status description
const getStatusDescription = (status) => {
  switch (status) {
    case "submitted":
      return "Application successfully submitted and received";
    case "under_review":
      return "Application is being reviewed by our team";
    case "appointment_booked":
      return "Your visa appointment has been booked";
    case "at_embassy":
      return "Your documents are with the embassy";
    case "payment_required":
      return "Additional payment required to complete processing";
    case "approved":
      return "Application has been approved";
    case "rejected":
      return "Application has been rejected";
    default:
      return "Application is being processed";
  }
};

// Remove the external API check function since we don't have that endpoint
// Keep only the internal application status fetching
