import { getVisaApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useEffect } from "react";
import { useState } from "react";

export const calculateTravelDays = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 1;
    }
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  }
  return 1;
};

export const useCalculatePayment = (applicationId) => {
  const [paymentData, setPaymentData] = useState({
    fullRemainingPayment: 0,
    totalInsuranceCost: 0,
    noOfTravelersNeedingInsurance: 0,
    noOfTravelersNeedingFullPayment: 0,
    allPaymentCompleted: false,
    travelData: [],
    totalFullPayment: 0,
    totalInsurancePayment: 0,
    noOfInsuranceUploaded: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!applicationId) {
      setIsLoading(false);
      return;
    }

    const fetchAndCalculatePayments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorageGateway("token", localStorageEnums.GET);
        const response = await getVisaApplication(token, { id: applicationId });
        const application = response?.data?.data?.results?.application;

        if (!application || !application.travelersData) {
          throw new Error("Application data not found.");
        }
        const remainingNoOfTravelers = application.numberOfTravellers - application.initiallyPaidTraveler

        let calculatedFullPayment = 0;
        let calculatedInsuranceCost = 0;
        let totalFullPayment = 0;
        let totalInsurancePayment = 0;
        let allPaymentsCompleted = false;
        let noOfInsuranceUploaded = 0;
        let noOfTravelersNeedingInsurance = application.travelersData.filter(
          (t) =>
            !t.insurance?.insurancePaymentCompleted &&
            !t.insurance?.paidInCheckout
        ).length

        application.travelersData.forEach((traveler) => {
          const travelDays = calculateTravelDays(
            traveler.basicDetails.travelStartDate,
            traveler.basicDetails.travelEndDate
          );
          const { fullPayment = {} } = traveler;
          const { insurance = {} } = traveler;
          if (!fullPayment.paidInCheckout) {
            totalFullPayment += Number(application.paymentWithoutInsurance) || 0;
          }
          if (!insurance.paidInCheckout) {
            totalInsurancePayment += Number(
              travelDays * 2
            ) || 0;
          }
          if (
            fullPayment.paymentCompleted &&
            insurance.insurancePaymentCompleted
          ) {
            allPaymentsCompleted = true;
          }
          if (!fullPayment.paymentCompleted && !fullPayment.paymentWithoutInsurance) {
            calculatedFullPayment += Number(application.paymentWithoutInsurance) / application.initiallyPaidTraveler;
          }

          if (traveler.documents.documents.insuranceDocument?.[0]?.name) {
            noOfInsuranceUploaded += 1;
          }

          if (
            !insurance.insurancePaymentCompleted &&
            !traveler.documents.documents.insuranceDocument?.[0]?.name
          ) {
            calculatedInsuranceCost += (travelDays * 2)
          } else {
            noOfTravelersNeedingInsurance -= 1;
          }
        });

        allPaymentsCompleted =
          application.travelersData.every((t) =>
            t.fullPayment?.paymentCompleted
          );
        setPaymentData({
          fullRemainingPayment: calculatedFullPayment,
          totalInsuranceCost: 0,
          noOfTravelersNeedingInsurance: 0,
          noOfTravelersNeedingFullPayment: application.travelersData.filter(
            (t) =>
              !t.fullPayment?.paymentCompleted && !t.fullPayment?.paymentWithoutInsurance
          ).length,
          travelData: application.travelersData,
          allPaymentCompleted: allPaymentsCompleted,
          totalFullPayment: remainingNoOfTravelers * 159,
          totalInsurancePayment,
          noOfInsuranceUploaded
        });

        console.log(paymentData, "paymentData");
      } catch (err) {
        console.error("Failed to calculate payment:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCalculatePayments();
  }, [applicationId]);

  return { paymentData, isLoading, error };
};
