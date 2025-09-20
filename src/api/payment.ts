import { backendApiEnums } from "@/enums/backendApi.enums";
import { apigateway } from "@/gateways/apigateway";

export const createDynamicPaymentSession = async (
  payload,
  successCallbackFunction
) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.PAYMENT.CREATE_DYNAMIC_CHECKOUT_SESSION,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    successCallback: successCallbackFunction,
  });
};
