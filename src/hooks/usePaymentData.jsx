import { useState, useEffect } from "react";
import { useAppSelector } from "@/store";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";

const usePaymentData = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [lastPayment, setLastPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get Redux state
  const visaState = useAppSelector((state) => state.visa);

  // Get the last payment data
  const getLastPaymentData = async () => {
    try {
      const lastPaymentString = await localStorageGateway(
        "lastPaymentData",
        localStorageEnums.GET
      );
      if (lastPaymentString) {
        const paymentData = JSON.parse(lastPaymentString);
        setLastPayment(paymentData);
        return paymentData;
      }
      return null;
    } catch (error) {
      console.error("Error getting last payment data:", error);
      return null;
    }
  };

  // Get all payment history
  const getPaymentHistory = async () => {
    try {
      const historyString = await localStorageGateway(
        "paymentHistory",
        localStorageEnums.GET
      );
      if (historyString) {
        const history = JSON.parse(historyString);
        setPaymentHistory(history);
        return history;
      }
      return [];
    } catch (error) {
      console.error("Error getting payment history:", error);
      return [];
    }
  };

  // Add a payment to history
  const addPaymentToHistory = async (paymentData) => {
    try {
      const currentHistory = await getPaymentHistory();
      const updatedHistory = [paymentData, ...currentHistory.slice(0, 9)]; // Keep last 10 payments
      await localStorageGateway(
        "paymentHistory",
        localStorageEnums.SET,
        JSON.stringify(updatedHistory)
      );
      setPaymentHistory(updatedHistory);
      return updatedHistory;
    } catch (error) {
      console.error("Error adding payment to history:", error);
      return [];
    }
  };

  // Get current payment session data
  const getCurrentPaymentData = async () => {
    try {
      const email = await localStorageGateway(
        "userEmail",
        localStorageEnums.GET
      );
      const country = await localStorageGateway(
        "persist:visa.selectedCountry",
        localStorageEnums.GET
      );
      const insurance = await localStorageGateway(
        "insurancePayment",
        localStorageEnums.GET
      );
      const insuranceSelected = await localStorageGateway(
        "insuranceSelected",
        localStorageEnums.GET
      );
      const travelers = await localStorageGateway(
        "persist:visa.travelers",
        localStorageEnums.GET
      );
      const amount = await localStorageGateway(
        "paymentAmount",
        localStorageEnums.GET
      );
      const paymentWithoutInsurance = await localStorageGateway(
        "paymentWithoutInsurance",
        localStorageEnums.GET
      );
      const storedMetadata = 
        await localStorageGateway(
          "insurancePaymentMetadata",
          localStorageEnums.GET
        )

      return {
        email,
        selectedCountry: country || visaState.selectedCountry,
        insurancePayment: insurance,
        insuranceSelected: insuranceSelected,
        travelers: travelers || visaState.travelers,
        totalAmount: amount,
        arrivalDate: visaState.arrivalDate,
        departureDate: visaState.departureDate,
        selectedVisaType: visaState.selectedVisaType,
        visaTypeId: visaState.visaTypeId,
        paymentWithoutInsurance,
        storedMetadata: JSON.parse(storedMetadata) || null,
      };
    } catch (error) {
      console.error("Error getting current payment data:", error);
      return {};
    }
  };

  // Get order data for SMV API
  const getOrderData = () => {
    return {
      visa_type_id: visaState.visaTypeId || visaState.selectedVisaType?.id,
      travel_start_date: visaState.arrivalDate
        ? new Date(visaState.arrivalDate)
            .toLocaleDateString("en-GB")
            .replace(/\//g, "/")
        : undefined,
      travel_end_date: visaState.departureDate
        ? new Date(visaState.departureDate)
            .toLocaleDateString("en-GB")
            .replace(/\//g, "/")
        : undefined,
      no_of_travelers: parseInt(visaState.travelers) || 1,
    };
  };

  // Clear payment data
  const clearPaymentData = async () => {
    try {
      await localStorageGateway("lastPaymentData", localStorageEnums.REMOVE);
      await localStorageGateway("selectedCountry", localStorageEnums.REMOVE);
      await localStorageGateway("insurancePayment", localStorageEnums.REMOVE);
      await localStorageGateway("insuranceSelected", localStorageEnums.REMOVE);
      await localStorageGateway("travelers", localStorageEnums.REMOVE);
      await localStorageGateway("paymentAmount", localStorageEnums.REMOVE);
      setLastPayment(null);
    } catch (error) {
      console.error("Error clearing payment data:", error);
    }
  };

  useEffect(() => {
    const loadPaymentData = async () => {
      setIsLoading(true);
      await getLastPaymentData();
      await getPaymentHistory();
      setIsLoading(false);
    };

    loadPaymentData();
  }, []);

  return {
    paymentHistory,
    lastPayment,
    isLoading,
    getLastPaymentData,
    getPaymentHistory,
    addPaymentToHistory,
    getCurrentPaymentData,
    getOrderData,
    clearPaymentData,
    // Direct access to visa state
    visaState,
  };
};

export default usePaymentData;
