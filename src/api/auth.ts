import { backendApiEnums } from "@/enums/backendApi.enums";
import { successMessagesEnums } from "@/enums/successMessages.enum";
import { apigateway } from "@/gateways/apigateway";

export const login = async (
  payload,
  successCallbackFunction,
  SignInModalState = null
) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.LOGIN,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    isDisplayResponsePopUp: false,
    successCallback: successCallbackFunction,
    successMessage:
      SignInModalState == "SignUp"
        ? successMessagesEnums.Auth.REGISTER.title
        : successMessagesEnums.Auth.LOGIN,
    directAction: true,
  });
};

export const verifyOtp = async (
  payload,
  successCallbackFunction,
  SignInModalState = null
) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.VERIFY_OTP,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    isDisplayResponsePopUp: false,
    successCallback: successCallbackFunction,
    successMessage:
      SignInModalState == "SignUp"
        ? successMessagesEnums.Auth.REGISTER.title
        : successMessagesEnums.Auth.LOGIN,
    directAction: true,
  });
};

export const verifyToken = async (payload, successCallbackFunction) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.VERIFY_TOKEN,
    method: backendApiEnums.METHODS.PUT,
    payload: payload,
    isDisplayResponsePopUp: true,
    successCallback: successCallbackFunction,
    successMessage: "Email verified successfully.",
  });
};

export const register = async (payload, successCallbackFunction) => {
  return apigateway({
    endpoint: backendApiEnums.ENDPOINTS.AUTH.REGISTER,
    method: backendApiEnums.METHODS.POST,
    payload: payload,
    successCallback: successCallbackFunction,
    isDisplayResponsePopUp: true,
    successMessage: successMessagesEnums.Auth.REGISTER.title,
    successPlainText: successMessagesEnums.Auth.REGISTER.text,
  });
};
