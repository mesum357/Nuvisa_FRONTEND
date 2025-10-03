import { backendApiEnums } from "@/enums/backendApi.enums";
import { successMessagesEnums } from "@/enums/successMessages.enum";
import { apigateway } from "@/gateways/apigateway";
import { createVisaOrder } from "./smvVisa";

export const check = async (payload, successCallbackFunction) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA.CHECK,
    method: backendApiEnums.METHODS.GET,
    payload: payload,
    isDisplayResponsePopUp: true,
    successCallback: successCallbackFunction,
    successMessage: "",
  });
};

export const createApplication = async (payload) => {
  try {


    // First, create order with SMV Conveyor API if we have visa type data
    let orderId = null;

    if (
      payload.visaTypeId &&
      payload.arrivalDate &&
      payload.departureDate &&
      payload.numberOfTravellers
    ) {

      // Format dates properly for SMV API (MM/DD/YYYY with leading zeros)
      const formatDateForSMV = (dateString) => {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      const orderData = {
        visa_type_id: payload.visaTypeId,
        travel_start_date: formatDateForSMV(payload.arrivalDate), // MM/DD/YYYY format
        travel_end_date: formatDateForSMV(payload.departureDate), // MM/DD/YYYY format
        no_of_travelers: parseInt(payload.numberOfTravellers),
      };


      const orderResponse = await createVisaOrder(orderData);

      if (
        orderResponse?.data?.status?.data?.success &&
        orderResponse?.data?.status?.data
      ) {
        // Handle both mock response and real API response (both use order_id)
        orderId = orderResponse.data.status.data.data.order_id;
      } else {
        console.warn(
          "Failed to create SMV order, proceeding without order_id:",
          orderResponse
        );
      }
    } else {

    }


    // Add the order_id to the application payload
    const applicationPayload = {
      ...payload,
      orderId: orderId, // Include the order_id from SMV response
    };


    // Create the application with the order_id
    return apigateway({
      endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.CREATE_OR_UPDATE,
      method: backendApiEnums.METHODS.POST,
      payload: applicationPayload,
      isDisplayResponsePopUp: false,
      directAction: true,
    });
  } catch (error) {
    console.error("Error in createApplication:", error);


    return apigateway({
      endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.CREATE_OR_UPDATE,
      method: backendApiEnums.METHODS.POST,
      payload: payload,
      isDisplayResponsePopUp: false,
      directAction: true,
    });
  }
};
