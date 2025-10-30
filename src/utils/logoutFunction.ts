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
  // Remove auth cookies across common path/domain variants
  Cookies.remove("token");
  Cookies.remove("token", { path: "/" });
  if (process.env.NEXT_PUBLIC_COOKIE_DOMAIN) {
    try { Cookies.remove("token", { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }); } catch {}
    try { Cookies.remove("token", { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN, path: "/" }); } catch {}
  }
  store.dispatch(setAuthState(false));
  store.dispatch(setAuthId(""));
  store.dispatch(setAuthName(""));
  store.dispatch(setUpdateUser(false));
  localStorage.removeItem("userEmail");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  Cookies.remove("userEmail");
  Cookies.remove("userEmail", { path: "/" });
  Cookies.remove("user");
  Cookies.remove("user", { path: "/" });
  if (process.env.NEXT_PUBLIC_COOKIE_DOMAIN) {
    try { Cookies.remove("userEmail", { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }); } catch {}
    try { Cookies.remove("userEmail", { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN, path: "/" }); } catch {}
    try { Cookies.remove("user", { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }); } catch {}
    try { Cookies.remove("user", { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN, path: "/" }); } catch {}
  }
  await Router.replace(routeToGo);
  if (typeof window !== "undefined") {
    window.location.reload();
  }
};
