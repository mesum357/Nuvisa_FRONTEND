"use client";

import React, { useState, useEffect } from "react";
import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader } from "lucide-react";

const StripePaymentForm = ({
  clientSecret,
  email,
  amount,
  onSuccess,
  onError,
  isProcessing = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
        fontFamily: "system-ui, -apple-system, sans-serif",
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
    hidePostalCode: false,
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not loaded");
      return;
    }

    if (!cardComplete) {
      setError("Please enter complete card details");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              email: email,
            },
          },
        });

      if (confirmError) {
        setError(confirmError.message);
        onError?.(confirmError);
        setProcessing(false);
      } else if (paymentIntent.status === "succeeded") {
        onSuccess?.(paymentIntent);
        setProcessing(false);
      } else {
        setError(`Payment status: ${paymentIntent.status}`);
        onError?.(new Error(`Payment status: ${paymentIntent.status}`));
        setProcessing(false);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Card Details</h3>

        <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Amount:</span> £{(amount / 100).toFixed(2)}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Email:</span> {email}
          </p>
        </div>

        <button
          type="submit"
          disabled={processing || isProcessing || !stripe || !elements || !cardComplete}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            processing || isProcessing || !cardComplete
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#7350FF] hover:bg-[#6247D3]"
          }`}
        >
          {processing || isProcessing ? (
            <span className="flex items-center justify-center">
              <Loader className="animate-spin mr-2" size={20} />
              Processing Payment...
            </span>
          ) : (
            `Pay £${(amount / 100).toFixed(2)}`
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-500">
        Your payment is secure and encrypted by Stripe
      </p>
    </form>
  );
};

export default StripePaymentForm;
