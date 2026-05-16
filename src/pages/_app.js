import ToastProvider from "@/contexts/ToastContext";
import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import LoadPaymentScripts from "@/components/LoadPaymentScripts";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isCheckoutRoute =
    router.pathname?.includes("checkout") ||
    router.pathname?.includes("payment") ||
    router.pathname?.includes("application-step");

  useEffect(() => {
    if (typeof window === "undefined" || !isCheckoutRoute) return;

    let cancelled = false;
    const initStripe = () => {
      try {
        if (window.Stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          window.stripeInstance = window.Stripe(
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          );
          return true;
        }
      } catch (error) {
        console.warn("Stripe initialization skipped:", error.message);
        window.stripeInstance = null;
      }
      return false;
    };

    if (initStripe()) return;

    const interval = setInterval(() => {
      if (cancelled) return;
      if (initStripe()) clearInterval(interval);
    }, 250);

    const stop = setTimeout(() => clearInterval(interval), 12000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [isCheckoutRoute]);

  // 3. GTM ROUTER LISTENER (This fixes the missing dataLayer issue)
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
        <DeferredAnalytics />
        {isCheckoutRoute && <LoadPaymentScripts />}
        <Component {...pageProps} />
      </ToastProvider>
    </ReduxProvider>
  );
}
