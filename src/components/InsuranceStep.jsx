import { Upload, Check, Eye, Download, Trash2, Loader } from "lucide-react";
import { uploadFile, deleteFile } from "@/api/upload";
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";
import { calculateDays } from "@/utils/calculateDays";
import { useEffect, useRef } from "react";
import { useState } from "react";
import {
  getVisaApplication,
  updateVisaApplication,
} from "@/api/visaApplications";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { useRouter } from "next/router";

export const InsuranceStep = ({
  travelerIndex,
  updateCurrentTravelerData,
  onComplete,
  loading,
  parentVisaApplication,
  showError,
  validateInsurance,
  applicationData,
  travelerData,
  disabled = false,
  isOwner = true,
  setParentVisaApplication
}) => {
  const fileInputRef = useRef(null);
  const [uploadedCertificates, setUploadedCertificates] = useState(() => {
    const certificates = travelerData?.insurance?.insuranceDetails;
    if (!certificates) return {};
    return certificates;
  });
  const router = useRouter();
  const [insuranceError, setInsuranceError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [selectedInsuranceType, setSelectedInsuranceType] = useState();
  const [fileUrl, setFileUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(new Set());
  const [saveData, setSaveData] = useState({});

  const token = localStorageGateway("token", localStorageEnums.GET);
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();

  const travelDay = calculateDays(
    applicationData?.travelStartDate,
    applicationData?.travelEndDate
  );
  const insuranceAmount = travelDay * 2 || 0;

  const calculateInsuranceDays = () => {
    return calculateDays(
      applicationData?.travelStartDate,
      applicationData?.travelEndDate
    );
  };

  const isInsurancePaymentCompleted = () => {
    const travelerInsurance = travelerData?.insurance;
    const appInsurance =
      applicationData?.insurance || applicationData?.insuranceDetails;

    return travelerInsurance?.insurancePaymentCompleted;
  };

  const isCertificateUploaded = () => {
    return (
      uploadedCertificates?.certificateUploaded || uploadedCertificates?.file ||
      applicationData?.travelersData?.[travelerIndex]?.insurance
        ?.insuranceCertificates
    );
  };

  useEffect(() => {
    if (uploadedCertificates?.certificateUploaded || uploadedCertificates?.file) {
      const certificate = uploadedCertificates;
      const certificateUrl = certificate?.file?.data || certificate?.file?.preview;
      setSaveData((prev) => ({
        ...prev,
        certificate: certificateUrl,
        insuranceType: selectedInsuranceType,
      }));

      if (certificateUrl && !fileUrl) {
        setFileUrl(certificateUrl);
      }
    }
  }, [uploadedCertificates, selectedInsuranceType, fileUrl]);

  useEffect(() => {
    const hasCertificate =
      uploadedCertificates?.certificateUploaded || uploadedCertificates?.file ||
      applicationData?.travelersData?.[travelerIndex]?.insurance
        ?.insuranceCertificates
    const hasPayment = isInsurancePaymentCompleted();

    if (hasCertificate && !hasPayment && selectedInsuranceType !== "own") {
      setSelectedInsuranceType("own");
    } else if (
      hasPayment &&
      !hasCertificate &&
      selectedInsuranceType !== "purchase"
    ) {
      setSelectedInsuranceType("purchase");
    }
  }, []);

  const handleCertificateUpload = async (event) => {
    if (disabled || !isOwner) return;

    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setInsuranceError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      const uploadResult = await uploadFile(file);

      const documentData = {
        name: file.name,
        data: uploadResult?.url,
        preview: uploadResult?.url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedCertificates({
        certificateUploaded: true,
        file: documentData,
      });

      setFileUrl(documentData.data || documentData.preview);




      await updateVisaApplication(token, {
        travelersData: applicationData?.travelersData.map((traveler, idx) => {
          if (travelerData.id === traveler?.id) {
            return {
              ...traveler,
              insurance: {
                ...traveler.insurance,
                insuranceCertificates: documentData.data || documentData.preview,
                insuranceDetails: {
                  file: documentData,
                  certificateUploaded: true,
                },
              },
            };
          }
          return traveler;
        }),
        id: applicationData?.id,
      });
      const response = await getVisaApplication(
        token,
        {
          id: applicationData?.id
        }
      )

      if (response?.status === 200) {
        setParentVisaApplication(response?.data?.data?.results?.application)
      }


      await updateCurrentTravelerData(
        "insurance",
        {
          insuranceCertificates: documentData.data || documentData.preview,
          insuranceDetails: {
            certificateUploaded: true,
            file: documentData,
          },
        }
      );

      setSaveData((prevSave) => ({
        ...prevSave,
        certificate: documentData.data || documentData.preview,
        file: documentData,
      }));

    } catch (error) {
      console.error("File upload error:", error);
      const errorMessage = "Failed to upload file. Please try again.";
      setInsuranceError(errorMessage);
      if (showError) {
        showError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = (certificate) => {
    if (certificate && (certificate.data || certificate.preview)) {
      window.open(certificate.data || certificate.preview, "_blank");
    }
  };

  const handleDownloadDocument = async (certificate) => {
    if (!certificate || (!certificate.data && !certificate.preview)) {
      console.error("Invalid certificate object provided.");
      return;
    }

    try {
      const url = certificate.data || certificate.preview;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = certificate.name || "insurance-certificate";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Could not download the file:", error);
      window.open(certificate.data || certificate.preview, "_blank");
    }
  };

  const handleRemoveDocument = async () => {
    if (disabled || !isOwner || !uploadedCertificates?.certificateUploaded) return; // Prevent document removal when disabled or not owner

    const certificateToDelete = uploadedCertificates?.file;
    const deletionId = `certificate-0`;

    setUploadedCertificates();
    setFileUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await deleteFile(
      certificateToDelete.data || certificateToDelete.preview
    );

    if (certificateToDelete?.data || certificateToDelete?.preview) {
      setDeletingFiles((prev) => new Set(prev).add(deletionId));

      try {

        updateCurrentTravelerData("insurance", {
          insuranceCertificates: null,
          insuranceDetails: {
            certificateUploaded: false,
            file: null,
          },
        });

        await updateVisaApplication(token, {
          travelersData: applicationData?.travelersData.map((traveler, idx) => {
            if (travelerData.id === traveler?.id) {
              return {
                ...traveler,
                insurance: {
                  insuranceCertificates: null,
                  insuranceDetails: {
                    file: null,
                  },
                },
              };
            }
            return traveler;
          }),
          id: applicationData?.id,
        });

        const response = await getVisaApplication(
          token,
          {
            id: applicationData?.id
          }
        );

        if (response?.status === 200) {
          setParentVisaApplication(response?.data?.data?.results?.application)
        }

        await updateCurrentTravelerData(
          "insurance",
          {
            insuranceCertificates: null,
            insuranceDetails: {
              certificateUploaded: false,
              file: null,
            },
          }
        );
      } catch (error) {
        console.error(
          `Failed to delete file from server: ${certificateToDelete.name}`,
          error
        );

        if (showError) {
          showError(
            `Warning: File removed from form but server cleanup failed for ${certificateToDelete.name}`
          );
        }
      } finally {
        setDeletingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(deletionId);
          return newSet;
        });
      }
    }
  };
  // const handleSave = async () => {
  //   try {
  //     const certificate = uploadedCertificates.length > 0 ? uploadedCertificates[0] : null;
  //     const certificateUrl = certificate ? (certificate.data || certificate.preview) : null;

  //     await updateVisaApplication(
  //       token,
  //       {
  //         travelersData: applicationData?.travelersData.map((traveler, idx) => {
  //           if (idx === travelerIndex) {
  //             return {
  //               ...traveler,
  //               insurance: {
  //                 insuranceCertificate: certificateUrl,
  //                 insuranceDetails: {
  //                   file: saveData?.file,
  //                 }
  //               }
  //             }
  //           }
  //           return traveler;
  //         }),
  //         id: applicationData?.id,
  //       }
  //     );

  //     await getVisaApplication(token, {
  //       id: applicationData?.id
  //     });

  //     if (onComplete) {
  //       onComplete({
  //         insuranceType: selectedInsuranceType,
  //         certificate: certificateUrl,
  //         insurancePaymentCompleted: isInsurancePaymentCompleted(),
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error saving insurance data:", error);
  //     if (showError) {
  //       showError("Failed to save insurance data. Please try again.");
  //     }
  //   }
  // };

  const handleInsurancePay = async () => {
    setIsPaying(true);
    setPaymentError("");

    try {
      const days = calculateInsuranceDays();
      const perDayGBP = 2;
      const baseAmountGBP = days * perDayGBP;
      const totalWithFee = Math.round(baseAmountGBP * 100) / 100;

      const userEmail = parentVisaApplication?.email;

      await handleCreateDynamicCheckoutSession({
        email: userEmail,
        amountGBP: totalWithFee.toString(),
        travellers: "1",
        country: parentVisaApplication?.country || "United Kingdom",
        insurance: "purchase",
        applicationId: parentVisaApplication?.id || "",
        travelerIndex: travelerIndex.toString(),
        paymentType: "traveler_insurance",
        visaTypeId: parentVisaApplication?.visaTypeId || "",
        currency: "GBP",
        insurancePaymentAmount: totalWithFee,
        amount: totalWithFee,
        travelData: applicationData?.travelersData?.map((item, index) => {
          if (item.id === travelerData.id) {
            return {
              ...item,
              insurance: {
                insurancePaymentCompleted: true,
                paymentAmount: totalWithFee,
                insuranceDay: calculateDays(
                  applicationData?.travelStartDate,
                  applicationData?.travelEndDate
                )
              },
            };
          }
          return item;
        }),
      });
    } catch (err) {
      console.error("Insurance payment error:", err);
      setPaymentError(
        err.response?.data?.message ||
        err.message ||
        "Failed to process payment. Please try again."
      );
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-gilroy-bold text-lg">
            Travel Insurance
          </h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">
          Travel insurance is required for your visa application. Choose one of
          the options below:
        </p>

        <div className="space-y-3">
          <label
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${selectedInsuranceType === "own"
              ? "border-green-500 bg-green-500/10"
              : "border-gray-600"
              } ${disabled || !isOwner
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-purple-500"
              }`}
          >
            <input
              type="radio"
              name="insuranceType"
              value="own"
              checked={selectedInsuranceType === "own"}
              onChange={(e) => {
                if (!disabled && isOwner) {
                  setSelectedInsuranceType("own");
                }
              }}
              disabled={disabled || !isOwner}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 disabled:opacity-60"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">
                  I have my own insurance
                </span>
                {selectedInsuranceType === "own" && isCertificateUploaded() && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <Check className="w-3 h-3" />
                    <span>Uploaded</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400">
                Upload your existing travel insurance certificate
              </div>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${selectedInsuranceType === "purchase"
              ? "border-green-500 bg-green-500/10"
              : "border-gray-600"
              } ${disabled || !isOwner
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:border-purple-500"
              }`}
          >
            <input
              type="radio"
              name="insuranceType"
              value="purchase"
              checked={selectedInsuranceType === "purchase"}
              onChange={(e) => {
                if (!disabled && isOwner) {
                  setSelectedInsuranceType("purchase");
                }
              }}
              disabled={disabled || !isOwner}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 disabled:opacity-60"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">
                  Purchase insurance through us
                </span>
                {selectedInsuranceType === "purchase" &&
                  isInsurancePaymentCompleted() && (
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <Check className="w-3 h-3" />
                      <span>Paid</span>
                    </div>
                  )}
              </div>
              <div className="text-sm text-gray-400">
                £2 per day • Instant coverage
              </div>
            </div>
          </label>
        </div>
      </div>

      {selectedInsuranceType === "own" && (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded flex items-center justify-center text-center ${uploadedCertificates?.certificateUploaded || uploadedCertificates?.file
                  ? "bg-green-600"
                  : "bg-purple-600"
                  }`}
              >
                {uploadedCertificates?.certificateUploaded || uploadedCertificates?.file ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Upload className="w-5 h-5 text-white" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">
                Upload Insurance Certificate
              </h3>
              {uploadedCertificates?.certificateUploaded || uploadedCertificates?.file ? (
                <span className="text-green-400 text-sm font-medium bg-green-400/10 px-2 py-1 rounded">
                  ✓ Uploaded
                </span>
              ) : (
                <span className="text-orange-400 text-sm font-medium bg-orange-400/10 px-2 py-1 rounded">
                  Required
                </span>
              )}
            </div>
          </div>

          {/* Insurance Certificate Upload */}
          <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!!uploadedCertificates?.certificateUploaded || uploadedCertificates?.file
                        ? "bg-green-600"
                        : "bg-gray-400 dark:bg-gray-600"
                        }`}
                    >
                      {!!uploadedCertificates?.certificateUploaded || uploadedCertificates?.file ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white dark:bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                        Insurance Certificate
                        {!uploadedCertificates?.certificateUploaded || uploadedCertificates?.file && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Required
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Upload your existing insurance certificate document
                        (PDF, JPG, PNG up to 10MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="self-start min-w-30">
                  {!uploadedCertificates?.certificateUploaded && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleCertificateUpload}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip,.env"
                        id="insurance-upload"
                        disabled={disabled || !isOwner || isUploading}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`${disabled || !isOwner || isUploading
                          ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white"
                          : "bg-purple-600 text-white cursor-pointer hover:bg-purple-700"
                          } font-semibold px-6 py-2.5 rounded-lg transition-colors min-w-32 flex items-center gap-2 text-center justify-center`}
                        disabled={disabled || !isOwner || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : !isOwner ? (
                          "View Only"
                        ) : (
                          "Upload"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!!uploadedCertificates?.certificateUploaded && (
              <div className="border-t border-gray-700 bg-green-900/10">
                <div className="p-4">
                  <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-green-600/30">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-100 font-medium">
                          {uploadedCertificates?.file?.name || "Document"}
                        </p>
                        <p className="text-xs text-green-400">
                          Certificate uploaded successfully
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleViewDocument(uploadedCertificates?.file)
                        }
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors"
                        title="View document"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadDocument(uploadedCertificates?.file)
                        }
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-colors"
                        title="Download document"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => !disabled && handleRemoveDocument()}
                          className={`p-2 transition-colors rounded-md ${disabled || deletingFiles.has(`certificate-0`)
                            ? "text-gray-500 cursor-not-allowed"
                            : "text-gray-400 hover:text-red-400 hover:bg-red-400/10 cursor-pointer"
                            }`}
                          title={
                            disabled
                              ? "Cannot remove document"
                              : deletingFiles.has(`certificate-0`)
                                ? "Deleting..."
                                : "Remove document"
                          }
                          disabled={
                            disabled || deletingFiles.has(`certificate-0`)
                          }
                        >
                          {deletingFiles.has(`certificate-0`) ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {insuranceError && (
            <p className="text-red-400 text-sm mt-2">{insuranceError}</p>
          )}
        </div>
      )}

      {/* Purchase Insurance Section */}
      {selectedInsuranceType === "purchase" && (
        <div>
          {!isInsurancePaymentCompleted() ? (
            <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
              <div className="text-sm text-gray-300 mb-4">
                Complete your insurance purchase to continue
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Travel days</span>
                  <span className="text-white font-medium">
                    {calculateDays(
                      applicationData?.travelStartDate,
                      applicationData?.travelEndDate
                    )}{" "}
                    days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Price per day</span>
                  <span className="text-white font-medium">£2.00</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">
                      Total amount
                    </span>
                    <span className="text-white font-semibold">
                      £{insuranceAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {paymentError && (
                <p className="text-red-400 text-sm mb-4">{paymentError}</p>
              )}

              <button
                onClick={handleInsurancePay}
                disabled={isPaying || cretingDynamicCheckout || disabled}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${isPaying || cretingDynamicCheckout || disabled
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white opacity-60"
                  : "bg-[#28A745] text-white hover:bg-[#218838]"
                  }`}
              >
                {(isPaying || cretingDynamicCheckout) && (
                  <Loader className="w-4 h-4 animate-spin" />
                )}
                {isPaying || cretingDynamicCheckout
                  ? "Redirecting to Payment..."
                  : `Pay Insurance (£${insuranceAmount.toFixed(2)})`}
              </button>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-white font-semibold">Payment Complete</h4>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Amount paid:</span>
                  <span className="text-white font-medium">
                    £
                    {(
                      applicationData?.travelersData?.[travelerIndex]?.insurance
                        ?.paymentAmount ||
                      applicationData?.insurance?.paymentAmount ||
                      insuranceAmount
                    ).toFixed
                      ? (
                        applicationData?.travelersData?.[travelerIndex]
                          ?.insurance?.paymentAmount ||
                        applicationData?.insurance?.paymentAmount ||
                        insuranceAmount
                      ).toFixed(2)
                      : insuranceAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Coverage period:</span>
                  <span className="text-white font-medium">
                    {applicationData?.travelersData?.[travelerIndex]
                      ?.insurance?.insuranceDay || calculateDays(
                        applicationData?.travelStartDate,
                        applicationData?.travelEndDate
                      )}{" "}
                    days
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
