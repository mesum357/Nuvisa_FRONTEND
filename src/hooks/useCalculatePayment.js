import { getVisaApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useEffect, useState } from "react";

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

const EMPTY_PAYMENT_DATA = {
  fullRemainingPayment: 0,
  totalInsuranceCost: 0,
  noOfTravelersNeedingInsurance: 0,
  noOfTravelersNeedingFullPayment: 0,
  allPaymentCompleted: false,
  travelData: [],
  totalFullPayment: 0,
  totalInsurancePayment: 0,
  noOfInsuranceUploaded: 0,
};

function normalizeTravelersData(travelersData) {
  if (!travelersData) return null;
  if (Array.isArray(travelersData)) return travelersData;
  if (typeof travelersData === "string") {
    try {
      const parsed = JSON.parse(travelersData);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeApplication(application) {
  if (!application) return null;
  const travelersData = normalizeTravelersData(application.travelersData);
  if (!travelersData?.length) return null;
  return { ...application, travelersData };
}

function calculatePaymentsFromApplication(application) {
  const remainingNoOfTravelers =
    Number(application.numberOfTravellers || 0) -
    Number(application.initiallyPaidTraveler || 0);

  let calculatedFullPayment = 0;
  let calculatedInsuranceCost = 0;
  let totalFullPayment = 0;
  let totalInsurancePayment = 0;
  let allPaymentsCompleted = false;
  let noOfInsuranceUploaded = 0;
  let noOfTravelersNeedingInsurance = application.travelersData.filter(
    (t) =>
      !t.insurance?.insurancePaymentCompleted && !t.insurance?.paidInCheckout
  ).length;

  const paidTravelerCount = Math.max(
    Number(application.initiallyPaidTraveler) || 1,
    1
  );

  application.travelersData.forEach((traveler) => {
    const travelDays = calculateTravelDays(
      traveler.basicDetails?.travelStartDate,
      traveler.basicDetails?.travelEndDate
    );
    const { fullPayment = {} } = traveler;
    const { insurance = {} } = traveler;
    if (!fullPayment.paidInCheckout) {
      totalFullPayment += Number(application.paymentWithoutInsurance) || 0;
    }
    if (!insurance.paidInCheckout) {
      totalInsurancePayment += Number(travelDays * 2) || 0;
    }
    if (
      fullPayment.paymentCompleted &&
      insurance.insurancePaymentCompleted
    ) {
      allPaymentsCompleted = true;
    }
    if (
      !fullPayment.paymentCompleted &&
      !fullPayment.paymentWithoutInsurance
    ) {
      calculatedFullPayment +=
        Number(application.paymentWithoutInsurance || 0) / paidTravelerCount;
    }

    if (traveler.documents?.documents?.insuranceDocument?.[0]?.name) {
      noOfInsuranceUploaded += 1;
    }

    if (
      !insurance.insurancePaymentCompleted &&
      !traveler.documents?.documents?.insuranceDocument?.[0]?.name
    ) {
      calculatedInsuranceCost += travelDays * 2;
    } else {
      noOfTravelersNeedingInsurance -= 1;
    }
  });

  allPaymentsCompleted = application.travelersData.every(
    (t) => t.fullPayment?.paymentCompleted
  );

  return {
    fullRemainingPayment: calculatedFullPayment,
    totalInsuranceCost: 0,
    noOfTravelersNeedingInsurance: Math.max(noOfTravelersNeedingInsurance, 0),
    noOfTravelersNeedingFullPayment: application.travelersData.filter(
      (t) =>
        !t.fullPayment?.paymentCompleted &&
        !t.fullPayment?.paymentWithoutInsurance
    ).length,
    travelData: application.travelersData,
    allPaymentCompleted: allPaymentsCompleted,
    totalFullPayment: Math.max(remainingNoOfTravelers, 0) * 149,
    totalInsurancePayment,
    noOfInsuranceUploaded,
  };
}

export const useCalculatePayment = (applicationId, parentApplication = null) => {
  const [paymentData, setPaymentData] = useState(EMPTY_PAYMENT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!applicationId) {
      setPaymentData(EMPTY_PAYMENT_DATA);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fromParent = normalizeApplication(parentApplication);
        if (fromParent) {
          if (!cancelled) {
            setPaymentData(calculatePaymentsFromApplication(fromParent));
          }
          setIsLoading(false);
          return;
        }

        const token = localStorageGateway("token", localStorageEnums.GET);
        const response = await getVisaApplication(token, { id: applicationId });
        const httpOk =
          response?.status >= 200 && response?.status < 300;
        const apiStatus = response?.data?.status;

        if (!httpOk || apiStatus === "error") {
          if (!cancelled) {
            setError("Could not load application for payment calculation.");
            setPaymentData(EMPTY_PAYMENT_DATA);
          }
          return;
        }

        const application = normalizeApplication(
          response?.data?.data?.results?.application
        );

        if (!application) {
          if (!cancelled) {
            setError(
              "Application data is not ready yet. Complete traveller details or refresh the page."
            );
            setPaymentData(EMPTY_PAYMENT_DATA);
          }
          return;
        }

        if (!cancelled) {
          setPaymentData(calculatePaymentsFromApplication(application));
        }
      } catch (err) {
        console.error("Failed to calculate payment:", err);
        if (!cancelled) {
          setError(err.message || "An unexpected error occurred.");
          setPaymentData(EMPTY_PAYMENT_DATA);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [applicationId, parentApplication]);

  return { paymentData, isLoading, error };
};
