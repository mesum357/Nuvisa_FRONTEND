import { NextResponse } from "next/server";
import { RoutesEnums } from "./enums/routes.enums";

export function middleware(request) {
  const token = request.cookies.get("token");
  const url = request.url;

  if (!token) {
    const redirects = {
      [RoutesEnums.Dashboard.Main]: RoutesEnums.Login,
      [RoutesEnums.Dashboard.ProfileSetting]: RoutesEnums.Login,
      [RoutesEnums.Dashboard.ApplicationSteps]: RoutesEnums.Login,
    };

    for (const [path, redirectPath] of Object.entries(redirects)) {
      if (url.includes(path)) {
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  if (token) {
    const redirects = {
      [RoutesEnums.Login]: RoutesEnums.Dashboard.Main,
    };

    for (const [path, redirectPath] of Object.entries(redirects)) {
      if (url.includes(path)) {
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/my-profile", "/application-step", "/login"],
};
