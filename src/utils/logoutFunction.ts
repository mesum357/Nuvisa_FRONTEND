import Router from "next/router";
import Cookies from "js-cookie";
import { store } from "@/store";
import {
  setAuthId,
  setAuthName,
  setAuthState,
  setUpdateUser,
} from "@/store/authSlice";


import { RoutesEnums } from "@/enums/routes.enums";

export const logoutFunction = async (routeToGo = RoutesEnums.HomePage) => {
  Cookies.remove("token");
  store.dispatch(setAuthState(false));
  store.dispatch(setAuthId(""));
  store.dispatch(setAuthName(""));
  store.dispatch(setUpdateUser(false));
  localStorage.removeItem("userEmail");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  Cookies.remove("userEmail");
  Cookies.remove("user");
  await Router.push(routeToGo);
};
