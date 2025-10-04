import { backendApiEnums } from "@/enums/backendApi.enums";
import { successMessagesEnums } from "@/enums/successMessages.enum";
import { apigateway } from "@/gateways/apigateway";

export const getUserVisaApplications = async (token) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.GET_USER_APPLICATIONS,
    method: backendApiEnums.METHODS.GET,
    token: token,
  });
};

// export const createUserVisaApplications = async (
//   token,
//   payload,
//   successCallback
// ) => {
//   console.log(
//     "got token, payload, successCallback",
//     token,
//     payload,
//     successCallback
//   );
//   return apigateway({
//     endpoint:
//       backendApiEnums.ENDPOINTS.VISA_APPLICATION.CREATE_USER_APPLICATIONS,
//     method: backendApiEnums.METHODS.POST,
//     token: token,
//     payload,
//     isDisplayResponsePopUp: true,
//     successMessage: successMessagesEnums.Visa_Application.CREATE,
//     successCallback,
//   });
// };

// Add this new function for step-by-step creation/updates
export const createOrUpdateApplication = async (token, payload) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.CREATE_OR_UPDATE,
    method: backendApiEnums.METHODS.POST,
    token: token,
    payload,
    isDisplayResponsePopUp: true,
    successMessage: successMessagesEnums.Visa_Application.CREATE,
  });
};

export const updateVisaApplication = async (token, payload) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.UPDATE_APPLICATION,
    method: backendApiEnums.METHODS.PATCH,
    token: token,
    payload,
    isDisplayResponsePopUp: true,
    successMessage: successMessagesEnums.Visa_Application.UPDATE,
  });
};

export const getVisaApplication = async (token, payload) => {
  return apigateway({
    endpoint:
      backendApiEnums.ENDPOINTS.VISA_APPLICATION.GET_APPLICATION_BY_ID +
      `?id=${payload.id}`,
    method: backendApiEnums.METHODS.GET,
    token: token,
    payload,
  });
};

export const archiveVisaApplication = async (token, payload) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.ARCHIVE_APPLICATION,
    method: backendApiEnums.METHODS.POST,
    token: token,
    payload,
    isDisplayResponsePopUp: true,
    successMessage: "Application archived",
  });
};

export const unarchiveVisaApplication = async (token, payload) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.VISA_APPLICATION.UNARCHIVE_APPLICATION,
    method: backendApiEnums.METHODS.POST,
    token: token,
    payload,
    isDisplayResponsePopUp: true,
    successMessage: "Application restored",
  });
};
