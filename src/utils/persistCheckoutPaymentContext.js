import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { readExpertCoachSelectedFromStorage } from "@/utils/expertCoachSelection";

/**
 * Persist checkout context before leaving the site (Klarna redirect).
 * Mirrors ExpressPaymentRequestButton localStorage setup so payment-success can create the application.
 */
export async function persistCheckoutPaymentContext({
  email,
  amount,
  travellers,
  country,
  insurance,
  paymentType = "application_creation",
  applicationId,
  paymentIntentId,
  insuranceCount = 0,
  insurancePaymentAmount = 0,
  paymentWithoutInsurance,
  paymentWithDiscount,
}) {
  const normalizedTravellers =
    travellers === undefined || travellers === null ? "" : String(travellers);
  const normalizedAmount = String(amount ?? "0");
  const hasInsurance =
    insurance === true || insurance === "true" || Number(insurancePaymentAmount) > 0;

  await localStorageGateway("paymentAmount", localStorageEnums.SET, normalizedAmount);
  await localStorageGateway("userEmail", localStorageEnums.SET, String(email || ""));
  await localStorageGateway("travelers", localStorageEnums.SET, normalizedTravellers);
  await localStorageGateway(
    "insuranceSelected",
    localStorageEnums.SET,
    hasInsurance ? "true" : "false"
  );
  await localStorageGateway(
    "insurancePayment",
    localStorageEnums.SET,
    String(insurancePaymentAmount || 0)
  );

  if (paymentWithoutInsurance !== undefined) {
    await localStorageGateway(
      "paymentWithoutInsurance",
      localStorageEnums.SET,
      String(paymentWithoutInsurance)
    );
  }

  if (paymentWithDiscount !== undefined) {
    await localStorageGateway(
      "paymentWithDiscount",
      localStorageEnums.SET,
      String(paymentWithDiscount)
    );
  }

  const paymentMetadata = {
    paymentIntentId: paymentIntentId || undefined,
    email: String(email || ""),
    amount: normalizedAmount,
    travellers: normalizedTravellers,
    country: String(country || ""),
    insurance: hasInsurance ? "true" : "false",
    paymentType,
    applicationId: applicationId || undefined,
    expertCoachSelected: readExpertCoachSelectedFromStorage() ? "true" : "false",
    timestamp: Date.now(),
    paymentDate: new Date().toISOString(),
    paymentMethod: "klarna",
  };

  await localStorageGateway(
    "paymentMetadata",
    localStorageEnums.SET,
    JSON.stringify(paymentMetadata)
  );

  console.log("[persistCheckoutPaymentContext] saved for Klarna redirect:", {
    paymentType,
    amount: normalizedAmount,
    travellers: normalizedTravellers,
    hasPaymentIntentId: Boolean(paymentIntentId),
  });
}
