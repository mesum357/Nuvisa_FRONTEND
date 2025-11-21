"use client";

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

let stripePromise;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error(
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables"
      );
      return null;
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

const StripeProvider = ({ children, options = {} }) => {
  const stripe = getStripe();

  if (!stripe) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">
          Stripe is not configured. Please check your environment variables.
        </p>
      </div>
    );
  }

  const defaultOptions = {
    mode: "payment",
    currency: "gbp",
    ...options,
  };

  return (
    <Elements stripe={stripe} options={defaultOptions}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
