import ToastProvider from "@/contexts/ToastContext";
import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { trackPageView } from "@/utils/analytics";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url) => {
      trackPageView(url, document.title);
    };

    // Track initial page view
    trackPageView(window.location.pathname, document.title);

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    // Initialize Stripe when the script loads (with error handling to prevent app crash)
    if (typeof window !== 'undefined') {
      const initStripe = () => {
        try {
          if (window.Stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
            console.log('Stripe initialized successfully');
          } else if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
          }
        } catch (error) {
          // Silently catch Stripe initialization errors to prevent app crash
          console.warn('Stripe initialization skipped:', error.message);
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
          window.removeEventListener('load', handleLoad);
        };
        window.addEventListener('load', handleLoad);
        
        // Also try after a short delay in case load already fired
        const timeoutId = setTimeout(() => {
          if (window.Stripe && !window.stripeInstance) {
            initStripe();
          }
        }, 100);
        
        return () => {
          window.removeEventListener('load', handleLoad);
          clearTimeout(timeoutId);
        };
      }
    }
  }, []);

  return (
    <ReduxProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </ReduxProvider>
  );
}
