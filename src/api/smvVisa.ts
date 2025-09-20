import { backendApiEnums } from "@/enums/backendApi.enums";
import { apigateway } from "@/gateways/apigateway";

// Get visa types from SMV Konveyor API
export const getVisaTypes = async (country = '') => {
  return apigateway({
    endpoint: `${backendApiEnums.ENDPOINTS.VISA.TYPES}${country ? `?country=${country}` : ''}`,
    method: backendApiEnums.METHODS.GET,
    isDisplayResponsePopUp: false,
    directAction: true,
  });
};

// Get countries from SMV Konveyor API  
export const getCountries = async () => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA.COUNTRIES,
    method: backendApiEnums.METHODS.GET,
    isDisplayResponsePopUp: false,
    directAction: true,
  });
};

// Create order with visa type ID
export const createVisaOrder = async (orderData) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA.CREATE_ORDER,
    method: backendApiEnums.METHODS.POST,
    payload: orderData,
    isDisplayResponsePopUp: false,
    directAction: true,
  });
};
