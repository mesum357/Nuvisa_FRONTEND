"use client";

import React, { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
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
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [cardholderName, setCardholderName] = useState("");

  const elementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1f2937",
        "::placeholder": {
          color: "#9ca3af",
        },
        fontFamily: "system-ui, -apple-system, sans-serif",
      },
      invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
      },
    },
  };

  const handleCardChange = (field) => (event) => {
    setCardComplete(prev => ({ ...prev, [field]: event.complete }));
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const isFormComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc && cardholderName.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe is not loaded");
      return;
    }

    if (!isFormComplete) {
      setError("Please enter complete card details");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              name: cardholderName,
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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Card Number */}
      <div>
        <div className="relative">
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <CardNumberElement
              options={elementOptions}
              onChange={handleCardChange('cardNumber')}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <CardExpiryElement
              options={elementOptions}
              onChange={handleCardChange('cardExpiry')}
            />
          </div>
        </div>
        <div className="relative">
          <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black">
            <CardCvcElement
              options={elementOptions}
              onChange={handleCardChange('cardCvc')}
            />
          </div>
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <input
          type="text"
          placeholder="Name on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-black focus:ring-1 focus:ring-black outline-none"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={processing || isProcessing || !stripe || !elements || !isFormComplete}
        className={`w-full py-4 px-4 rounded-lg font-semibold text-white transition-colors ${
          processing || isProcessing || !isFormComplete
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black hover:bg-gray-900"
        }`}
      >
        {processing || isProcessing ? (
          <span className="flex items-center justify-center">
            <Loader className="animate-spin mr-2" size={20} />
            Processing...
          </span>
        ) : (
          `Pay now`
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        All transactions are secure and encrypted.
      </p>
    </form>
  );
};

export default StripePaymentForm;
