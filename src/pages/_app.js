import ToastProvider from "@/contexts/ToastContext";
import ReduxProvider from "@/store/redux-provider";
import "@/styles/globals.css";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize Stripe when the script loads
    if (typeof window !== 'undefined') {
      const initStripe = () => {
        if (window.Stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          window.stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          console.log('Stripe initialized successfully');
        } else if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
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
