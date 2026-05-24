import { backendApiEnums } from "@/enums/backendApi.enums";
import { apigateway } from "@/gateways/apigateway";
import axios from "axios";

// Toggle this to switch between mock and real backend
const USE_MOCK_API = false;

export const createPaymentIntent = async (payload, successCallbackFunction) => {
  if (USE_MOCK_API) {
    // Use local mock API
    try {
      const response = await axios.post('/api/mock-payment-intent', payload);
      if (successCallbackFunction) {
        successCallbackFunction(response.data);
      }
      return response;
    } catch (error) {
      console.error('Mock API error:', error);
      throw error;
    }
  }
  
  // Use real backend
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.PAYMENT.CREATE_PAYMENT_INTENT,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    successCallback: successCallbackFunction,
    timeout: 90000,
  });
};

export const confirmPayment = async (payload, successCallbackFunction) => {
  if (USE_MOCK_API) {
    // Mock confirm payment - just return success
    return {
      status: 200,
      data: {
        status: 200,
        message: 'Payment confirmed successfully (MOCK)',
        data: {
          results: {
            success: true,
            paymentId: payload.paymentIntentId || `payment_${Date.now()}`,
          },
        },
      },
    };
  }
  
  // Use real backend
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.PAYMENT.CONFIRM_PAYMENT,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    successCallback: successCallbackFunction,
  });
};
