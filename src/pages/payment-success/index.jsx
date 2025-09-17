"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import usePaymentData from "@/hooks/usePaymentData";
import { createApplication } from "@/api/visa";

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const { getCurrentPaymentData, addPaymentToHistory } = usePaymentData();
  const [paymentData, setPaymentData] = useState(null);
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
        setPaymentData(currentData); // Store payment data for display

        console.log("=== PAYMENT SUCCESS DEBUG ===");
        console.log("Current payment data:", currentData);

        // Get session ID from Stripe if available
        const sessionId = searchParams.get("session_id");

        // Check if this is a traveler insurance payment (both regular and additional)
        // Prioritize URL parameters over localStorage data for insurance payments
        let paymentTypeParam = searchParams.get("payment_type");
        let applicationId = searchParams.get("application_id");
        let travelerIndex = searchParams.get("traveler_index");

        // If URL parameters are missing, check for stored insurance payment metadata
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
                console.log(
                  "Using stored insurance payment metadata:",
                  metadata
                );

                // Clean up the stored metadata after use
                localStorage.removeItem("insurancePaymentMetadata");
              }
            }
          } catch (error) {
            console.error("Error retrieving stored insurance metadata:", error);
          }
        }

        console.log("URL Parameters:");
        console.log("- session_id:", sessionId);
        console.log("- payment_type:", paymentTypeParam);
        console.log("- application_id:", applicationId);
        console.log("- traveler_index:", travelerIndex);

        // If URL parameters indicate insurance payment, use those values
        // Otherwise fallback to localStorage data for application creation
        const finalPaymentType =
          paymentTypeParam || currentData.paymentType || "application_creation";
        const finalApplicationId = applicationId || currentData.applicationId;

        console.log("Final values:");
        console.log("- finalPaymentType:", finalPaymentType);
        console.log("- finalApplicationId:", finalApplicationId);
        console.log("- travelerIndex:", travelerIndex);

        setPaymentType(finalPaymentType);

        if (
          (finalPaymentType === "additional_traveler_insurance" ||
            finalPaymentType === "traveler_insurance") &&
          finalApplicationId
        ) {
          console.log(
            `✅ INSURANCE PAYMENT DETECTED - Processing ${finalPaymentType} payment success for traveler ${travelerIndex}`
          );
          console.log(
            "Manually updating traveler insurance status (webhook workaround for localhost)"
          );

          try {
            // Manually call the insurance update API since webhooks don't work in localhost
            const insuranceUpdateResponse = await fetch(
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
                  amount: currentData.totalAmount || "490",
                }),
              }
            );

            const insuranceResult = await insuranceUpdateResponse.json();
            console.log("Insurance update result:", insuranceResult);

            if (insuranceResult.status === "success") {
              console.log("✅ Traveler insurance updated successfully");
            } else {
              console.error(
                "❌ Failed to update traveler insurance:",
                insuranceResult
              );
            }
          } catch (error) {
            console.error("Error updating traveler insurance:", error);
          }

          // Redirect back to application step after updating insurance
          setTimeout(() => {
            router.replace(
              `/application-step/?application_id=${finalApplicationId}`
            );
          }, 2000);
          return;
        }

        console.log(
          "❌ NOT AN INSURANCE PAYMENT - Proceeding with application creation flow"
        );
        console.log("=== END PAYMENT SUCCESS DEBUG ===");

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
        if (currentData.insurancePayment) {
          dispatch(setInsuranceFees(Number(currentData.insurancePayment) || 0));
        }
        if (currentData.travelers) {
          dispatch(setTravelers(Number(currentData.travelers) || 1));
        }

        // Create visa application
        setIsCreatingApplication(true);

        console.log("=== VISA TYPE DEBUG ===");
        console.log(
          "Selected visa type from Redux:",
          visaState.selectedVisaType
        );
        console.log("Visa type ID from Redux:", visaState.visaTypeId);

        // Check localStorage for visa type data as fallback
        let visaTypeFromStorage = null;
        let visaTypeIdFromStorage = null;
        try {
          const storedVisaType = localStorage.getItem("selectedVisaType");
          const storedVisaTypeId = localStorage.getItem("visaTypeId");
          if (storedVisaType) {
            visaTypeFromStorage = JSON.parse(storedVisaType);
          }
          if (storedVisaTypeId) {
            visaTypeIdFromStorage = storedVisaTypeId;
          }
          console.log("Visa type from localStorage:", visaTypeFromStorage);
          console.log("Visa type ID from localStorage:", visaTypeIdFromStorage);
        } catch (error) {
          console.error("Error parsing visa type from localStorage:", error);
        }
        console.log("=== END VISA TYPE DEBUG ===");

        // Initialize travelers data with insurance set for each initial traveler
        const numberOfTravelers = Number(currentData.travelers) || 1;
        const hasInsurance = currentData.insurancePayment ? "true" : "false";

        const initialTravelersData = Array.from(
          { length: numberOfTravelers },
          (_, index) => ({
            id: index + 1,
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
            insurance: {
              insurance: hasInsurance, // Set insurance for each initial traveler based on payment
              insuranceDetails:
                hasInsurance === "true" ? { selected: true } : null,
              insuranceCertificate: null, // Initialize certificate field
            },
          })
        );

        const applicationPayload = {
          type: "createApplication",
          email: currentData.email,
          insurance: hasInsurance, // Keep for backward compatibility during transition
          country: currentData.selectedCountry,
          amountPaid: currentData.totalAmount?.toString(),
          numberOfTravellers: numberOfTravelers,
          travelersData: initialTravelersData, // Pass initialized travelers data
          visaTypeId: visaState.visaTypeId || visaTypeIdFromStorage || "", // Add visa type ID from Redux or localStorage
          selectedVisaType:
            visaState.selectedVisaType || visaTypeFromStorage || null, // Add selected visa type from Redux or localStorage
          // Add arrival and departure dates from Redux store for SMV order creation
          arrivalDate: visaState.arrivalDate,
          departureDate: visaState.departureDate,
        };

        console.log("=== APPLICATION PAYLOAD DEBUG ===");
        console.log("Final payload being sent to backend:", {
          ...applicationPayload,
          travelersData: `[${applicationPayload.travelersData.length} travelers]`, // Shorten for readability
        });
        console.log("SMV order creation data:", {
          visaTypeId: applicationPayload.visaTypeId,
          arrivalDate: applicationPayload.arrivalDate,
          departureDate: applicationPayload.departureDate,
          numberOfTravellers: applicationPayload.numberOfTravellers,
        });
        console.log("=== END APPLICATION PAYLOAD DEBUG ===");

        const applicationResponse = await createApplication(applicationPayload);
        // console.log("Application creation response:", applicationResponse);
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7350FF] mx-auto mb-4"></div>
        <p className="text-gray-600">
          {paymentType === "additional_traveler_insurance" ||
          paymentType === "traveler_insurance"
            ? "Processing insurance payment and redirecting back to your application..."
            : isCreatingApplication
            ? "Creating your visa application..."
            : "Processing payment and redirecting to dashboard..."}
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
