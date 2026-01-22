"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSelectedCountry,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import usePaymentData from "@/hooks/usePaymentData";
import { createApplication } from "@/api/visa";
import { createOrUpdateApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";


const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const { getCurrentPaymentData, addPaymentToHistory } = usePaymentData();
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [paymentType, setPaymentType] = useState("application_creation");
  const hasProcessedPayment = useRef(false);

  useEffect(() => {
    const storePaymentDataAndRedirect = async () => {
      // Prevent multiple executions
      if (hasProcessedPayment.current) {
        return;
      }

      hasProcessedPayment.current = true;

      try {
        // Get payment data from current session
        const currentData = await getCurrentPaymentData();


        const sessionId = searchParams.get("session_id");
        if (
          !sessionId &&
          (!currentData ||
            (!currentData.totalAmount && !currentData.applicationId))
        ) {
          setTimeout(() => router.replace("/dashboard"), 800);
          return;
        }

        // Check if this is a traveler insurance payment (both regular and additional)
        // Prioritize URL parameters over localStorage data for insurance payments
        let paymentTypeParam = searchParams.get("payment_type");
        let applicationId = searchParams.get("application_id");
        let travelerIndex = searchParams.get("traveler_index");

        // If URL parameters are missing, check for stored insurance payment metadata
        // Keep a copy of the used stored metadata so we can include orderId/paymentAmount
        let usedStoredInsuranceMetadata = null;
        if (!paymentTypeParam || !applicationId) {
          try {
            const storedMetadata = localStorage.getItem(
              "insurancePaymentMetadata"
            );
            if (storedMetadata) {
              const metadata = JSON.parse(storedMetadata);
              // Only use stored metadata if it's recent (within last 5 minutes)
              if (Date.now() - metadata.timestamp < 5 * 60 * 1000) {
                paymentTypeParam = paymentTypeParam || metadata.paymentType;
                applicationId = applicationId || metadata.applicationId;
                travelerIndex = travelerIndex || metadata.travelerIndex;
                usedStoredInsuranceMetadata = metadata; // preserve for later POST

                // Clean up the stored metadata after use
                localStorage.removeItem("insurancePaymentMetadata");
              }
            }
          } catch (error) {
            console.error("Error retrieving stored payment metadata:", error);
          }
        }

        // If paymentTypeParam is still missing, check paymentMetadata (used for gift cards and other payment types)
        if (!paymentTypeParam) {
          try {
            if (currentData.paymentMetadata) {
              const metadata = currentData.paymentMetadata;
              // Only use stored metadata if it's recent (within last 5 minutes)
              if (Date.now() - (metadata.timestamp || 0) < 5 * 60 * 1000) {
                paymentTypeParam = metadata.paymentType;
              }
            }
          } catch (error) {
            console.error("Error retrieving paymentMetadata:", error);
          }
        }

        // If URL parameters indicate insurance payment, use those values
        // Otherwise fallback to localStorage data for application creation
        const finalPaymentType =
          paymentTypeParam || currentData.paymentType || "application_creation";
        const finalApplicationId = applicationId

        setPaymentType(finalPaymentType);

        // Check if this is a gift card purchase
        if (finalPaymentType === "gift_card") {
          // Gift card purchase - show confirmation message
          // The backend webhook will automatically create the gift card and send email
          setPaymentType("gift_card");
          return; // Don't create application for gift card purchases
        }

        // Check if this is a full payment or additional traveler payment
        if (
          finalPaymentType === "full_payment" ||
          finalPaymentType === "additional_traveler"
        ) {
          // Update the application payment status without marking fullPayment step as completed
          // The step will only be completed when ALL travelers have paid
          try {
            const updateResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  paymentType: finalPaymentType,
                  applicationId: finalApplicationId,
                  travelerIndex: travelerIndex,
                  email: currentData.email,
                  amount: currentData.totalAmount,
                  sessionId: sessionId,
                }),
              }
            );
          } catch (error) {
            console.error("Error updating payment status:", error);
          }

          if (finalApplicationId) {
            router.replace(
              `/application-step/?application_id=${finalApplicationId}`
            );
          }
          return;
        }

        // Original application creation payment flow
        const paymentInfo = {
          sessionId,
          email: currentData.email,
          selectedCountry: currentData.selectedCountry,
          insurancePayment: currentData.insurancePayment,
          travelers: currentData.travelers,
          totalAmount: currentData.totalAmount,
          paymentDate: new Date().toISOString(),
        };

        // Add to payment history
        await addPaymentToHistory(paymentInfo);

        // Update Redux store
        if (currentData.selectedCountry) {
          dispatch(setSelectedCountry(currentData.selectedCountry));
        }
        if (Number.isFinite(Number(currentData.insurancePayment))) {
          dispatch(setInsuranceFees(Number(currentData.insurancePayment)));
        }
        if (Number.isFinite(Number(currentData.travelers))) {
          dispatch(setTravelers(Number(currentData.travelers)));
        }

        // Create visa application
        setIsCreatingApplication(true);

        // Initialize travelers data with insurance set for each initial traveler
        const numberOfTravelers = Number(currentData.travelers) || 1;

        // Use the actual insurance selection boolean, fallback to fee check for backward compatibility
        const hasInsurance =
          currentData.insuranceSelected === "true" ||
            (currentData.insuranceSelected === undefined &&
              Number(currentData.insurancePayment) > 0)
            ? true
            : false;

        // Determine if this is truly a checkout payment or application step payment
        const isCheckoutPayment =
          finalPaymentType === "application_creation" ||
          (!finalPaymentType && !applicationId); // No payment type means initial checkout

        const insurancePayload = numberOfTravelers === currentData?.storedMetadata?.insuranceCount ? {
          insurance: hasInsurance,
          insuranceDetails:
            hasInsurance ? { selected: true } : null,
          insuranceCertificate: null,
          orderId: null,
          paymentAmount: hasInsurance ? Number(currentData.insurancePayment) || 0 : 0,
          paidInCheckout: hasInsurance && isCheckoutPayment,
          insuranceSource: hasInsurance && isCheckoutPayment ? "checkout" : null,
          insurancePaymentCompleted: hasInsurance,
        } : {}


        const initialTravelersData = Array.from(
          { length: numberOfTravelers },
          (_, index) => ({
            id: `traveler_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            basicDetails: {
              passportNumber: "",
              firstName: "",
              lastName: "",
              sex: "",
              dateOfBirth: "",
              placeOfBirth: "",
              passportIssuePlace: "",
              passportIssueDate: "",
              passportExpiryDate: "",
              currentAddress1: "",
              currentAddress2: "",
              state: "",
              city: "",
              pincode: "",
              passportFront: null,
              passportBack: null,
            },
            visitDetails: {
              visitingOtherSchengenCountries: [],
              firstCountryOfEntry: "",
              hasSchengenVisa: "",
              lastVisaStartDate: "",
              lastVisaEndDate: "",
              hasDigitalFingerprints: "",
              previousVisaNumber: "",
              maritalStatus: "",
              partnerFullName: "",
              partnerDateOfBirth: "",
              employmentStatus: "",
              institutionName: "",
              instituteEmail: "",
              instituteAddress: "",
              employerPhone: "",
              employerName: "",
              employerEmail: "",
              employerAddress: "",
              otherEmploymentStatus: "",
              willAnyonePayForVisit: "",
              fundingPersonName: "",
              tripFundedBy: "",
            },
            documents: {
              documents: {},
            },
            insurance: insurancePayload,
            fullPayment: {
              paymentStatus: "completed",
              paymentCompleted: true,
              paymentAmount: Number((Number(currentData?.amountWithDiscount || 149) / numberOfTravelers).toFixed(2)) || 0,
              paymentDate: new Date().toISOString(),
              paymentMethod: "stripe",
              includeInsurance: hasInsurance,
              insuranceType: hasInsurance ? "purchase" : "none",
              paidInCheckout: isCheckoutPayment,
            },
          })
        );


        const applicationPayload = {
          type: "createApplication",
          email: currentData.email,
          insuranceDetails: numberOfTravelers === currentData?.storedMetadata?.insuranceCount ? null : {
            paidInCheckout: {
              noOfInsurance: currentData?.storedMetadata?.insuranceCount || 0,
              paymentAmount: currentData?.storedMetadata?.insurancePaymentAmount || 0,
            },
            certificateCount: 0,
            certificate: [],
          }, // Keep for backward compatibility during transition (string value)
          country: currentData.selectedCountry,
          amountPaid: currentData.totalAmount?.toString(),
          paymentWithoutInsurance: Number(currentData?.paymentWithoutInsurance),
          numberOfTravellers: numberOfTravelers,
          travelersData: initialTravelersData, // Pass initialized travelers data
          visaTypeId: "66755c9f11e8e79f4c31d9e4", // Add visa type ID from Redux or localStorage
          selectedVisaType: "66755c9f11e8e79f4c31d9e4", // Add selected visa type from Redux or localStorage
          // Add arrival and departure dates from Redux store for SMV order creation
          arrivalDate: visaState.arrivalDate,
          departureDate: visaState.departureDate,
          travelStartDate: visaState.arrivalDate || "",
          travelEndDate: visaState.departureDate || "",
          insurancePaymentCompleted: hasInsurance,
          initialInsurancePaidTotal: hasInsurance
            ? (Number(currentData.insurancePayment) || 0).toString()
            : "0",
          initialInsurancePaidTotal: hasInsurance ? (Number(currentData.insurancePayment) || 0).toString() : "0",

        };

        if (
          (finalPaymentType === "additional_traveler_insurance" ||
            finalPaymentType === "traveler_insurance") &&
          finalApplicationId
        ) {
          try {
            const postAmountRaw =
              (usedStoredInsuranceMetadata &&
                usedStoredInsuranceMetadata.paymentAmount) ||
              (Number.isFinite(Number(currentData.totalAmount))
                ? currentData.totalAmount
                : "490");
            const postOrderId =
              (usedStoredInsuranceMetadata &&
                usedStoredInsuranceMetadata.orderId) ||
              undefined;

            const postAmount = Number(postAmountRaw);

            // If travelerIndex is provided, notify backend for that traveler
            if (
              travelerIndex !== null &&
              travelerIndex !== undefined &&
              travelerIndex !== ""
            ) {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    paymentType: finalPaymentType,
                    travelerIndex: travelerIndex,
                    applicationId: finalApplicationId,
                    email: currentData.email,
                    amount: postAmount,
                    orderId: postOrderId,
                  }),
                }
              );

              // Update only the specific traveler locally via API
              const insuranceUpdateResponse = await createOrUpdateApplication(
                "",
                {
                  ...applicationPayload,
                  insurance: true,
                  travelersData: initialTravelersData.map((traveler, index) =>
                    index === Number(travelerIndex)
                      ? {
                        ...traveler,
                        insurance: {
                          orderId: postOrderId || null,
                          paymentAmount: postAmount,
                          insurancePaymentCompleted: true,
                        },
                      }
                      : traveler
                  ),
                  insurancePaymentCompleted: true,
                }
              );

              const insuranceResult =
                insuranceUpdateResponse?.data?.data?.results || {};
            } else {
              // No travelerIndex -> application-level insurance payment covering all travelers
              await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/stripe_payment/test-insurance-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    paymentType: finalPaymentType,
                    applicationId: finalApplicationId,
                    email: currentData.email,
                    amount: postAmount,
                    orderId: postOrderId,
                  }),
                }
              );

              // Mark insurance as completed at the application level
              const insuranceUpdateResponse = await createOrUpdateApplication(
                "",
                {
                  ...applicationPayload,
                  insurance: true,
                  insurancePaymentCompleted: true,
                  amountPaid: postAmount,
                  orderId: postOrderId || undefined,
                }
              );
            }
          } catch (error) {
            console.error(
              "Error updating traveler/application insurance:",
              error
            );
          }

          setTimeout(() => {
            router.replace(
              `/application-step/?application_id=${finalApplicationId}`
            );
          }, 2000);
          return;
        }

        const applicationResponse = await createApplication(applicationPayload);
        if (
          applicationResponse?.status === 200 ||
          applicationResponse?.status === 201
        ) {
          // Application created successfully, redirect to application-step
          setTimeout(() => {
            router.replace(
              "/application-step/?application_id=" +
              applicationResponse?.data?.data?.results?.application?.id
            );
          }, 2000); // 2 second delay
        } else {
          throw new Error("Failed to create visa application");
        }
      } catch (error) {
        console.error(
          "Error storing payment data or creating application:",
          error
        );
        // Still redirect to application-step even if there's an error, after a brief delay
        setTimeout(() => {
          router.replace("/application-step");
        }, 2000);
      } finally {
        setIsCreatingApplication(false);
      }
    };

    storePaymentDataAndRedirect();
  }, []); // Empty dependency array to run only once

  // Show gift card purchase confirmation
  if (paymentType === "gift_card") {
    const userEmail = typeof window !== "undefined" 
      ? localStorageGateway("userEmail", localStorageEnums.GET) || ""
      : "";
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gift Card Purchase Successful!
            </h1>
            <p className="text-gray-600 mb-4">
              Your gift card purchase was successful!
            </p>
            {userEmail && (
              <p className="text-gray-700 mb-2">
                A confirmation email with your redemption code has been sent to{" "}
                <span className="font-semibold">{userEmail}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Please check your email for the code. The code format is:{" "}
              <span className="font-mono font-semibold">NU-VISA-XXXXXX</span>
            </p>
          </div>
          <button
            onClick={() => router.push("/visa-checkout")}
            className="w-full bg-[#7350FF] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#7350FF]/90 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7350FF] mx-auto mb-4"></div>
        <p className="text-gray-600">
          Creating your visa application..
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
