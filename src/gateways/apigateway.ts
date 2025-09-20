import { swalPopupEnums } from "@/enums/app.enums";
import { logMessage } from "@/utils/logMessage";
import { logoutFunction } from "@/utils/logoutFunction";
import axios from "axios";
import Swal, { SweetAlertIcon } from "sweetalert2";

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
}) => {
  const config = {
    method: method,
    url: `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    headers: {
      "Content-Type": contentType ? contentType : "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(payload && { data: payload }),
  };

  try {
    const response = await axios(config);

    if (!directAction && endpoint !== "/visa-application/create") {
      if (isDisplayResponsePopUp) {
        await Swal.fire({
          icon: swalPopupEnums.icon.SUCCESS as SweetAlertIcon,
          title: successMessage || `Action performed successfully.`,
          text: successPlainText,
          confirmButtonColor: "#5b6199",
        }).then((result) => {
          if (result.isConfirmed || result.isDismissed) {
            if (successCallback && typeof successCallback === "function") {
              successCallback();
            }
          }
        });
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
      return;
    }

    const errorMessage = error?.response?.data?.data?.results?.error;

    if (endpoint === "/visa-application/create") {
      return error.response;
    }

    isDisplayResponsePopUp &&
      (await Swal.fire({
        icon: swalPopupEnums.icon.ERROR as SweetAlertIcon,
        title:
          errorMessage ||
          `An unexpected error occurred. Please try again later or contact support if the issue persists.`,
        confirmButtonColor: "#5b6199",
      }).then((result) => {
        if (result.isConfirmed || result.isDismissed) {
          if (errorCallback && typeof errorCallback === "function") {
            errorCallback();
          }
        }
      }));
    return error.response;
  }
};
