import { backendApiEnums } from "@/enums/backendApi.enums";
import { successMessagesEnums } from "@/enums/successMessages.enum";
import { apigateway } from "@/gateways/apigateway";

export const updateProfileInfo = async (token, payload) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.UPDATE_PROFILE_INFO,
    method: backendApiEnums.METHODS.PUT,
    token: token,
    payload: payload,
    isDisplayResponsePopUp: true,
    contentType: "application/json",
    successMessage: successMessagesEnums.Profile.UPDATE,
  });
};

export const resetPassword = async (
  token,
  payload,
  successCallbackFunction
) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.RESET_PASSWORD,
    method: backendApiEnums.METHODS.PUT,
    token: token,
    payload: payload,
    isDisplayResponsePopUp: true,
    successMessage: successMessagesEnums.Profile.RESETPASSWORD,
    successCallback: successCallbackFunction,
  });
};

export const sendResetEmail = async (
  token,
  payload,
  successCallbackFunction
) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.FORGET_PASSWORD,
    method: backendApiEnums.METHODS.POST,
    token: token,
    payload: payload,
    isDisplayResponsePopUp: true,
    successMessage: successMessagesEnums.Profile.FORGETEMAILSENT,
    successCallback: successCallbackFunction,
  });
};

export const recoverPassword = async (
  token,
  payload,
  successCallbackFunction
) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.RECOVER_PASSWORD,
    method: backendApiEnums.METHODS.PUT,
    token: token,
    payload: payload,
    isDisplayResponsePopUp: true,
    successMessage: successMessagesEnums.Profile.PASSWORDCHANGED,
    successCallback: successCallbackFunction,
  });
};
