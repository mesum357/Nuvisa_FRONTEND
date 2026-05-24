import { logMessage } from "@/utils/logMessage";
import { logoutFunction } from "@/utils/logoutFunction";
import axios from "axios";

const PAYMENT_ENDPOINTS = new Set([
  "/stripe_payment/payment-intent",
  "/stripe_payment/session",
  "/stripe_payment/confirm",
]);

export const apigateway = async ({
  endpoint,
  method,
  token = null,
  payload = null,
  isDisplayResponsePopUp = false,
  successMessage = null,
  successCallback = null,
  successPlainText = null,
  contentType = null,
  errorCallback = null,
  directAction = false,
  timeout = 10000,
}) => {
  const config = {
    method: method,
    url: `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    timeout,
    headers: {
      "Content-Type": contentType ? contentType : "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(payload && { data: payload }),
  };

  try {
    const response = await axios(config);

    if (!directAction && endpoint !== "/visa-application/create" && endpoint !== "/visa-application/update") {
      if (isDisplayResponsePopUp) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("nuvisa:toast", {
              detail: {
                type: "success",
                message: successMessage || `Action performed successfully.`,
                duration: 5000,
              },
            })
          );
        }
        if (successCallback && typeof successCallback === "function") {
          successCallback();
        }
      }
    } else {
      if (successCallback && typeof successCallback === "function") {
        successCallback();
      }
    }

    return response;
  } catch (error) {
    logMessage(error);

    if (error.response?.data?.message === "UnauthorizedException") {
      await logoutFunction("/login");
      return (
        error.response ?? {
          status: 401,
          data: {
            status: "error",
            message: "UnauthorizedException",
          },
        }
      );
    }

    const errorMessage = error?.response?.data?.data?.results?.error;

    if (
      endpoint === "/visa-application/create" ||
      endpoint === "/visa-application/update" ||
      PAYMENT_ENDPOINTS.has(endpoint)
    ) {
      if (error.response) {
        return error.response;
      }
      if (error.code === "ECONNABORTED") {
        return {
          status: 0,
          data: {
            status: "error",
            message: "Request timed out. Please try again.",
          },
        };
      }
      return {
        status: 0,
        data: {
          status: "error",
          message:
            "Network error. Could not reach the server. Check that the backend is running.",
        },
      };
    }

    if (isDisplayResponsePopUp) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("nuvisa:toast", {
            detail: {
              type: "error",
              message:
                errorMessage ||
                `An unexpected error occurred. Please try again later or contact support if the issue persists.`,
              duration: 6000,
            },
          })
        );
      }
      if (errorCallback && typeof errorCallback === "function") {
        errorCallback();
      }
    }
    return error.response;
  }
};
