"use client";
import { updateVisaApplication } from "@/api/visaApplications";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import usePaymentData from "@/hooks/usePaymentData";
import { useAppSelector } from "@/store";
import { useRouter } from "next/router";
import { useEffect } from "react";

const ApplicationStepPaymentSuccessPage = () => {
  const { getCurrentPaymentData } = usePaymentData();
  const router = useRouter();
  const visaState = useAppSelector((state) => state.visa);

  const applicationId = router.query.application_id;
  const insurancePaymentMetadata = localStorageGateway(
    "insurancePaymentMetadata",
    localStorageEnums.GET
  );

  const token = localStorageGateway("token", localStorageEnums.GET);
  const insuranceMetadata = insurancePaymentMetadata
    ? JSON.parse(insurancePaymentMetadata)
    : null;
  useEffect(() => {
    const processPaymentSuccess = async () => {
      const currentData = await getCurrentPaymentData();
      const finalApplicationId = applicationId || currentData.applicationId;

      const updatePayload = {
        id: finalApplicationId,
        travelersData: insuranceMetadata?.travelData,
      };

      if (finalApplicationId) {
        await updateVisaApplication(token, updatePayload);

        setTimeout(() => {
          router.replace(
            `/application-step/?application_id=${finalApplicationId}&step=payment`
          );
        }, 2000);
      }
    };
    if (applicationId) {
      processPaymentSuccess();
    }
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7350FF] mx-auto mb-4"></div>
        <p className="text-gray-600">
          Processing insurance payment and redirecting back to your
          application...
        </p>
      </div>
    </div>
  );
};

export default ApplicationStepPaymentSuccessPage;
