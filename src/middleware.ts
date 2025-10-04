import { NextResponse } from "next/server";
import { RoutesEnums } from "./enums/routes.enums";

export function middleware(request) {
  const rawToken = request.cookies.get("token");
  const token = rawToken?.value ?? rawToken ?? null;
  const url = request.url;

    const userEmailCookie = request.cookies.get("userEmail");
    const email = userEmailCookie?.value 
    

 const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || ""
    if (url.includes('/admin')) {
      if (email !== adminEmail) {
        const redirectUrl = new URL(RoutesEnums.Dashboard.Main, request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
    
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
   
    if (url.includes(RoutesEnums.Login)) {
      const redirectPath = email === adminEmail ? '/admin' : RoutesEnums.Dashboard.Main;
      const redirectUrl = new URL(redirectPath, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/my-profile", "/application-step", "/login","/admin"],
};
