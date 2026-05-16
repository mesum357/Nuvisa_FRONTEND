import ToastProvider from "@/contexts/ToastContext";
import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router"; // 1. Import useRouter

export default function App({ Component, pageProps }) {
  const router = useRouter(); // 2. Initialize router

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCheckoutRoute =
      router.pathname?.includes("checkout") ||
      router.pathname?.includes("payment") ||
      router.pathname?.includes("application-step");
    if (!isCheckoutRoute) return;

    // Initialize Stripe when the script loads (with error handling to prevent app crash)
    if (typeof window !== "undefined") {
      const initStripe = () => {
        try {
          if (window.Stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            window.stripeInstance = window.Stripe(
              process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            );
            console.log("Stripe initialized successfully");
          } else if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
          }
        } catch (error) {
          // Silently catch Stripe initialization errors to prevent app crash
          console.warn("Stripe initialization skipped:", error.message);
          window.stripeInstance = null;
        }
      };

      // If Stripe is already loaded
      if (window.Stripe) {
        initStripe();
      } else {
        // Wait for the script to load
        const handleLoad = () => {
          initStripe();
          window.removeEventListener("load", handleLoad);
        };
        window.addEventListener("load", handleLoad);

        // Also try after a short delay in case load already fired
        const timeoutId = setTimeout(() => {
          if (window.Stripe && !window.stripeInstance) {
            initStripe();
          }
        }, 100);

        return () => {
          window.removeEventListener("load", handleLoad);
          clearTimeout(timeoutId);
        };
      }
    }
  }, [router.pathname]);

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
        <Component {...pageProps} />
      </ToastProvider>
    </ReduxProvider>
  );
}
