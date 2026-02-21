"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import { Loader } from "lucide-react";

import { createPaymentIntent } from "@/api/stripePayment";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useAppDispatch } from "@/store";
import { setAuthId, setAuthState } from "@/store/authSlice";
import {
  setAmountWithoutDiscount,
  setAppliedDiscount,
  setCouponCode,
  setGiftCardFees,
  setInsuranceFees,
  setTotalAmount,
  setTravelers,
} from "@/store/visaSlice";

const validateEmail = (value) =>
  !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const ExpressPaymentRequestButton = forwardRef(
  (
    {
      amount,
      currency,
      email,
      travellers,
      country,

      includeInsurance,
      insuranceCount,
      insurancePaymentAmount,

      visaTypeId,
      paymentType,
      disabled,
      onBeforePayment,

      // NEW:
      visaFees,
      insuranceFees,
      giftCardFees,
      includeGiftCard,
      giftCardCount,
      // Additional props for localStorage/Redux setup (same as handleProceedToCheckout)
      subtotalGBP,
      discountedInsuranceFeesGBP,
      visaFeesGBP,
      couponCode,
      hideUI = false, // If true, hide the Stripe button UI (buttons will be in parent)
    },
    ref
  ) => {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [paymentRequest, setPaymentRequest] = useState(null);
    const [buttonError, setButtonError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [availableMethods, setAvailableMethods] = useState({
      applePay: false,
      googlePay: false,
    });
    const shouldValidateOnPaymentMethodRef = useRef(true);

    const normalizedAmount = useMemo(() => {
      if (!amount || Number(amount) <= 0) return null;
      return Math.round(Number(amount) * 100); // Stripe PaymentRequest expects minor units
    }, [amount]);

    useEffect(() => {
      // Apple Pay and Google Pay provide email, so we don't require it upfront
      if (!stripe || !elements || !normalizedAmount) {
        setPaymentRequest(null);
        setIsSupported(false);
        return;
      }

      const request = stripe.paymentRequest({
        country: "GB",
        currency: currency.toLowerCase(),
        total: {
          label: "NUvisa - Visa Application",
          amount: normalizedAmount,
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestPayerPhone: false, // Optional - set to true if you need phone
        // Display items for better breakdown (works for both Apple Pay and Google Pay)
        displayItems: [
          {
            label: "Visa Fees",
            amount: Math.round((visaFees || 0) * 100),
          },
          includeInsurance && {
            label: `Insurance (${insuranceCount || 0})`,
            amount: Math.round((insuranceFees || 0) * 100),
          },
          includeGiftCard && {
            label: `Gift Cards (${giftCardCount || 0})`,
            amount: Math.round((giftCardFees || 0) * 100),
          },
        ].filter(Boolean),
      });

      let isMounted = true;

      request.canMakePayment().then((result) => {
        if (!isMounted) return;
        if (result) {
          setPaymentRequest(request);
          setIsSupported(true);
          // Check which specific payment methods are available
          // Stripe's canMakePayment() returns an object with payment method identifiers
          // The result object may have properties like 'applePay' and 'googlePay'
          let applePayAvailable = false;
          let googlePayAvailable = false;

          if (result && typeof result === "object") {
            // Check for explicit properties
            applePayAvailable = !!result.applePay;
            googlePayAvailable = !!result.googlePay || !!result.google;

            // If not found, check all keys for hints
            if (!applePayAvailable && !googlePayAvailable) {
              const keys = Object.keys(result);
              applePayAvailable = keys.some((key) =>
                key.toLowerCase().includes("apple")
              );
              googlePayAvailable = keys.some((key) =>
                key.toLowerCase().includes("google")
              );
            }

            // Fallback: use user agent as heuristic (not perfect, but helps)
            if (!applePayAvailable && !googlePayAvailable) {
              const userAgent =
                typeof window !== "undefined" ? window.navigator.userAgent : "";
              const isAppleDevice = /iPhone|iPad|iPod|Macintosh/i.test(
                userAgent
              );
              const isAndroidOrChrome =
                /Android/i.test(userAgent) ||
                (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent));

              // Only use user agent if we're confident
              if (isAppleDevice && !isAndroidOrChrome) {
                applePayAvailable = true;
              } else if (isAndroidOrChrome && !isAppleDevice) {
                googlePayAvailable = true;
              }
            }
          }

          setAvailableMethods({
            applePay: applePayAvailable,
            googlePay: googlePayAvailable,
          });

          // Log for debugging (can be removed in production)
          console.log("[ExpressPayment] Detected payment methods:", {
            applePay: applePayAvailable,
            googlePay: googlePayAvailable,
            rawResult: result,
          });
        } else {
          setPaymentRequest(null);
          setIsSupported(false);
          setAvailableMethods({
            applePay: false,
            googlePay: false,
          });
        }
      });

      return () => {
        isMounted = false;
        if (request && request.off) {
          request.off("paymentmethod");
        }
      };
    }, [
      stripe,
      elements,
      normalizedAmount,
      currency,
      travellers,
      includeInsurance,
      insuranceCount,
      insuranceFees,
      includeGiftCard,
      giftCardCount,
      giftCardFees,
      visaFees,
      amount, // <--- IMPORTANT
    ]);

    useEffect(() => {
      if (!paymentRequest) return;

      const handlePaymentMethod = async (event) => {
        setIsSubmitting(true);
        setButtonError(null);

        // Validate before proceeding with payment
        const shouldValidate = shouldValidateOnPaymentMethodRef.current;
        if (shouldValidate && onBeforePayment) {
          const validationError = onBeforePayment();
          if (validationError) {
            event.complete("fail");
            setButtonError(validationError);
            setIsSubmitting(false);
            return;
          }
        }
        shouldValidateOnPaymentMethodRef.current = true;

        try {
          // Set up localStorage/Redux state EXACTLY like handleProceedToCheckout does
          // This ensures both express button and radio-button Google Pay use identical state
          // Use the amount prop directly (which is already the correct total from OrderCheckout)
          localStorageGateway(
            "paymentAmount",
            localStorageEnums.SET,
            String(amount)
          );

          localStorageGateway(
            "insurancePaymentMetadata",
            localStorageEnums.SET,
            String(
              JSON.stringify({
                insuranceCount: includeInsurance ? (insuranceCount || 0) : 0,
                insurancePaymentAmount: discountedInsuranceFeesGBP || insurancePaymentAmount || 0,
              })
            )
          );

          localStorageGateway(
            "insurancePayment",
            localStorageEnums.SET,
            String(discountedInsuranceFeesGBP || insurancePaymentAmount || 0)
          );
          localStorageGateway(
            "insuranceSelected",
            localStorageEnums.SET,
            includeInsurance ? true : false
          );
          localStorageGateway("travelers", localStorageEnums.SET, String(travellers || 1));

          if (subtotalGBP !== undefined) {
            dispatch(setAmountWithoutDiscount(Number(subtotalGBP)));
          }
          dispatch(setTotalAmount(Number(amount)));
          if (discountedInsuranceFeesGBP !== undefined) {
            dispatch(setInsuranceFees(Number(discountedInsuranceFeesGBP)));
          } else if (insurancePaymentAmount !== undefined) {
            dispatch(setInsuranceFees(Number(insurancePaymentAmount)));
          }
          if (giftCardFees !== undefined) {
            dispatch(setGiftCardFees(Number(giftCardFees)));
          }
          if (couponCode !== undefined && couponCode) {
            dispatch(setCouponCode(couponCode.trim().toUpperCase()));
          }
          dispatch(setTravelers(Number(travellers || 1)));

          if (visaFeesGBP !== undefined) {
            localStorageGateway(
              "paymentWithoutInsurance",
              localStorageEnums.SET,
              String(visaFeesGBP)
            );
          }

          if (amount !== undefined && discountedInsuranceFeesGBP !== undefined) {
            localStorageGateway(
              "paymentWithDiscount",
              localStorageEnums.SET,
              String(Number(amount) - Number(discountedInsuranceFeesGBP))
            );
          }

          // Create PaymentIntent with EXACT same payload structure
          // Use the amount prop directly (which is already the correct total from OrderCheckout)
          const checkoutPayload = {
            email: event.payerEmail || email,
            amount: String(Number(amount).toFixed(2)), // Use the amount prop (same as radio button uses)
            travellers: String(travellers || 1),
            country: country || "",
            insurance: includeInsurance ? "true" : "false",
            paymentType,
            visaTypeId: visaTypeId || "",
            currency: currency.toUpperCase(),
            noOfInsurance: insuranceCount || 0,
            insurancePaymentAmount: discountedInsuranceFeesGBP || insurancePaymentAmount || 0,
            successUrl: `${window.location.origin}/payment-success`,
            cancelUrl: `${window.location.origin}/visa-checkout`,
            // Include gift card quantity when paymentType includes "gift_card"
            ...(paymentType && paymentType.includes("gift_card") && includeGiftCard && giftCardCount > 0
              ? { quantity: String(giftCardCount), noOfGiftCards: String(giftCardCount) }
              : {}),
          };

          const response = await createPaymentIntent(checkoutPayload, () => {});

          if (response?.status !== 200 && response?.status !== 201) {
            throw new Error(
              response?.data?.message || "Unable to initialize payment"
            );
          }

          const data =
            response?.data?.data?.results ||
            response?.data?.results ||
            (response?.data?.status === "success"
              ? response?.data?.data?.results
              : null);

          const clientSecret = data?.clientSecret;

          if (!clientSecret) {
            throw new Error("Missing client secret from payment intent");
          }

          if (data?.token) {
            await localStorageGateway(
              "token",
              localStorageEnums.SET,
              data.token
            );
            await Cookies.set("token", data.token);
            dispatch(setAuthState(true));
          }

          if (data?.user) {
            await Cookies.set("user", JSON.stringify(data.user));
            await localStorageGateway(
              "user",
              localStorageEnums.SET,
              JSON.stringify(data.user)
            );
            if (data.user.id) {
              dispatch(setAuthId(data.user.id));
            }
          }

          const { error: confirmError, paymentIntent } =
            await stripe.confirmCardPayment(
              clientSecret,
              {
                payment_method: event.paymentMethod.id,
              },
              { handleActions: false }
            );

          if (confirmError) {
            event.complete("fail");
            // Provide user-friendly error messages based on error type
            const errorMessage = confirmError.decline_code
              ? `Payment declined: ${confirmError.message}`
              : confirmError.message ||
                "Payment failed. Please try another payment method.";
            throw new Error(errorMessage);
          }

          let finalIntent = paymentIntent;

          // Handle 3D Secure or other required actions
          if (paymentIntent.status === "requires_action") {
            const { error: actionError, paymentIntent: resolvedIntent } =
              await stripe.confirmCardPayment(clientSecret, {
                payment_method: event.paymentMethod.id,
              });

            if (actionError) {
              event.complete("fail");
              // Provide specific error messages for 3D Secure failures
              const errorMessage =
                actionError.code === "payment_intent_authentication_failure"
                  ? "Card authentication failed. Please try again or use another payment method."
                  : actionError.message || "Payment authentication failed.";
              throw new Error(errorMessage);
            }

            finalIntent = resolvedIntent;
          }

          // Only complete with success after payment is fully confirmed
          if (finalIntent.status === "succeeded") {
            event.complete("success");

            const paymentMetadata = {
              paymentIntentId: finalIntent.id,
              email: checkoutPayload.email,
              amount: checkoutPayload.amount,
              travellers: checkoutPayload.travellers,
              country: checkoutPayload.country,
              insurance: checkoutPayload.insurance,
              paymentType: checkoutPayload.paymentType,
              timestamp: Date.now(),
              paymentDate: new Date().toISOString(),
            };

            await localStorageGateway(
              "paymentMetadata",
              localStorageEnums.SET,
              JSON.stringify(paymentMetadata)
            );
            await localStorageGateway(
              "paymentAmount",
              localStorageEnums.SET,
              String(checkoutPayload.amount)
            );
            await localStorageGateway(
              "userEmail",
              localStorageEnums.SET,
              checkoutPayload.email
            );

            // Check if there's an applicationId to redirect to application step
            try {
              const stored = localStorage.getItem("paymentMetadata");
              const pm = stored ? JSON.parse(stored) : null;
              const appId = pm?.applicationId || null;
              if (appId) {
                router.push(
                  `/application-step?application_id=${encodeURIComponent(
                    appId
                  )}`
                );
              } else {
                router.push("/payment-success");
              }
            } catch {
              router.push("/payment-success");
            }
          } else {
            event.complete("fail");
            throw new Error(`Payment status: ${finalIntent.status}`);
          }
        } catch (err) {
          console.error("Express payment error:", err);
          event.complete("fail");
          setButtonError(
            err?.message ||
              "Express checkout failed. Please use another payment method."
          );
        } finally {
          setIsSubmitting(false);
        }
      };

      paymentRequest.on("paymentmethod", handlePaymentMethod);

      return () => {
        if (paymentRequest && paymentRequest.off) {
          paymentRequest.off("paymentmethod", handlePaymentMethod);
        }
      };
    }, [
      paymentRequest,
      amount,
      currency,
      email,
      travellers,
      country,
      includeInsurance,
      insuranceCount,
      insurancePaymentAmount,
      visaTypeId,
      paymentType,
      stripe,
      // New props for localStorage/Redux setup
      subtotalGBP,
      discountedInsuranceFeesGBP,
      visaFeesGBP,
      couponCode,
      giftCardFees,
      dispatch,
      onBeforePayment,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        triggerPaymentRequest: () => {
          if (!paymentRequest || !isSupported) {
            const message = "Add at least one traveller to enable checkout";
            setButtonError(message);
            return { success: false, message };
          }

          // Validate BEFORE showing the payment popup
          if (onBeforePayment) {
            const validationError = onBeforePayment();
            if (validationError) {
              setButtonError(validationError);
              return { success: false, message: validationError };
            }
          }

          if (typeof paymentRequest.show !== "function") {
            const message = "Add at least one traveller to enable checkout";
            setButtonError(message);
            return { success: false, message };
          }

          try {
            shouldValidateOnPaymentMethodRef.current = true;
            const result = paymentRequest.show();
            if (result && typeof result.catch === "function") {
              result.catch((err) => {
                shouldValidateOnPaymentMethodRef.current = true;
                const message =
                  err?.message ||
                  "Unable to open Apple Pay / Google Pay on this device.";
                setButtonError(message);
              });
            }
            return { success: true };
          } catch (err) {
            shouldValidateOnPaymentMethodRef.current = true;
            const message =
              err?.message ||
              "Unable to open Apple Pay / Google Pay on this device.";
            setButtonError(message);
            return { success: false, message };
          }
        },
        getAvailableMethods: () => availableMethods,
      }),
      [paymentRequest, isSupported, onBeforePayment, availableMethods]
    );

    if (disabled) {
      return (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          {disabled}
        </div>
      );
    }

    if (!stripe || !elements) {
      return (
        <div className="p-4 border rounded-lg text-sm text-red-700 bg-red-50 border-red-200">
          Stripe is not initialized. Please refresh and try again.
        </div>
      );
    }

    // Email is optional - Apple Pay and Google Pay provide it automatically

    if (!normalizedAmount) {
      return (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          Add at least one traveller to enable express checkout.
        </div>
      );
    }

    // In development mode, show buttons even if not supported (for testing)
    const isDevelopment =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_NODE_ENV === "development";

    if (!isSupported && !isDevelopment) {
      return (
        <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700">
          Apple Pay / Google Pay is not available on this device or browser.
        </div>
      );
    }

    // If hideUI is true, don't render any UI - just provide the payment logic via ref
    if (hideUI) {
      return null;
    }

    return (
      <div className="w-full">
        {buttonError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {buttonError}
          </div>
        )}

        {isSubmitting && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <Loader className="animate-spin" size={18} />
            Processing express payment...
          </div>
        )}

        {isDevelopment && !isSupported && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ Development Mode: Apple Pay / Google Pay buttons shown for
            testing (not actually supported on this device/browser).
          </div>
        )}

        {paymentRequest && (
          <div data-express-payment="true">
            <div onClick={() => ref?.current?.triggerPaymentRequest()}>
              <PaymentRequestButtonElement
                key={normalizedAmount} // <--- Forces Stripe element to fully reset
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      type: "default",
                      theme: "dark",
                      height: "48px",
                      borderRadius: "999px",
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {isDevelopment && !paymentRequest && (
          <div
            className="grid grid-cols-2 gap-3 max-sm:grid-cols-1 max-sm:gap-2"
            data-express-payment="true"
          >
            {/* Mock Apple Pay Button for Development */}
            <button
              onClick={() => {
                setButtonError(null);
                // Run validation first
                if (onBeforePayment) {
                  const validationError = onBeforePayment();
                  if (validationError) {
                    setButtonError(validationError);
                    return;
                  }
                }
                setButtonError(
                  "Development Mode: Apple Pay is not actually supported on this device. Please test on a device with Apple Pay enabled."
                );
              }}
              className="group relative flex items-center justify-center bg-black text-white rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-all duration-200 shadow-sm max-sm:py-2.5"
              style={{
                backgroundColor: "#000",
                minHeight: "44px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <span className="font-medium tracking-wide max-sm:text-sm">
                  Pay
                </span>
              </div>
            </button>

            {/* Mock Google Pay Button for Development */}
            <button
              onClick={() => {
                setButtonError(null);
                // Run validation first
                if (onBeforePayment) {
                  const validationError = onBeforePayment();
                  if (validationError) {
                    setButtonError(validationError);
                    return;
                  }
                }
                setButtonError(
                  "Development Mode: Google Pay is not actually supported on this device. Please test on a device with Google Pay enabled."
                );
              }}
              className="group relative flex items-center justify-center bg-white text-gray-800 rounded-full px-6 py-3 text-sm font-medium hover:shadow-md transition-all duration-200 shadow-sm border border-gray-200 max-sm:py-2.5"
              style={{
                minHeight: "44px",
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  className="shrink-0 max-sm:w-4 max-sm:h-4"
                >
                  <g fill="none" fillRule="evenodd">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    />
                  </g>
                </svg>
                <span className="font-medium tracking-wide text-gray-700 max-sm:text-sm">
                  Pay
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default ExpressPaymentRequestButton;
