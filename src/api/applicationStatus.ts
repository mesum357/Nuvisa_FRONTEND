import { backendApiEnums } from "@/enums/backendApi.enums";
import { apigateway } from "@/gateways/apigateway";

// Fetch application status using existing getApplicationById endpoint
export const getApplicationStatus = async (token, applicationId) => {
  try {
    const response = await apigateway({
      endpoint:
        backendApiEnums.ENDPOINTS.VISA_APPLICATION.GET_APPLICATION_BY_ID,
      method: backendApiEnums.METHODS.POST,
      token: token,
      payload: { id: applicationId },
      isDisplayResponsePopUp: false,
    });

    if (response?.success && response?.data) {
      // Transform the existing application data to status format
      const applicationData = response.data;
      return {
        success: true,
        data: {
          id: applicationData.id || applicationId,
          status: applicationData.applicationStatus || "submitted",
          submittedAt: applicationData.createdAt || new Date().toISOString(),
          estimatedProcessingTime: "10-15 business days",
          orderId: applicationData.orderId || `ORD-${applicationId}`,
          currentStage: getStatusStage(applicationData.applicationStatus),
          progress: getStatusProgress(applicationData.applicationStatus),
          nextSteps: getNextSteps(applicationData.applicationStatus),
          statusHistory: [
            {
              status: applicationData.applicationStatus || "submitted",
              timestamp:
                applicationData.updatedAt ||
                applicationData.createdAt ||
                new Date().toISOString(),
              description: getStatusDescription(
                applicationData.applicationStatus
              ),
            },
          ],
          applicationData: applicationData, // Include full application data
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
      return "Document Verification";
    case "under_review":
      return "Application Review";
    case "payment_required":
      return "Payment Processing";
    case "approved":
      return "Approved";
    case "rejected":
      return "Decision Made";
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
      return [
        "Document verification in progress",
        "Biometric appointment (if required)",
        "Application review by consulate",
        "Decision notification",
      ];
    case "under_review":
      return [
        "Application review by consulate",
        "Biometric appointment (if required)",
        "Final decision processing",
        "Decision notification",
      ];
    case "payment_required":
      return [
        "Complete payment for additional services",
        "Final processing",
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
