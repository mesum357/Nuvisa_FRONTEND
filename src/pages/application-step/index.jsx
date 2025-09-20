"use client";
import {
  getVisaApplication,
  createOrUpdateApplication,
} from "@/api/visaApplications";
import ApplicationCompletedSection from "@/components/ApplicationCompletedSection";
import DocumentUploadSection from "@/components/DocumentUploadSection";
import { Header } from "@/components/layout/Header";
import PassportInformationSection from "@/components/PassportInformationSection";
import ProgressHeader from "@/components/ProgressHeader";
import VisitDetailSection from "@/components/VisitDetailSection";
import ClientOnly from "@/components/ClientOnly";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setInsuranceFees,
  setTravelers,
  setArrivalDate,
  setDepartureDate,
} from "@/store/visaSlice";
import { COUNTRY_CONFIG } from "@/constants/countryConfig";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import BookingAppointment from "@/components/BookingAppointment";
import {
  calculatePaymentFees,
  formatCurrency,
  validateCouponCode,
  applyCouponDiscount,
} from "@/utils/currency";
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";
import { useMemo } from "react";

const MultiStepAccordion = () => {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("application_id");
  const visaState = useAppSelector((state) => state.visa);
  const dispatch = useAppDispatch();
  const { showError } = useToast();

  // State for hydration-safe title
  const [isClient, setIsClient] = useState(false);
  const [parentVisaApplication, setParentVisaApplication] = useState(null);
  // Removed global stepInfo - now using only per-traveler step info
  const [travelersStepInfo, setTravelersStepInfo] = useState({}); // Per-traveler step info
  const [loading, setLoading] = useState(false);
  const [currentTravelerIndex, setCurrentTravelerIndex] = useState(0);
  const [numberOfTravelers, setNumberOfTravelers] = useState(1);

  // Initialize travelers data structure to match new DTO format
  const [travelersData, setTravelersData] = useState([
    {
      id: 1,
      // Appointment Details
      appointment: {
        preference1: {
          city: "",
          dateRangeStart: null,
          dateRangeEnd: null,
          slot: "",
        },
        preference2: {
          city: "",
          dateRangeStart: null,
          dateRangeEnd: null,
          slot: "",
        },
      },
      // Basic Details (Passport Information)
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
        mobileNumber: "",
        passportFront: null,
        passportBack: null,
        travelStartDate: "",
        travelEndDate: "",
      },
      // Visit Details
      visitDetails: {
        // Travel Information (always present in current form)
        visitingOtherSchengenCountries: [],
        firstCountryOfEntry: "",

        // Visa History (always present in current form)
        hasSchengenVisa: "",
        lastVisaStartDate: "",
        lastVisaEndDate: "",
        hasDigitalFingerprints: "",
        previousVisaNumber: "",

        // Personal Information (always present in current form)
        maritalStatus: "",
        partnerFullName: "",
        partnerDateOfBirth: "",

        // Employment Information (always present in current form)
        employmentStatus: "",
        institutionName: "",
        instituteEmail: "",
        instituteAddress: "",
        employerPhone: "",
        employerName: "",
        employerEmail: "",
        employerAddress: "",
        otherEmploymentStatus: "",

        // Payment Information (always present in current form)
        willAnyonePayForVisit: "",
        fundingPersonName: "",
        tripFundedBy: "",
      },
      // Documents
      documents: {
        documents: {},
      },
      // Insurance
      insurance: {
        insurance: "",
        insuranceDetails: null,
        insuranceCertificate: null,
      },
      // Payment
      payment: {
        appointmentFees: 2060,
        teleportFee: 1524.6,
        cgst: 137.2,
        sgst: 137.2,
        grandTotal: 3859,
        paymentStatus: "pending",
        paymentMethod: "",
        couponCode: "",
        discountAmount: 0,
      },
    },
  ]);

  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "Add basic details",
      completed: false,
      open: true,
      stepType: "basicDetails",
    },
    {
      id: 2,
      title: "Add visit details",
      completed: false,
      open: false,
      stepType: "visitDetails",
    },
    {
      id: 4,
      title: "Upload your visa documents",
      completed: false,
      open: false,
      stepType: "documents",
    },
    {
      id: 5,
      title: "Insurance",
      completed: false,
      open: false,
      stepType: "insurance",
    },
    {
      id: 3,
      title: "Book an appointment",
      completed: false,
      open: false,
      stepType: "appointment",
    },
    {
      id: 7,
      title: "Application Completed",
      completed: false,
      open: false,
      stepType: "completed",
    },
  ]);

  // const [documents, setDocuments] = useState({});

  // Map step info to UI steps - now uses current traveler's step info
  const updateStepsFromStepInfo = (stepInfo = null) => {
    const relevantStepInfo = stepInfo || getCurrentTravelerStepInfo();
    if (!relevantStepInfo) return;

    setSteps((prevSteps) => {
      const currentlyOpenStepId = prevSteps.find((s) => s.open)?.id;

      return prevSteps.map((step) => {
        const isCompleted = relevantStepInfo.completedSteps?.includes(
          step.stepType
        );
        const isCurrentFromServer =
          relevantStepInfo.currentStep === step.stepType;
        const isNextFromServer = relevantStepInfo.nextStep === step.stepType;

        let shouldBeOpen = false;

        if (currentlyOpenStepId === step.id) {
          shouldBeOpen = true;
        } else if (!currentlyOpenStepId) {
          shouldBeOpen = isCurrentFromServer || isNextFromServer;
        }

        return {
          ...step,
          completed: isCompleted,
          open: shouldBeOpen,
        };
      });
    });
  };

  // Filter steps based on traveler-specific insurance requirements and completion per traveler
  const getVisibleSteps = () => {
    if (!parentVisaApplication) return steps;

    // Get current traveler's step info for individual progress
    const currentTravelerStepInfo = getCurrentTravelerStepInfo();
    let visibleSteps = [...steps];

    // Check if current traveler has completed all required steps
    const isTravelerCompleted = currentTravelerStepInfo?.isCompleted || false;

    // Check traveler-specific insurance requirements - now ONLY at traveler level
    // Merge insurance signals from backend stepInfo and the traveler's insurance object
    const currentTraveler = getCurrentTraveler();
    const travelerInsuranceObj = currentTraveler?.insurance || {};

    // Backend may store a boolean/string flag or nested details. Treat any of these as indication
    // that the traveler has selected/needs insurance and therefore the insurance step should be shown.
    const insuranceFlagTrue =
      travelerInsuranceObj.insurance === "true" ||
      travelerInsuranceObj.insurance === true;
    const insuranceDetailsSelected =
      travelerInsuranceObj.insuranceDetails?.selected === true ||
      travelerInsuranceObj.insuranceDetails?.hasOwnInsurance === true;
    const insuranceSelectedPurchaseOrOwn =
      travelerInsuranceObj.insurance === "purchase" ||
      travelerInsuranceObj.insurance === "own";

    const computedRequiresInsurance =
      insuranceFlagTrue ||
      insuranceDetailsSelected ||
      insuranceSelectedPurchaseOrOwn;

    const travelerRequiresInsurance =
      currentTravelerStepInfo?.requiresInsurance ||
      computedRequiresInsurance ||
      false;
    const travelerHasInsurance = currentTravelerStepInfo?.hasInsurance || false;
    const isAdditionalTraveler =
      currentTravelerStepInfo?.isAdditionalTraveler || false;

    // console.log("Traveler insurance status:", {
    //   requiresInsurance: travelerRequiresInsurance,
    //   hasInsurance: travelerHasInsurance,
    //   isAdditionalTraveler: isAdditionalTraveler,
    //   isTravelerCompleted: isTravelerCompleted,
    // });


    const showInsuranceStep =
      // Simple logic: 
      // - Don't show if insurance is "true" (payment completed or auto-set)
      // - Show if insurance is "own" (for document upload)
      // - Show if insurance is "purchase" but not yet completed
      // - Show if no insurance selection made yet
      travelerInsuranceObj.insurance !== "true" &&
      (
        travelerInsuranceObj.insurance === "own" ||
        (travelerInsuranceObj.insurance === "purchase" && !travelerInsuranceObj.insurancePaymentCompleted) ||
        travelerInsuranceObj.insurance === "false" ||
        !travelerInsuranceObj.insurance || 
        travelerInsuranceObj.insurance === ""
      );

    if (!showInsuranceStep) {
      visibleSteps = visibleSteps.filter(
        (step) => step.stepType !== "insurance"
      );

      // Ensure completion step reflects current traveler state
      visibleSteps = visibleSteps.map((step) => {
        if (step.stepType === "completed") {
          return {
            ...step,
            title: "Application Completed",
            completed: isTravelerCompleted,
            open: currentTravelerStepInfo?.currentStep === "completed",
          };
        }
        return step;
      });
    } else {
      visibleSteps = visibleSteps.map((step) => {
        if (step.stepType === "insurance") {
          return {
            ...step,
            title: isAdditionalTraveler
              ? "Insurance (Additional Traveler)"
              : "Insurance",
          };
        }

        if (step.stepType === "completed") {
          return {
            ...step,
            title: "Application Completed",
            completed: isTravelerCompleted,
            open: currentTravelerStepInfo?.currentStep === "completed",
          };
        }

        return step;
      });
    }

    return visibleSteps;
  };

  // Traveler management functions
  const addTraveler = () => {
    const newTraveler = {
      id: travelersData.length + 1,
      // Appointment Details
      appointment: {
        preference1: {
          city: "",
          dateRangeStart: null,
          dateRangeEnd: null,
          slot: "",
        },
        preference2: {
          city: "",
          dateRangeStart: null,
          dateRangeEnd: null,
          slot: "",
        },
      },
      // Basic Details (Passport Information)
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
        mobileNumber: "",
        passportFront: null,
        passportBack: null,
      },
      // Visit Details
      visitDetails: {
        // Travel Information (always present in current form)
        visitingOtherSchengenCountries: [],
        firstCountryOfEntry: "",

        // Visa History (always present in current form)
        hasSchengenVisa: "",
        lastVisaStartDate: "",
        lastVisaEndDate: "",
        hasDigitalFingerprints: "",
        previousVisaNumber: "",

        // Personal Information (always present in current form)
        maritalStatus: "",
        partnerFullName: "",
        partnerDateOfBirth: "",

        // Employment Information (always present in current form)
        employmentStatus: "",
        institutionName: "",
        instituteEmail: "",
        instituteAddress: "",
        employerPhone: "",
        employerName: "",
        employerEmail: "",
        employerAddress: "",
        otherEmploymentStatus: "",

        // Payment Information (always present in current form)
        willAnyonePayForVisit: "",
        fundingPersonName: "",
        tripFundedBy: "",
      },
      // Documents
      documents: {
        documents: {},
      },
      // Insurance
      insurance: {
        insurance: "",
        insuranceDetails: null,
        insuranceCertificate: null,
      },
      // Payment
      payment: {
        appointmentFees: 2060,
        teleportFee: 1524.6,
        cgst: 137.2,
        sgst: 137.2,
        grandTotal: 3859,
        paymentStatus: "pending",
        paymentMethod: "",
        couponCode: "",
        discountAmount: 0,
      },
      // Note: Step tracking moved to stepInfo object only
    };

    const newTravelersData = [...travelersData, newTraveler];
    const newNumberOfTravelers = numberOfTravelers + 1;

    setTravelersData(newTravelersData);
    setNumberOfTravelers(newNumberOfTravelers);

    // Update Redux store
    dispatch(setTravelers(newNumberOfTravelers));

    // Initialize step info for new traveler
    setTravelersStepInfo((prev) => ({
      ...prev,
      [newTraveler.id]: {
        completedSteps: [],
        currentStep: "basicDetails",
        nextStep: null,
        isCompleted: false,
        stepProgress: 0,
        totalSteps: 6,
        stepNames: {
          createApplication: "Application Created",
          basicDetails: "Basic Details",
          visitDetails: "Visit Details",
          appointment: "Book an appointment",
          documents: "Documents Upload",
          insurance: "Insurance",
          payment: "Payment",
        },
      },
    }));
  };

  const removeTraveler = (travelerId) => {
    if (travelersData.length > 1) {
      const newTravelersData = travelersData.filter(
        (traveler) => traveler.id !== travelerId
      );
      const newNumberOfTravelers = numberOfTravelers - 1;

      setTravelersData(newTravelersData);
      setNumberOfTravelers(newNumberOfTravelers);

      // Update Redux store
      dispatch(setTravelers(newNumberOfTravelers));

      // Remove step info for deleted traveler
      setTravelersStepInfo((prev) => {
        const updated = { ...prev };
        delete updated[travelerId];
        return updated;
      });

      // If we removed the current traveler, switch to the first one
      if (currentTravelerIndex >= travelersData.length - 1) {
        setCurrentTravelerIndex(0);
      }
    }
  };

  const switchTraveler = (index) => {
    setCurrentTravelerIndex(index);
  };

  // Get current traveler data
  const getCurrentTraveler = () =>
    travelersData[currentTravelerIndex] || travelersData[0];

  // Get current traveler's step info - only use stepInfo object
  const getCurrentTravelerStepInfo = () => {
    const currentTraveler = getCurrentTraveler();

    // If traveler has stepInfo from backend, use that (it has the complete structure)
    if (currentTraveler?.stepInfo) {
      return currentTraveler.stepInfo;
    }

    // Fallback to local state or default (no more redundant currentStep/completedSteps)
    return (
      travelersStepInfo[currentTraveler?.id] || {
        completedSteps: [],
        currentStep: "basicDetails",
        nextStep: null,
        isCompleted: false,
        stepProgress: 0,
        totalSteps: 6,
        stepNames: {
          createApplication: "Application Created",
          basicDetails: "Basic Details",
          visitDetails: "Visit Details",
          appointment: "Book an appointment",
          documents: "Documents Upload",
          insurance: "Insurance",
          payment: "Payment",
        },
      }
    );
  };

  // Update step info for current traveler - only manage stepInfo object
  const updateCurrentTravelerStepInfo = (stepInfoUpdate) => {
    const currentTraveler = getCurrentTraveler();
    if (!currentTraveler) return;

    setTravelersStepInfo((prev) => ({
      ...prev,
      [currentTraveler.id]: {
        ...prev[currentTraveler.id],
        ...stepInfoUpdate,
      },
    }));

    // Update the traveler's stepInfo in travelersData (no more redundant fields)
    setTravelersData((prev) => {
      return prev.map((traveler) => {
        if (traveler.id === currentTraveler.id) {
          return {
            ...traveler,
            stepInfo: {
              ...traveler.stepInfo,
              ...stepInfoUpdate,
            },
          };
        }
        return traveler;
      });
    });
  };

  // Update current traveler data
  const updateCurrentTravelerData = (section, data) => {
    console.log("Updating traveler data:", {
      section,
      data,
      currentTravelerIndex,
    });
    // If basicDetails contains travel dates, sync them to global Redux store
    if (section === "basicDetails") {
      if (data.travelStartDate) {
        dispatch(setArrivalDate(String(data.travelStartDate)));
      }
      if (data.travelEndDate) {
        dispatch(setDepartureDate(String(data.travelEndDate)));
      }
    }

    setTravelersData((prev) => {
      const updated = prev.map((traveler, index) => {
        if (index === currentTravelerIndex) {
          return {
            ...traveler,
            [section]: {
              ...traveler[section],
              ...data,
            },
          };
        }
        return traveler;
      });
      return updated;
    });
  };

  // Initialize travelers data when number changes
  const initializeTravelersData = (newNumber) => {
    const currentData = [...travelersData];

    // If we need more travelers, add empty ones
    while (currentData.length < newNumber) {
      currentData.push({
        id: currentData.length + 1,
        appointment: {
          preference1: {
            city: "",
            dateRange: "",
            slot: "",
          },
          preference2: {
            city: "",
            dateRange: "",
            slot: "",
          },
        },
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
          mobileNumber: "",
          passportFront: null,
          passportBack: null,
          travelStartDate: "",
          travelEndDate: "",
        },
        visitDetails: {
          // Travel Information (always present in current form)
          visitingOtherSchengenCountries: [],
          firstCountryOfEntry: "",

          // Visa History (always present in current form)
          hasSchengenVisa: "",
          lastVisaStartDate: "",
          lastVisaEndDate: "",
          hasDigitalFingerprints: "",
          previousVisaNumber: "",

          // Personal Information (always present in current form)
          maritalStatus: "",
          partnerFullName: "",
          partnerDateOfBirth: "",

          // Employment Information (always present in current form)
          employmentStatus: "",
          institutionName: "",
          instituteEmail: "",
          instituteAddress: "",
          employerPhone: "",
          employerName: "",
          employerEmail: "",
          employerAddress: "",
          otherEmploymentStatus: "",

          // Payment Information (always present in current form)
          willAnyonePayForVisit: "",
          fundingPersonName: "",
          tripFundedBy: "",
        },
        documents: {
          documents: {},
        },
        insurance: {
          insurance: "",
          insuranceDetails: null,
          insuranceCertificate: null,
        },
        completedSteps: [],
        currentStep: "basicDetails",
        completed: false,
      });
    }

    // If we need fewer travelers, remove from end
    while (currentData.length > newNumber) {
      currentData.pop();
    }

    setTravelersData(currentData);

    // Update Redux store
    dispatch(setTravelers(newNumber));

    // Reset current traveler index if it's out of bounds
    if (currentTravelerIndex >= newNumber) {
      setCurrentTravelerIndex(0);
    }
  };

  // Get current traveler data
  const getCurrentTravelerData = () => {
    return (
      travelersData[currentTravelerIndex] || {
        id: 1,
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
          mobileNumber: "",
          passportFront: null,
          passportBack: null,
        },
        visitDetails: {
          // Travel Information
          visitingOtherSchengenCountries: [],
          firstCountryOfEntry: "",
          travelPurpose: "",
          entryDate: "",
          exitDate: "",

          // Visa History
          hasSchengenVisa: "",
          lastVisaStartDate: "",
          lastVisaEndDate: "",
          hasDigitalFingerprints: "",
          previousVisaNumber: "",

          // Personal Information
          maritalStatus: "",
          partnerFullName: "",
          partnerDateOfBirth: "",

          // Employment Information
          employmentStatus: "",
          institutionName: "",
          instituteEmail: "",
          instituteAddress: "",
          employerPhone: "",
          employerName: "",
          employerEmail: "",
          employerAddress: "",
          otherEmploymentStatus: "",

          // Financial Information
          hasOtherIncome: "",
          hasSavings: "",
          monthlyExpenditure: "",
          willAnyonePayForVisit: "",
          fundingPersonName: "",
          tripFundedBy: "",

          // Travel History (deprecated - keeping for backward compatibility)
          hasVisitSponsor: false,
          noVisitSponsor: false,
          hasUkTravelHistory: false,
          noUkTravelHistory: false,
          hasSpecificCountryTravel: false,
          noSpecificCountryTravel: false,
          hasOtherCountryTravel: false,
          noOtherCountryTravel: false,
        },
        documents: {
          documents: {},
        },
        insurance: {
          insurance: "",
          insuranceDetails: null,
          insuranceCertificate: null,
        },
        completedSteps: [],
        currentStep: "basicDetails",
        completed: false,
      }
    );
  };

  const toggleStep = (stepId) => {
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    const allPreviousCompleted = steps
      .slice(0, stepIndex)
      .every((s) => s.completed);

    if (!allPreviousCompleted && stepId !== 1) return;

    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        open: step.id === stepId ? !step.open : false,
      }))
    );
  };
  const handleCompleteStep = async (stepId, stepData = {}) => {
    setLoading(true);
    try {
      const step = steps.find((s) => s.id === stepId);
      const currentTraveler = travelersData[currentTravelerIndex];

      // Use updated travelers data if provided, otherwise use current state
      let travelersDataToSend = stepData.updatedTravelersData || travelersData;

      // Special handling for appointment step data
      if (
        (stepId === 3 || step?.stepType === "appointment") &&
        stepData.appointmentData
      ) {


        // Update the current traveler's appointment data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedTraveler = {
              ...traveler,
              appointment: stepData.appointmentData,
            };
         
            return updatedTraveler;
          }
          return traveler;
        });
      }

      // Special handling for basic details step data
      if (
        (stepId === 1 || step?.stepType === "basicDetails") &&
        stepData.basicDetails
      ) {
     

        // Update the current traveler's basic details data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedTraveler = {
              ...traveler,
              basicDetails: {
                ...traveler.basicDetails,
                ...stepData.basicDetails,
              },
            };
       
            return updatedTraveler;
          }
          return traveler;
        });
      }

      if (
        (stepId === "insurance" ||
          stepId === 5 ||
          step?.stepType === "insurance" ||
          stepId === 6) &&
        stepData.insuranceData
      ) {

        // Update the current traveler's insurance data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedTraveler = {
              ...traveler,
              insurance: {
                ...(traveler.insurance || {}),
                ...stepData.insuranceData,
              },
            };

            return updatedTraveler;
          }
          return traveler;
        });
      } else {
        console.log("❌ INSURANCE DATA MERGE - CONDITION NOT MET");
        console.log("stepId:", stepId, "step.stepType:", step?.stepType);
        console.log("Has insuranceData:", !!stepData.insuranceData);
      }

      if (stepId === 6 || step?.stepType === "payment") {


        // Update the current traveler's payment data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedPayment = {
              ...traveler.payment,
              ...(stepData.paymentData || {}),
              paymentStatus: "completed", // Mark as completed
              paymentMethod: stepData.paymentData?.paymentMethod || traveler.payment?.paymentMethod || "stripe",
              paymentDate: new Date().toISOString(),
              amountPaid: stepData.paymentData?.grandTotal || traveler.payment?.grandTotal || 3859,
            };

            const updatedTraveler = {
              ...traveler,
              payment: updatedPayment,
            };
            return updatedTraveler;
          }
          return traveler;
        });
      }

  

      // Build payload but exclude appointmentData (we already merged it into travelersDataToSend)
      const stepDataForPayload = { ...stepData };
      // Remove keys that should not be sent at top-level
      delete stepDataForPayload.appointmentData;
      delete stepDataForPayload.updatedTravelersData;
      delete stepDataForPayload.insuranceData;
      delete stepDataForPayload.paymentData;

      // Backend expects one of: createApplication, basicDetails, visitDetails, documents, insurance, payment
      const allowedTypes = [
        "createApplication",
        "basicDetails",
        "visitDetails",
        "documents",
        "insurance",
        "payment",
      ];

      // Map internal step types to backend-allowed types
      let typeToSend = step.stepType;
      if (!allowedTypes.includes(typeToSend)) {
        const typeMapping = {
          appointment: "documents", // appointment data is merged into travelersData; send under documents
          completed: "createApplication",
        };
        typeToSend = typeMapping[typeToSend] || "createApplication";
      }

     

      const payload = {
        type: step.stepType,
        applicationId: applicationId,
        currentTravelerIndex: currentTravelerIndex,
        travelersData: travelersDataToSend,
        numberOfTravellers: numberOfTravelers,
        ...(stepDataForPayload || {}),
        ...(stepData.appointmentData
          ? { appointment: stepData.appointmentData }
          : {}),
          
      };

      console.log("=== FINAL PAYLOAD BEFORE API CALL ===", payload);


      const response = await createOrUpdateApplication(token, payload);

      if (response?.status >= 200 && response?.status < 300) {
        const updatedApplication = response?.data?.data?.results?.application;

        if (updatedApplication?.travelersData) {
          try {
            const updatedTravelersData = Array.isArray(
              updatedApplication.travelersData
            )
              ? updatedApplication.travelersData
              : JSON.parse(updatedApplication.travelersData);

            setTravelersData(updatedTravelersData);

            const updatedTravelersStepInfo = {};
            updatedTravelersData.forEach((traveler) => {
              if (traveler.stepInfo) {
                updatedTravelersStepInfo[traveler.id] = traveler.stepInfo;
              }
            });
            setTravelersStepInfo((prev) => ({
              ...prev,
              ...updatedTravelersStepInfo,
            }));
          } catch (error) {
            console.error("Error parsing updated travelers data:", error);
            showError("Failed to parse application data. Please try again.");
            return;
          }
        }

        // Update UI steps based on current traveler's updated step info
        updateStepsFromStepInfo();

        // Refresh application data
        await fetchApplicationById();

        // Determine next visible step (skip removed/hidden steps like insurance when not needed)
        const visible = getVisibleSteps();

        // Find the position of the currently completed step in the visible list
        const currentVisibleIndex = visible.findIndex((s) => s.id === step.id);

        // If there is a next visible step, open it
        if (currentVisibleIndex !== -1 && currentVisibleIndex < visible.length - 1) {
          const nextVisibleStep = visible[currentVisibleIndex + 1];
          if (nextVisibleStep) toggleStep(nextVisibleStep.id);
        }
      } else {
        // Handle API error responses
        const errorMessage =
          response?.data?.message ||
          response?.data?.error ||
          "Failed to complete step. Please try again.";
        showError(errorMessage);
      }
    } catch (error) {
      console.error("Error completing step:", error);

      // Show user-friendly error message
      let errorMessage = "Something went wrong. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validatePassportData = () => {
    const currentTraveler = getCurrentTravelerData();
    const basicDetails = currentTraveler.basicDetails || {};

    return (
      basicDetails.passportNumber &&
      basicDetails.firstName &&
      basicDetails.lastName &&
      basicDetails.sex &&
      basicDetails.dateOfBirth &&
      basicDetails.placeOfBirth &&
      basicDetails.passportIssuePlace &&
      basicDetails.passportIssueDate &&
      basicDetails.passportExpiryDate &&
      basicDetails.currentAddress1 &&
      basicDetails.state &&
      basicDetails.city &&
      basicDetails.pincode &&
      basicDetails.mobileNumber &&
      basicDetails.passportFront &&
      basicDetails.passportBack
    );
  };

  const validateVisitData = () => {
    const currentTraveler = getCurrentTravelerData();
    const visitDetails = currentTraveler.visitDetails || {};

    console.log("=== VALIDATING VISIT DATA ===");
    console.log("Visit details:", visitDetails);

    // Only validate fields that are actually visible in the current form
    const isValid =
      // Travel Information (always required)
      visitDetails.visitingOtherSchengenCountries &&
      Array.isArray(visitDetails.visitingOtherSchengenCountries) &&
      visitDetails.visitingOtherSchengenCountries.length > 0 &&
      visitDetails.firstCountryOfEntry &&
      // Visa History (always required)
      visitDetails.hasSchengenVisa &&
      visitDetails.hasDigitalFingerprints &&
      // Personal Information (always required)
      visitDetails.maritalStatus &&
      // Employment Information (always required)
      visitDetails.employmentStatus &&
      // Payment Information (always required)
      visitDetails.willAnyonePayForVisit &&
      // Conditional validations
      (visitDetails.hasSchengenVisa !== "Yes" ||
        (visitDetails.lastVisaStartDate && visitDetails.lastVisaEndDate)) &&
      (visitDetails.hasDigitalFingerprints !== "Yes" ||
        visitDetails.previousVisaNumber) &&
      (visitDetails.maritalStatus !== "Married" ||
        (visitDetails.partnerFullName && visitDetails.partnerDateOfBirth)) &&
      (visitDetails.employmentStatus !== "Student" ||
        (visitDetails.institutionName &&
          visitDetails.instituteEmail &&
          visitDetails.instituteAddress)) &&
      (visitDetails.employmentStatus !== "Employed" ||
        (visitDetails.employerPhone &&
          visitDetails.employerName &&
          visitDetails.employerEmail &&
          visitDetails.employerAddress)) &&
      (visitDetails.employmentStatus !== "Other" ||
        visitDetails.otherEmploymentStatus) &&
      (visitDetails.willAnyonePayForVisit !== "Yes" ||
        (visitDetails.fundingPersonName && visitDetails.tripFundedBy));

    console.log("Visit data validation result:", isValid);
    return isValid;
  };

  const validateDocuments = () => {
    const currentTraveler = getCurrentTravelerData();
    const documents = currentTraveler.documents?.documents || {};
    const requiredDocIds = [1, 2, 5]; // Only required documents need validation
    return requiredDocIds.every((id) => documents[id]);
  };

  const validateAppointment = () => {
    const currentTraveler = getCurrentTravelerData();
    const appointment = currentTraveler.appointment || {};

    // Check if at least preference1 is filled
    const pref1 = appointment.preference1 || {};
    return (
      pref1.city &&
      pref1.dateRangeStart &&
      pref1.dateRangeEnd &&
      pref1.slot
    );
  };

  const validateInsurance = () => {
    const currentTraveler = getCurrentTravelerData();
    const insurance = currentTraveler.insurance || {};

    // Insurance is complete if:
    // 1. It's "true" (paid through the system), OR
    // 2. It's "own" and a certificate is uploaded, OR
    // 3. Payment was completed (auto-set to true and hide step)
    if (insurance.insurance === "true") {
      return true; // Paid insurance is always valid
    }

    // If payment details exist, automatically mark as complete and update status
    if (insurance.orderId && insurance.paymentAmount && insurance.insurancePaymentCompleted) {
      // Auto-update insurance status to "true" when payment is completed
      updateCurrentTravelerData("insurance", {
        ...insurance,
        insurance: "true"
      });
      return true; // Payment completed = insurance complete
    }

    // Enhanced check for purchase insurance payment completion
    if (insurance.insurance === "purchase") {
      const hasPaymentInfo = !!(insurance.orderId && insurance.paymentAmount && insurance.paymentDate);
      const paymentCompleted = insurance.insurancePaymentCompleted === true;
      
      if (hasPaymentInfo && paymentCompleted) {
        // Auto-update to "true" status when purchase is complete
        updateCurrentTravelerData("insurance", {
          ...insurance,
          insurance: "true"
        });
        return true;
      }
      
      return paymentCompleted && hasPaymentInfo;
    }

    if (insurance.insurance === "own") {
      return !!(
        insurance.insuranceCertificate &&
        insurance.insuranceDetails?.certificateUploaded
      );
    }

    return false;
  };

  // console.log("Current Traveler Data:", getCurrentTravelerData());
  // console.log("Travelers Data:", travelersData);
  // console.log("Current Traveler Index:", currentTravelerIndex);
  // console.log("Step Info:", stepInfo);
  const fetchApplicationById = async () => {
    try {
      const payload = { id: applicationId };
      const response = await getVisaApplication(token, payload);

      if (response?.status >= 200 && response?.status < 300) {
        const applicationData = response?.data?.data?.results?.application;
        // const stepInfoData = response?.data?.data?.results?.stepInfo; // No longer using global stepInfo

        setParentVisaApplication(applicationData);
        // setStepInfo(stepInfoData); // No longer using global stepInfo

        // Update steps based on current traveler's step info
        updateStepsFromStepInfo();

        // Pre-populate form data from application
        if (applicationData) {
          // Initialize insurance fees based on country
          const country = applicationData.country || "United Kingdom";
          const config =
            COUNTRY_CONFIG[country.toUpperCase()] ||
            COUNTRY_CONFIG["UNITED KINGDOM"];
          if (
            config?.insuranceFee &&
            (!visaState.insuranceFees || visaState.insuranceFees === 0)
          ) {
            console.log(
              `Setting insurance fees for ${country}:`,
              config.insuranceFee
            );
            dispatch(setInsuranceFees(Number(config.insuranceFee)));
          }

          // Load travelers data if available
          if (applicationData.travelersData) {
            try {
              const savedTravelersData = Array.isArray(
                applicationData.travelersData
              )
                ? applicationData.travelersData
                : JSON.parse(applicationData.travelersData);
              // Normalize redux dates to YYYY-MM-DD and fill missing per-traveler dates
              const normalizeDate = (v) => {
                if (!v) return "";
                if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
                if (String(v).includes("T")) return String(v).split("T")[0];
                try {
                  const d = new Date(v);
                  if (isNaN(d.getTime())) return "";
                  return d.toISOString().split("T")[0];
                } catch (e) {
                  return "";
                }
              };

              const reduxArrival = normalizeDate(visaState?.arrivalDate);
              const reduxDeparture = normalizeDate(visaState?.departureDate);

              const filledTravelersData = savedTravelersData.map((t) => {
                const basic = t.basicDetails || {};
                const updatedBasic = { ...basic };
                if (
                  (!updatedBasic.travelStartDate ||
                    String(updatedBasic.travelStartDate).trim() === "") &&
                  reduxArrival
                ) {
                  updatedBasic.travelStartDate = reduxArrival;
                }
                if (
                  (!updatedBasic.travelEndDate ||
                    String(updatedBasic.travelEndDate).trim() === "") &&
                  reduxDeparture
                ) {
                  updatedBasic.travelEndDate = reduxDeparture;
                }
                return { ...t, basicDetails: updatedBasic };
              });

              setTravelersData(filledTravelersData);
              setNumberOfTravelers(filledTravelersData.length);

              // Initialize per-traveler step info - use backend stepInfo if available
              const initialTravelersStepInfo = {};
              savedTravelersData.forEach((traveler) => {
                // If traveler has stepInfo from backend, use that; otherwise use default
                if (traveler.stepInfo) {
                  initialTravelersStepInfo[traveler.id] = traveler.stepInfo;
                } else {
                  // Default step info (no more reading from redundant currentStep/completedSteps)
                  initialTravelersStepInfo[traveler.id] = {
                    completedSteps: [],
                    currentStep: "basicDetails",
                    nextStep: null,
                    isCompleted: false,
                    stepProgress: 0,
                    totalSteps: 5,
                    stepNames: {
                      createApplication: "Application Created",
                      basicDetails: "Basic Details",
                      visitDetails: "Visit Details",
                      documents: "Documents Upload",
                      insurance: "Insurance",
                      payment: "Payment",
                    },
                  };
                }
              });
              setTravelersStepInfo(initialTravelersStepInfo);
            } catch (error) {
              console.error("Error parsing travelersData:", error);
              showError(
                "Failed to load application data. Please refresh the page."
              );
            }
          }

          // Also update number of travelers from application data if available
          if (applicationData.numberOfTravellers) {
            setNumberOfTravelers(applicationData.numberOfTravellers);
            // Update Redux store to sync with loaded application data
            dispatch(setTravelers(applicationData.numberOfTravellers));
          }
        }
      } else {
        // Handle API error responses
        const errorMessage =
          response?.data?.message ||
          response?.data?.error ||
          "Failed to load application. Please try again.";
        showError(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      showError(
        "Failed to load application. Please check your connection and try again."
      );
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchApplicationById();
    }
  }, [applicationId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to update steps when traveler changes
  useEffect(() => {
    if (
      currentTravelerIndex >= 0 &&
      currentTravelerIndex < travelersData.length
    ) {
      // Update steps based on current traveler's step info
      updateStepsFromStepInfo();
    }
  }, [currentTravelerIndex, travelersData, travelersStepInfo]);

  // Prefill per-traveler travelStartDate / travelEndDate from global Redux visa dates.
  // Run when global dates change or when the number of travelers changes so newly
  // added traveler entries can inherit the selected dates.
  useEffect(() => {
    const reduxArrivalRaw = visaState?.arrivalDate;
    const reduxDepartureRaw = visaState?.departureDate;

    if (!reduxArrivalRaw && !reduxDepartureRaw) return;

    const normalizeDate = (v) => {
      if (!v) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
      if (String(v).includes("T")) return String(v).split("T")[0];
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      } catch (e) {
        return "";
      }
    };

    const reduxArrival = normalizeDate(reduxArrivalRaw);
    const reduxDeparture = normalizeDate(reduxDepartureRaw);

    if (!reduxArrival && !reduxDeparture) return;

    setTravelersData((current) => {
      let changed = false;
      const next = current.map((t) => {
        const basic = t.basicDetails || {};
        const hasStart =
          basic.travelStartDate && String(basic.travelStartDate).trim() !== "";
        const hasEnd =
          basic.travelEndDate && String(basic.travelEndDate).trim() !== "";
        const updatedBasic = { ...basic };
        let itemChanged = false;
        if (!hasStart && reduxArrival) {
          updatedBasic.travelStartDate = reduxArrival;
          itemChanged = true;
        }
        if (!hasEnd && reduxDeparture) {
          updatedBasic.travelEndDate = reduxDeparture;
          itemChanged = true;
        }
        if (itemChanged) changed = true;
        return itemChanged ? { ...t, basicDetails: updatedBasic } : t;
      });

      return changed ? next : current;
    });
  }, [visaState?.arrivalDate, visaState?.departureDate, numberOfTravelers]);

  // // Effect to ensure traveler data is properly initialized when switching travelers
  // useEffect(() => {
  //   if (
  //     currentTravelerIndex >= 0 &&
  //     currentTravelerIndex < travelersData.length
  //   ) {
  //     console.log("Traveler switched to index:", currentTravelerIndex);
  //     console.log(
  //       "Current traveler data:",
  //       travelersData[currentTravelerIndex]
  //     );
  //   }
  // }, [currentTravelerIndex, travelersData]);

  return (
    <div className="w-full pri_bg text-white h-full min-h-screen">
      <Header href="/dashboard" />
      <div className="w-full max-w-4xl py-[25px] pri_bg mx-auto flex-col gap-3 flex items-center justify-center px-6">
        {/* Go Back Button */}
        <div className="w-full mb-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            <ChevronLeft className="size-5" />
            <span className="text-sm font-medium">Go Back</span>
          </button>
        </div>

        {/* Country Info */}
        <div className="flex flex-col md:flex-row justify-start w-full items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img
              src="https://flagcdn.com/w80/gb.png"
              alt="United Kingdom Flag"
              width={40}
              height={30}
              className="rounded-md border border-gray-200 w-[50px] h-[42px]"
            />
            <div>
              <h2 className="text-2xl font-gilroy-bold text-white">
                <ClientOnly fallback="United Kingdom Visa Application">
                  {parentVisaApplication?.country
                    ? `${parentVisaApplication?.country} Visa Application`
                    : "United Kingdom Visa Application"}
                </ClientOnly>
              </h2>
              <p className="text-gray-300">6 Months Short-Term Tourist Visa</p>
            </div>
          </div>
        </div>

        {/* Number of Travelers Setup */}
        <div className="w-full mb-6">
          <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
            <h3 className="text-white font-gilroy-bold text-lg mb-4">
              Number of Travelers
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-gray-300">
                How many people will be traveling?
              </label>
              <select
                value={numberOfTravelers}
                onChange={(e) => {
                  const newNumber = parseInt(e.target.value);
                  setNumberOfTravelers(newNumber);
                  // Initialize travelers data if needed
                  initializeTravelersData(newNumber);
                }}
                className="bg-[#292933] border border-[#423577] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-[#6366F1]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Traveler" : "Travelers"}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-400">
              You will complete separate application forms for each traveler.
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressHeader
          steps={getVisibleSteps()}
          stepInfo={getCurrentTravelerStepInfo()}
          onStepClick={(stepId) => toggleStep(stepId)}
        />

        {/* Traveler Navigation */}
        {numberOfTravelers > 1 && (
          <div className="w-full mb-6">
            <div className="bg-[#23232B] border border-[#423577] rounded-lg p-4">
              <h3 className="text-white font-gilroy-bold text-lg mb-4">
                Select Traveler
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: numberOfTravelers }, (_, index) => {
                  const travelerStepInfo =
                    travelersStepInfo[travelersData[index]?.id] ||
                    travelersData[index]?.stepInfo;
                  const isCompleted = travelerStepInfo?.isCompleted || false;
                  const completedStepsCount =
                    travelerStepInfo?.completedSteps?.length || 0;
                  const totalSteps = travelerStepInfo?.totalSteps || 4;
                  const isAdditionalTraveler =
                    travelerStepInfo?.isAdditionalTraveler || false;
                  const requiresInsurance =
                    travelerStepInfo?.requiresInsurance || false;
                  const hasInsurance = travelerStepInfo?.hasInsurance || false;

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentTravelerIndex(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 relative ${
                        currentTravelerIndex === index
                          ? "bg-[#6366F1] text-white"
                          : "bg-[#292933] text-gray-300 hover:bg-[#333340] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          Traveler {index + 1}
                          {travelersData[index]?.basicDetails?.firstName &&
                            ` - ${travelersData[index].basicDetails.firstName}`}
                        </span>
                        {isAdditionalTraveler && (
                          <span className="text-xs bg-yellow-500 text-black px-1 rounded">
                            ADD
                          </span>
                        )}
                        {isCompleted && (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {!isCompleted && (
                        <div className="text-xs text-gray-400 mt-1">
                          {completedStepsCount}/{totalSteps} steps
                          {isAdditionalTraveler && requiresInsurance && (
                            <span className="text-yellow-400">
                              {" "}
                              • Insurance Required
                            </span>
                          )}
                        </div>
                      )}
                      {isCompleted && (
                        <div className="text-xs text-green-400 mt-1">
                          {isAdditionalTraveler
                            ? "Additional Traveler Complete"
                            : "Application Complete"}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Currently viewing application for Traveler{" "}
                {currentTravelerIndex + 1}
                {(() => {
                  const currentTravelerStepInfo = getCurrentTravelerStepInfo();
                  const isCompleted =
                    currentTravelerStepInfo?.isCompleted || false;
                  const isAdditionalTraveler =
                    currentTravelerStepInfo?.isAdditionalTraveler || false;
                  const requiresInsurance =
                    currentTravelerStepInfo?.requiresInsurance || false;

                  if (isCompleted) {
                    return isAdditionalTraveler
                      ? " (Additional Traveler - Completed)"
                      : " (Completed)";
                  }
                  if (isAdditionalTraveler) {
                    return requiresInsurance
                      ? " (Additional Traveler - Insurance Required)"
                      : " (Additional Traveler)";
                  }
                  return "";
                })()}
              </div>

              {/* Application Status Summary */}
              {parentVisaApplication && (
                <div className="mt-3 pt-3 border-t border-[#423577]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Application Status:</span>
                    <span
                      className={`font-medium ${
                        parentVisaApplication.applicationStatus === "submitted"
                          ? "text-green-400"
                          : parentVisaApplication.applicationStatus ===
                            "payment_required"
                          ? "text-yellow-400"
                          : "text-blue-400"
                      }`}
                    >
                      {parentVisaApplication.applicationStatus ===
                      "payment_required"
                        ? "Payment Required"
                        : parentVisaApplication.applicationStatus ===
                          "submitted"
                        ? "Submitted"
                        : "In Progress"}
                    </span>
                  </div>
                  {parentVisaApplication.applicationStatus ===
                    "payment_required" && (
                    <div className="text-xs text-yellow-400 mt-1">
                      Additional travelers require insurance payment
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step Sections */}
        <div className="space-y-2 w-full">
          {getVisibleSteps().map((step, index) => {
            const visibleSteps = getVisibleSteps();
            const isLocked =
              !visibleSteps.slice(0, index).every((s) => s.completed) &&
              index !== 0;

            return (
              <div
                key={step.id}
                className={`border rounded-lg border-[#423577] overflow-hidden transition-all duration-300 ${
                  isLocked ? "opacity-50 cursor-not-allowed" : "opacity-100"
                }`}
                style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 3px 0px" }}
              >
                {/* Step Header */}
                <div
                  className={`p-4 flex justify-between items-center ${
                    isLocked ? "cursor-not-allowed" : "cursor-pointer"
                  } ${step.open ? "bg-[#292933]" : "bg-[#23232B]"}`}
                  onClick={() => !isLocked && toggleStep(step.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {step.completed ? "✓" : index + 1}
                    </div>
                    <h3 className="font-gilroy-bold text-white text-[18px]">
                      {step.title}
                    </h3>
                  </div>

                  {isLocked ? <LockIcon /> : step.open ? null : <ChevronIcon />}
                </div>

                {/* Step Content */}
                {step.open && (
                  <div className="p-4 border-[#423577] border-t">
                    {step.id === 1 && (
                      <PassportStep
                        travelerIndex={currentTravelerIndex}
                        travelerData={getCurrentTravelerData()}
                        travelersData={travelersData}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        validatePassportData={validatePassportData}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                      />
                    )}

                    {step.id === 2 && step.stepType === "visitDetails" && (
                      <VisitStep
                        travelerIndex={currentTravelerIndex}
                        travelerData={getCurrentTravelerData()}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        validateVisitData={validateVisitData}
                        parentVisaApplication={parentVisaApplication}
                        setParentVisaApplication={setParentVisaApplication}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                      />
                    )}

                    {step.id === 3 && step.stepType === "appointment" && (
                      <BookingAppointment
                        travelerData={getCurrentTravelerData()}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        validateAppointment={validateAppointment}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                      />
                    )}

                    {step.id === 4 && step.stepType === "documents" && (
                      <DocumentStep
                        travelerIndex={currentTravelerIndex}
                        travelerData={getCurrentTravelerData()}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        validateDocuments={validateDocuments}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                      />
                    )}

                    {step.id === 5 && step.stepType === "insurance" && (
                      <InsuranceStep
                        travelerIndex={currentTravelerIndex}
                        travelerData={getCurrentTravelerData()}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                        parentVisaApplication={parentVisaApplication}
                      />
                    )}

                    {step.id === 7 && step.stepType === "completed" && (
                      <ApplicationCompletedSection
                        parentVisaApplication={parentVisaApplication}
                        applicationId={applicationId}
                        onAddTraveler={() => {
                          // Add new traveler functionality
                          const newTravelerCount = numberOfTravelers + 1;
                          setNumberOfTravelers(newTravelerCount);
                          initializeTravelersData(newTravelerCount);
                          setCurrentTravelerIndex(newTravelerCount - 1);
                        }}
                        onUploadDocument={() => {
                          // Navigate back to documents step for current traveler
                          const documentsStep = steps.find(
                            (s) => s.stepType === "documents"
                          );
                          if (documentsStep) {
                            toggleStep(documentsStep.id);
                          }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* Updated Sub Components */
const PassportStep = ({
  travelerIndex,
  travelerData,
  travelersData,
  updateCurrentTravelerData,
  validatePassportData,
  onComplete,
  loading,
}) => {
  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      console.log("=== FILE TO BASE64 DEBUG ===");
      console.log("fileToBase64 called with:", file);
      console.log("File type:", typeof file);
      console.log("File instanceof File:", file instanceof File);

      if (!file) {
        console.log("No file provided, resolving with null");
        resolve(null);
        return;
      }

      // If it's already a base64 string, return it as is
      if (typeof file === "string" && file.startsWith("data:")) {
        console.log("File is already base64 string, returning as-is");
        resolve(file);
        return;
      }

      // If it's a File object, convert it to base64
      if (file instanceof File) {
        console.log("Converting File object to base64");
        console.log(
          "File details - name:",
          file.name,
          "size:",
          file.size,
          "type:",
          file.type
        );
        const reader = new FileReader();
        reader.onload = () => {
          console.log(
            "FileReader onload - result length:",
            reader.result?.length
          );
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        reader.readAsDataURL(file);
      } else {
        // Unknown type
        console.warn("Unknown file type:", typeof file, file);
        resolve(null);
      }
    });
  };

  const handleSave = async () => {
    try {
      const basicDetails = travelerData.basicDetails || {};

      console.log("=== PASSPORT SAVE DEBUG ===");
      console.log("basicDetails:", basicDetails);
      console.log("passportFront:", basicDetails.passportFront);
      console.log("passportFront type:", typeof basicDetails.passportFront);
      console.log("passportBack:", basicDetails.passportBack);
      console.log("passportBack type:", typeof basicDetails.passportBack);

      // Convert files to base64 if they exist
      const passportFrontBase64 = await fileToBase64(
        basicDetails.passportFront
      );
      const passportBackBase64 = await fileToBase64(basicDetails.passportBack);

      console.log(
        "passportFrontBase64:",
        passportFrontBase64 ? "DATA CONVERTED" : "NULL"
      );
      console.log(
        "passportBackBase64:",
        passportBackBase64 ? "DATA CONVERTED" : "NULL"
      );

      // Create updated basic details with converted base64 images
      const updatedBasicDetails = {
        ...basicDetails,
        passportFront: passportFrontBase64,
        passportBack: passportBackBase64,
      };

      // Create updated travelers data for sending to backend
      const updatedTravelersData = travelersData.map((traveler, index) =>
        index === travelerIndex
          ? { ...traveler, basicDetails: updatedBasicDetails }
          : traveler
      );

      // Also update the local state for UI consistency
      updateCurrentTravelerData("basicDetails", updatedBasicDetails);

      // NOTE: Field-level validation and error display is handled by
      // PassportInformationSection.validate() which sets inline errors.
      // Remove alert-based validation here to surface errors inline in the form.

      const stepData = {
        // Provide the full basicDetails object so backend merging is reliable
        basicDetails: updatedBasicDetails,

        // Personal Information (kept for backward compatibility)
        firstName: updatedBasicDetails.firstName,
        lastName: updatedBasicDetails.lastName,
        passportNumber: updatedBasicDetails.passportNumber,
        sex: updatedBasicDetails.sex,
        dateOfBirth: updatedBasicDetails.dateOfBirth,
        placeOfBirth: updatedBasicDetails.placeOfBirth,
        passportIssuePlace: updatedBasicDetails.passportIssuePlace,
        passportIssueDate: updatedBasicDetails.passportIssueDate,
        passportExpiryDate: updatedBasicDetails.passportExpiryDate,

        // Current Address
        currentAddress1: updatedBasicDetails.currentAddress1,
        currentAddress2: updatedBasicDetails.currentAddress2,
        state: updatedBasicDetails.state,
        city: updatedBasicDetails.city,
        pincode: updatedBasicDetails.pincode,
        mobileNumber: updatedBasicDetails.mobileNumber,
        travelStartDate: updatedBasicDetails.travelStartDate,
        travelEndDate: updatedBasicDetails.travelEndDate,

        // Passport Images as base64 strings
        passportFront: passportFrontBase64,
        passportBack: passportBackBase64,

        // Current traveler info
        travelerIndex: travelerIndex,

        // Include updated travelers data to send to backend
        updatedTravelersData: updatedTravelersData,
      };

      console.log("Final stepData being sent:", stepData);
      console.log("Updated travelers data being sent:", updatedTravelersData);
      console.log("=== END PASSPORT SAVE DEBUG ===");

      onComplete(stepData);
    } catch (error) {
      console.error("Error converting files to base64:", error);
    }
  };

  const updateBasicDetails = (data) => {
    console.log("=== UPDATE BASIC DETAILS DEBUG ===");
    console.log("updateBasicDetails called with:", data);
    console.log("Data type:", typeof data);
    console.log("Current traveler index:", travelerIndex);
    console.log(
      "Current traveler data before update:",
      travelerData.basicDetails
    );

    // Handle both function and object updates
    if (typeof data === "function") {
      const updatedData = data(travelerData.basicDetails || {});
      console.log("Function update result:", updatedData);
      console.log("Passport files in update result:");
      console.log("- passportFront:", updatedData.passportFront);
      console.log("- passportFront type:", typeof updatedData.passportFront);
      console.log(
        "- passportFront instanceof File:",
        updatedData.passportFront instanceof File
      );
      console.log("- passportBack:", updatedData.passportBack);
      console.log("- passportBack type:", typeof updatedData.passportBack);
      console.log(
        "- passportBack instanceof File:",
        updatedData.passportBack instanceof File
      );
      updateCurrentTravelerData("basicDetails", updatedData);
    } else {
      console.log("Direct object update:", data);
      console.log("Passport files in direct update:");
      console.log("- passportFront:", data.passportFront);
      console.log("- passportFront type:", typeof data.passportFront);
      console.log("- passportBack:", data.passportBack);
      console.log("- passportBack type:", typeof data.passportBack);
      updateCurrentTravelerData("basicDetails", data);
    }
  };

  return (
    <div>
      <PassportInformationSection
        key={`passport-${travelerIndex}`}
        passportData={travelerData.basicDetails || {}}
        setPassportData={updateBasicDetails}
        travelerIndex={travelerIndex}
        handleSave={handleSave}
      />
    </div>
  );
};

const VisitStep = ({
  travelerIndex,
  travelerData,
  updateCurrentTravelerData,
  validateVisitData,
  onComplete,
  parentVisaApplication,
  setParentVisaApplication,
  loading,
}) => {
  const visitData = travelerData?.visitDetails || {};
  console.log("parentVisaApplication", parentVisaApplication);
  console.log("travelerData", travelerData);

  const setVisitData = (data) => {
    // Handle both function and object updates
    if (typeof data === "function") {
      updateCurrentTravelerData("visitDetails", data(visitData));
    } else {
      updateCurrentTravelerData("visitDetails", data);
    }
  };

  const handleSave = () => {
    console.log("=== HANDLE SAVE - VISIT DETAILS ===");
    console.log("Current visitData from travelerData:", visitData);
    console.log("Raw travelerData.visitDetails:", travelerData?.visitDetails);

    const stepData = {
      // Travel Information (only fields that exist in current form)
      visitingOtherSchengenCountries:
        visitData.visitingOtherSchengenCountries || [],
      firstCountryOfEntry: visitData.firstCountryOfEntry || "",

      // Visa History (always present in form)
      hasSchengenVisa: visitData.hasSchengenVisa || "",
      lastVisaStartDate: visitData.lastVisaStartDate || "",
      lastVisaEndDate: visitData.lastVisaEndDate || "",
      hasDigitalFingerprints: visitData.hasDigitalFingerprints || "",
      previousVisaNumber: visitData.previousVisaNumber || "",

      // Personal Information (always present in form)
      maritalStatus: visitData.maritalStatus || "",
      partnerFullName: visitData.partnerFullName || "",
      partnerDateOfBirth: visitData.partnerDateOfBirth || "",

      // Employment Information (always present in form)
      employmentStatus: visitData.employmentStatus || "",
      // Student fields (conditional)
      institutionName: visitData.institutionName || "",
      instituteEmail: visitData.instituteEmail || "",
      instituteAddress: visitData.instituteAddress || "",
      // Employed fields (conditional)
      employerPhone: visitData.employerPhone || "",
      employerName: visitData.employerName || "",
      employerEmail: visitData.employerEmail || "",
      employerAddress: visitData.employerAddress || "",
      // Other employment (conditional)
      otherEmploymentStatus: visitData.otherEmploymentStatus || "",

      // Payment Information (always present in form)
      willAnyonePayForVisit: visitData.willAnyonePayForVisit || "",
      fundingPersonName: visitData.fundingPersonName || "",
      tripFundedBy: visitData.tripFundedBy || "",

      // Traveler info
      travelerIndex: travelerIndex,
    };

    console.log("Prepared stepData to send to backend:", stepData);
    console.log("About to call onComplete with stepData");
    onComplete(stepData);
  };

  return (
    <div>
      <VisitDetailSection
        key={`visit-${travelerIndex}`}
        visitData={visitData}
        setVisitData={setVisitData}
        parentVisaApplication={parentVisaApplication}
        setParentVisaApplication={setParentVisaApplication}
        onComplete={handleSave}
        loading={loading}
      />
    </div>
  );
};

const DocumentStep = ({
  travelerIndex,
  travelerData,
  updateCurrentTravelerData,
  validateDocuments,
  onComplete,
  loading,
}) => {
  const documents = travelerData.documents?.documents || {};

  const setDocuments = (newDocuments) => {
    // Handle both function and object updates
    if (typeof newDocuments === "function") {
      const updatedDocuments = newDocuments(documents);
      updateCurrentTravelerData("documents", { documents: updatedDocuments });
    } else {
      updateCurrentTravelerData("documents", { documents: newDocuments });
    }
  };

  const handleUploadSuccess = (documentData, docId) => {
    console.log(`Successfully uploaded document: ${documentData.name}`);
  };

  const handleUploadError = (errorMessage) => {
    console.error("Document upload error:", errorMessage);
    // You can add toast notification here if needed, but keeping it simple for now
  };

  const handleSave = () => {
    // Convert documents to the format expected by backend
    const documentsForBackend = {};

    Object.keys(documents).forEach((docId) => {
      const doc = documents[docId];
      if (doc) {
        documentsForBackend[docId] = {
          name: doc.name,
          type: doc.type,
          size: doc.size,
          data: doc.preview, // This is the base64 string
        };
      }
    });

    onComplete({
      documents: documentsForBackend,
      travelerIndex: travelerIndex,
    });
  };

  return (
    <div>
      <DocumentUploadSection
        key={`documents-${travelerIndex}`}
        documents={documents}
        setDocuments={setDocuments}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      {/* Right-aligned Save button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#7350FF] text-white px-4 py-2 rounded hover:bg-[#7350FF] disabled:bg-[#7350FF]/30"
        >
          {loading ? "Saving..." : "Save and Continue"}
        </button>
      </div>
    </div>
  );
};

const InsuranceStep = ({
  travelerIndex,
  travelerData,
  updateCurrentTravelerData,
  onComplete,
  loading,
  parentVisaApplication,
}) => {
  const [uploadedCertificate, setUploadedCertificate] = useState(
    travelerData?.insurance?.insuranceCertificate || null
  );
  const [insuranceError, setInsuranceError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  
  // Initialize payment hook
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } = useCreateDynamicCheckoutSession();

  // Check for completed payment on component mount/update
  useEffect(() => {
    const insurance = travelerData?.insurance || {};
    
    // Auto-update insurance status if payment details exist but status is not "true"
    if (insurance.orderId && insurance.paymentAmount && insurance.insurancePaymentCompleted && insurance.insurance !== "true") {
      console.log("Insurance payment completed, auto-updating status to 'true'");
      updateCurrentTravelerData("insurance", {
        ...insurance,
        insurance: "true" // Auto-set to true when payment is completed
      });
    }
    
    // Also check localStorage for completed insurance payment metadata
    try {
  const storedPayment = localStorage.getItem("insurancePaymentMetadata");
      if (storedPayment) {
        const paymentData = JSON.parse(storedPayment);
        
        // Check if this payment belongs to current traveler
        if (paymentData.travelerIndex === travelerIndex && 
            paymentData.applicationId === parentVisaApplication?.id) {
          
          console.log("Found completed insurance payment in localStorage:", paymentData);
          
          // Update insurance with payment information
          updateCurrentTravelerData("insurance", {
            insurance: "true", // Set to true when payment is completed
            insurancePaymentCompleted: true,
            orderId: paymentData.orderId,
            paymentAmount: paymentData.paymentAmount,
            paymentDate: new Date().toISOString(),
            insuranceDetails: { selected: true },
          });
          
          // Clear the stored payment data
          localStorage.removeItem("insurancePaymentMetadata");
        }
      }
    } catch (error) {
      console.error("Error checking completed insurance payment:", error);
    }
  }, [travelerData?.insurance, travelerIndex, parentVisaApplication?.id]);

  const handleCertificateUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const certificateData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
        };

        setUploadedCertificate(certificateData);

        // Update traveler's insurance data with certificate
        updateCurrentTravelerData("insurance", {
          insurance: "own",
          insuranceDetails: {
            hasOwnInsurance: true,
            certificateUploaded: true,
          },
          insuranceCertificate: certificateData,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewDocument = () => {
    if (uploadedCertificate) {
      window.open(uploadedCertificate.data, "_blank");
    }
  };

  const handleDownloadDocument = () => {
    if (uploadedCertificate) {
      const link = document.createElement("a");
      link.href = uploadedCertificate.data;
      link.download = uploadedCertificate.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRemoveDocument = () => {
    setUploadedCertificate(null);
    updateCurrentTravelerData("insurance", {
      insurance: "",
      insuranceDetails: null,
      insuranceCertificate: null,
    });
  };

  const handleSave = () => {
    setInsuranceError("");
    
    const currentInsurance = travelerData?.insurance || {};
    
    // For 'own' insurance we require a certificate
    if (currentInsurance.insurance === "own" && !uploadedCertificate) {
      setInsuranceError("Please upload your insurance certificate.");
      return;
    }

    // If insurance is completed via payment, auto-set to "true"
    let insuranceToSave = currentInsurance;
    if (currentInsurance.orderId && currentInsurance.paymentAmount && currentInsurance.insurancePaymentCompleted) {
      insuranceToSave = {
        ...currentInsurance,
        insurance: "true" // Ensure status is "true" for completed payments
      };
      
      // Update local state as well
      updateCurrentTravelerData("insurance", insuranceToSave);
    }

    // Build payload similar to previous behavior
    const saveData = {
      insurance: insuranceToSave.insurance || "",
      travelerIndex: travelerIndex,
      insuranceData: {
        insurance: insuranceToSave.insurance || "",
        insuranceDetails: insuranceToSave.insuranceDetails || (uploadedCertificate ? { hasOwnInsurance: true, certificateUploaded: true } : null),
        insuranceCertificate: uploadedCertificate || insuranceToSave.insuranceCertificate || null,
        insurancePaymentCompleted: insuranceToSave.insurancePaymentCompleted || false,
        orderId: insuranceToSave.orderId || null,
        paymentAmount: insuranceToSave.paymentAmount || null,
        paymentDate: insuranceToSave.paymentDate || null,
      },
    };

    console.log("Saving insurance data:", saveData);
    onComplete && onComplete(saveData);
  };

  const isUploaded = !!uploadedCertificate || !!travelerData?.insurance?.insuranceCertificate;
  const completedCount = isUploaded ? 1 : 0;
  const totalCount = 1;

  // Calculate days fallback
  const calculateInsuranceDays = () => {
    try {
      const start = travelerData?.basicDetails?.travelStartDate;
      const end = travelerData?.basicDetails?.travelEndDate;
      const normalize = (d) => {
        if (!d) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d);
        return new Date(d);
      };
      const s = normalize(start);
      const e = normalize(end);
      if (s && e && !isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
      }
    } catch (e) {
      // ignore and fallback
    }
    return 30;
  };

  // Inline insurance payment (2 GBP/day + 5% service fee) - redirect to Stripe
  const handleInsurancePay = async () => {
    setIsPaying(true);
    setPaymentError("");
    
    try {
  const days = calculateInsuranceDays();
  const perDayGBP = 2;
  const baseAmountGBP = days * perDayGBP;
  // No service fee - charge base amount only
  const totalWithFee = Math.round(baseAmountGBP * 100) / 100;

      // Generate order ID for tracking
      const orderId = `ORD${String(Math.floor(Math.random() * 900000) + 100000)}`;

      console.log("=== INSURANCE PAYMENT DEBUG ===");
      console.log("Travel days:", days);
      console.log("Base amount:", baseAmountGBP);
      console.log("Total with fee:", totalWithFee);
      console.log("Order ID:", orderId);
      console.log("Application ID:", parentVisaApplication?.id);
      console.log("Traveler index:", travelerIndex);

      // Get user email (assume it's available in application or traveler data)
      const userEmail = parentVisaApplication?.email || 
                       travelerData?.basicDetails?.email || 
                       "user@example.com"; // fallback

      // Create Stripe payment session for insurance
      const paymentResponse = await handleCreateDynamicCheckoutSession({
        email: userEmail,
        // amount is the value used for Stripe checkout (converted to INR),
        // include amountGBP separately so webhook / test endpoints can validate against the base GBP amount
        amount: calculatePaymentFees(totalWithFee,"EUR","INR")?.toString(), // Convert to string for API (Stripe currency)
        amountGBP: totalWithFee.toString(), // Base GBP amount for backend validation
        travellers: "1", // This is for insurance payment, always 1
        country: parentVisaApplication?.country || "United Kingdom",
        insurance: "purchase",
        applicationId: parentVisaApplication?.id || "",
        travelerIndex: travelerIndex.toString(), // Convert to string for API
        paymentType: "traveler_insurance", // This matches the hook's payment types
        visaTypeId: parentVisaApplication?.visaTypeId || "",
        currency: "GBP",
      });

      console.log("Payment session response:", paymentResponse);

      // If successful, redirect to Stripe checkout
      if (paymentResponse?.data?.data?.results?.url) {
        const checkoutUrl = paymentResponse.data.data.results.url;
        console.log("Redirecting to Stripe checkout:", checkoutUrl);
        
        // Store order ID and payment metadata in localStorage for when user returns
        const insurancePaymentMetadata = {
          orderId,
          paymentAmount: totalWithFee,
          travelerIndex,
          applicationId: parentVisaApplication?.id,
          paymentType: "traveler_insurance",
          timestamp: Date.now(),
        };
  localStorage.setItem("insurancePaymentMetadata", JSON.stringify(insurancePaymentMetadata));
        
        // Redirect to Stripe
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Failed to create payment session - no checkout URL received");
      }

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
      {/* Insurance Selection */}
      <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
        <h3 className="text-white font-gilroy-bold text-lg mb-4">
          Travel Insurance
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          Travel insurance is required for your visa application. Choose one of the options below:
        </p>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
            <input
              type="radio"
              name="insuranceType"
              value="own"
              checked={travelerData?.insurance?.insurance === "own"}
              onChange={(e) => {
                updateCurrentTravelerData("insurance", {
                  insurance: "own",
                  insuranceDetails: null,
                  insuranceCertificate: null,
                  insurancePaymentCompleted: false,
                  orderId: null,
                  paymentAmount: null,
                  paymentDate: null,
                });
              }}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="text-white font-medium">I have my own insurance</div>
              <div className="text-sm text-gray-400">Upload your existing travel insurance certificate</div>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
            <input
              type="radio"
              name="insuranceType"
              value="purchase"
              checked={travelerData?.insurance?.insurance === "purchase"}
              onChange={(e) => {
                updateCurrentTravelerData("insurance", {
                  insurance: "purchase",
                  insuranceDetails: null,
                  insuranceCertificate: null,
                  insurancePaymentCompleted: false,
                  orderId: null,
                  paymentAmount: null,
                  paymentDate: null,
                });
              }}
              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
            />
              <div className="flex-1">
              <div className="text-white font-medium">Purchase insurance through us</div>
              <div className="text-sm text-gray-400">£2 per day • Instant coverage</div>
            </div>
          </label>
        </div>
      </div>

      {/* Show appropriate section based on selection */}
      {travelerData?.insurance?.insurance === "own" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1  1h-12a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Upload Insurance Certificate
              </h3>
              <span className="text-sm text-gray-500">
                {completedCount} / {totalCount}
              </span>
            </div>
          </div>

          {/* Insurance Certificate Upload */}
          <div className="p-6 border border-gray-700 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 max-w-56 w-full">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isUploaded ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                {isUploaded ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                )}
              </div>
              <h4 className="text-base font-semibold text-gray-100 w-full">
                Insurance Certificate
              </h4>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Upload your existing insurance certificate document (PDF, JPG, PNG up
              to 10MB)
            </p>
            <div className="flex-1"></div>
          </div>

          <div className="self-start">
            <input
              type="file"
              onChange={handleCertificateUpload}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              id="insurance-upload"
            />
            <label
              htmlFor="insurance-upload"
              className="bg-purple-600 text-white font-semibold px-6 py-2.5 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
            >
              Upload
            </label>
          </div>
        </div>

        {isUploaded && (
          <div className="flex items-center justify-between pl-12 mt-4 bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-300 font-medium">
              {(uploadedCertificate || travelerData?.insurance?.insuranceCertificate)
                ?.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewDocument}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                title="View document"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDownloadDocument}
                className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                title="Download document"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
              <button
                onClick={handleRemoveDocument}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove document"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
          </div>

          {/* Error message */}
          {insuranceError && (
            <p className="text-red-400 text-sm mt-2">{insuranceError}</p>
          )}

          {/* Save button for own insurance */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#7350FF] text-white px-4 py-2 rounded hover:bg-[#7350FF] disabled:bg-[#7350FF]/30"
            >
              {loading ? "Saving..." : "Save and Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Purchase Insurance Section */}
      {travelerData?.insurance?.insurance === "purchase" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Purchase Travel Insurance
              </h3>
            </div>
          </div>

          {!travelerData?.insurance?.insurancePaymentCompleted ? (
            <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
              <div className="text-sm text-gray-300 mb-4">
                Complete your insurance purchase to continue
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Travel days</span>
                  <span className="text-white font-medium">{calculateInsuranceDays()} day(s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Price per day</span>
                  <span className="text-white font-medium">£2.00</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total amount</span>
                    <span className="text-white font-semibold">£{(calculateInsuranceDays() * 2).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {paymentError && (
                <p className="text-red-400 text-sm mb-4">{paymentError}</p>
              )}
              
              <button
                onClick={handleInsurancePay}
                disabled={isPaying || cretingDynamicCheckout}
                className="w-full bg-[#28A745] text-white py-3 px-4 rounded-md hover:bg-[#218838] disabled:opacity-60 font-medium"
              >
                {isPaying || cretingDynamicCheckout
                  ? "Redirecting to Payment..."
                  : `Pay Insurance (£${(calculateInsuranceDays() * 2).toFixed(2)})`}
              </button>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold">Payment Complete</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Order ID:</span>
                  <span className="text-white font-medium">{travelerData?.insurance?.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Amount paid:</span>
                  <span className="text-white font-medium">£{travelerData?.insurance?.paymentAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Payment date:</span>
                  <span className="text-white font-medium">
                    {travelerData?.insurance?.paymentDate ? new Date(travelerData.insurance.paymentDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#7350FF] text-white px-4 py-2 rounded hover:bg-[#7350FF] disabled:bg-[#7350FF]/30"
                >
                  {loading ? "Saving..." : "Continue"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show message if no insurance option selected */}
      {!travelerData?.insurance?.insurance && (
        <div className="text-center py-8">
          <p className="text-gray-400">Please select an insurance option above to continue.</p>
        </div>
      )}
    </div>
  );
};/* Small Icon Components */
const LockIcon = () => (
  <svg
    className="w-5 h-5 text-gray-300"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg
    className="w-5 h-5 text-gray-300"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default MultiStepAccordion;
