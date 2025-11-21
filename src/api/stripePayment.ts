import { backendApiEnums } from "@/enums/backendApi.enums";
import { apigateway } from "@/gateways/apigateway";

export const createPaymentIntent = async (payload, successCallbackFunction) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.PAYMENT.CREATE_PAYMENT_INTENT,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    successCallback: successCallbackFunction,
  });
};

export const confirmPayment = async (payload, successCallbackFunction) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.PAYMENT.CONFIRM_PAYMENT,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    successCallback: successCallbackFunction,
  });
};
