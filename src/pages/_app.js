import ToastProvider from "@/contexts/ToastContext";
import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import LoadPaymentScripts from "@/components/LoadPaymentScripts";
import SitePageLoader from "@/components/SitePageLoader";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isCheckoutRoute =
    router.pathname?.includes("checkout") ||
    router.pathname?.includes("payment") ||
    router.pathname?.includes("application-step");

  // GTM router listener
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "pageview",
          page: url,
        });
      }
    };

    // Listen for page changes after the initial load
    router.events.on("routeChangeComplete", handleRouteChange);

    // Clean up the listener when the component unmounts
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <ReduxProvider>
      <ToastProvider>
        <SitePageLoader />
        <DeferredAnalytics />
        {isCheckoutRoute && <LoadPaymentScripts />}
        <Component {...pageProps} />
      </ToastProvider>
    </ReduxProvider>
  );
}
