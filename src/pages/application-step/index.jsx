import {
  getVisaApplication,
  createOrUpdateApplication,
} from "@/api/visaApplications";
import ApplicationCompletedSection from "@/components/ApplicationCompletedSection";
import DocumentUploadSection from "@/components/DocumentUploadSection";
import { Header } from "@/components/layout/Header";
import PassportInformationSection from "@/components/PassportInformationSection";
import PaymentSection from "@/components/PaymentSection";
import ProgressHeader from "@/components/ProgressHeader";
import VisitDetailSection from "@/components/VisitDetailSection";
import ClientOnly from "@/components/ClientOnly";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { useAppSelector, useAppDispatch } from "@/store";
import { setInsuranceFees, setTravelers } from "@/store/visaSlice";
import { COUNTRY_CONFIG } from "@/constants/countryConfig";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import BookingAppointment from "@/components/BookingAppointment";

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
          slot: ""
        },
        preference2: {
          city: "",
          dateRangeStart: null,
          dateRangeEnd: null,
          slot: ""
        }
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
        teleportFee: 1524.60,
        cgst: 137.20,
        sgst: 137.20,
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
      id: 6,
      title: "Payment",
      completed: false,
      open: false,
      stepType: "payment",
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
        const isCompleted = relevantStepInfo.completedSteps?.includes(step.stepType);
        const isCurrentFromServer = relevantStepInfo.currentStep === step.stepType;
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
      travelerInsuranceObj.insurance === "true" || travelerInsuranceObj.insurance === true;
    const insuranceDetailsSelected =
      travelerInsuranceObj.insuranceDetails?.selected === true ||
      travelerInsuranceObj.insuranceDetails?.hasOwnInsurance === true;
    const insuranceSelectedPurchaseOrOwn =
      travelerInsuranceObj.insurance === "purchase" || travelerInsuranceObj.insurance === "own";

    const computedRequiresInsurance =
      insuranceFlagTrue || insuranceDetailsSelected || insuranceSelectedPurchaseOrOwn;

    const travelerRequiresInsurance =
      currentTravelerStepInfo?.requiresInsurance || computedRequiresInsurance || false;
    const travelerHasInsurance = currentTravelerStepInfo?.hasInsurance || false;
    const isAdditionalTraveler =
      currentTravelerStepInfo?.isAdditionalTraveler || false;

    // console.log("Traveler insurance status:", {
    //   requiresInsurance: travelerRequiresInsurance,
    //   hasInsurance: travelerHasInsurance,
    //   isAdditionalTraveler: isAdditionalTraveler,
    //   isTravelerCompleted: isTravelerCompleted,
    // });

    // If traveler has insurance and doesn't need insurance step, hide insurance step completely
    if (travelerHasInsurance && !travelerRequiresInsurance) {
      // Remove insurance step for travelers who already have insurance
      visibleSteps = visibleSteps.filter(
        (step) => step.stepType !== "insurance"
      );

      // Always show completion step for these travelers (they have 4 steps total: basic, visit, documents, completed)
      visibleSteps = visibleSteps.map((step) => {
        if (step.stepType === "completed") {
          return {
            ...step,
            title: "Application Completed",
            completed: isTravelerCompleted,
            open:
              
              currentTravelerStepInfo?.currentStep === "completed",
          };
        }
        return step;
      });
    } else {
      // For travelers who need insurance, show all 5 steps including insurance and completion
      if (travelerRequiresInsurance) {
        // Update insurance step title for additional travelers
        visibleSteps = visibleSteps.map((step) => {
          if (step.stepType === "insurance") {
            return {
              ...step,
              title: isAdditionalTraveler
                ? "Insurance (Additional Traveler)"
                : "Insurance",
            };
          }
          return step;
        });
      }

      // Always show completion step (5th step) for travelers with insurance pending
      visibleSteps = visibleSteps.map((step) => {
        if (step.stepType === "completed") {
          return {
            ...step,
            title: "Application Completed",
            completed: isTravelerCompleted,
            open:
             
              currentTravelerStepInfo?.currentStep === "completed",
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
          slot: ""
        },
        preference2: {
          city: "",
          dateRangeStart: null,
          dateRangeEnd: null,
          slot: ""
        }
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
        teleportFee: 1524.60,
        cgst: 137.20,
        sgst: 137.20,
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
      console.log("Updated travelers data:", updated);
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
            slot: ""
          },
          preference2: {
            city: "",
            dateRange: "",
            slot: ""
          }
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
        console.log("🔥 APPOINTMENT DATA MERGE - CONDITION MET!");
        console.log("stepId:", stepId, "step.stepType:", step?.stepType);
        console.log("Appointment data to merge:", stepData.appointmentData);

        // Update the current traveler's appointment data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedTraveler = {
              ...traveler,
              appointment: stepData.appointmentData,
            };
            console.log("Updated traveler appointment:", updatedTraveler.appointment);
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
        console.log("🔥 BASIC DETAILS DATA MERGE - CONDITION MET!");
        console.log("stepId:", stepId, "step.stepType:", step?.stepType);
        console.log("Basic details data to merge:", stepData.basicDetails);

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
            console.log("Updated traveler basic details:", updatedTraveler.basicDetails);
            return updatedTraveler;
          }
          return traveler;
        });
      }

      // Special handling for insurance step data
      if (
        (stepId === "insurance" ||
          stepId === 5 ||
          step?.stepType === "insurance") &&
        stepData.insuranceData
      ) {
        console.log("🔥 INSURANCE DATA MERGE - CONDITION MET!");
        console.log("stepId:", stepId, "step.stepType:", step?.stepType);
        console.log("Insurance data to merge:", stepData.insuranceData);

        // Update the current traveler's insurance data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedTraveler = {
              ...traveler,
              insurance: stepData.insuranceData,
            };
            console.log(
              "Updated traveler insurance:",
              updatedTraveler.insurance
            );
            return updatedTraveler;
          }
          return traveler;
        });
      } else {
        console.log("❌ INSURANCE DATA MERGE - CONDITION NOT MET");
        console.log("stepId:", stepId, "step.stepType:", step?.stepType);
        console.log("Has insuranceData:", !!stepData.insuranceData);
      }

      console.log("=== HANDLE COMPLETE STEP DEBUG ===");
      console.log("Step ID:", stepId);
      console.log("Step Data:", stepData);
      console.log("Using travelers data:", travelersDataToSend);
      console.log("=== END HANDLE COMPLETE STEP DEBUG ===");

      // Build payload but exclude appointmentData (we already merged it into travelersDataToSend)
      const stepDataForPayload = { ...stepData };
      // Remove keys that should not be sent at top-level
      delete stepDataForPayload.appointmentData;
      delete stepDataForPayload.updatedTravelersData;
      delete stepDataForPayload.insuranceData;

      // Backend expects one of: createApplication, basicDetails, visitDetails, documents, insurance
      const allowedTypes = [
        "createApplication",
        "basicDetails",
        "visitDetails",
        "documents",
        "insurance",
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

      console.log(`Payload type resolved: ${typeToSend} (original: ${step.stepType})`);

      const payload = {
        type: step.stepType,
        applicationId: applicationId,
        currentTravelerIndex: currentTravelerIndex,
        travelersData: travelersDataToSend,
        numberOfTravellers: numberOfTravelers,
        ...stepDataForPayload,
      };

      const response = await createOrUpdateApplication(token, payload);

      if (response?.status >= 200 && response?.status < 300) {
        // Get updated traveler data from response
        const updatedApplication = response?.data?.data?.results?.application;

        if (updatedApplication?.travelersData) {
          try {
            const updatedTravelersData = Array.isArray(
              updatedApplication.travelersData
            )
              ? updatedApplication.travelersData
              : JSON.parse(updatedApplication.travelersData);

            // Update local travelers data with backend response
            setTravelersData(updatedTravelersData);

            // Update travelers step info from backend response
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


        const completedStepIndex = steps.findIndex((s) => s.id === step.id);

        if (completedStepIndex !== -1 && completedStepIndex < steps.length - 1) {
          const nextStep = steps[completedStepIndex + 1];
          
          toggleStep(nextStep.id);
        }
      } else {
        // Handle API error responses
        const errorMessage = response?.data?.message || 
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
              setTravelersData(savedTravelersData);
              setNumberOfTravelers(savedTravelersData.length);

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
              showError("Failed to load application data. Please refresh the page.");
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
        const errorMessage = response?.data?.message || 
                            response?.data?.error || 
                            "Failed to load application. Please try again.";
        showError(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      showError("Failed to load application. Please check your connection and try again.");
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

                    {step.id === 6 && step.stepType === "payment" && (
                      <PaymentStep
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
                          const documentsStep = steps.find(s => s.stepType === "documents");
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
        console.log("File details - name:", file.name, "size:", file.size, "type:", file.type);
        const reader = new FileReader();
        reader.onload = () => {
          console.log("FileReader onload - result length:", reader.result?.length);
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

      const stepData = {
        // Personal Information
        firstName: basicDetails.firstName,
        lastName: basicDetails.lastName,
        passportNumber: basicDetails.passportNumber,
        sex: basicDetails.sex,
        dateOfBirth: basicDetails.dateOfBirth,
        placeOfBirth: basicDetails.placeOfBirth,
        passportIssuePlace: basicDetails.passportIssuePlace,
        passportIssueDate: basicDetails.passportIssueDate,
        passportExpiryDate: basicDetails.passportExpiryDate,

        // Current Address
        currentAddress1: basicDetails.currentAddress1,
        currentAddress2: basicDetails.currentAddress2,
        state: basicDetails.state,
        city: basicDetails.city,
        pincode: basicDetails.pincode,

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
      console.log("- passportFront instanceof File:", updatedData.passportFront instanceof File);
      console.log("- passportBack:", updatedData.passportBack);
      console.log("- passportBack type:", typeof updatedData.passportBack);
      console.log("- passportBack instanceof File:", updatedData.passportBack instanceof File);
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

     console.log(`Successfully uploaded document: ${documentData.name}`)
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
      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-4 bg-[#7350FF] text-white px-4 py-2 rounded hover:bg-[#7350FF] disabled:bg-[#7350FF]/30"
      >
        {loading ? "Saving..." : "Save and Continue"}
      </button>
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
          insuranceDetails: { hasOwnInsurance: true, certificateUploaded: true },
          insuranceCertificate: certificateData,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!uploadedCertificate) {
      alert("Please upload your insurance certificate");
      return;
    }

    const saveData = {
      insurance: "own",
      travelerIndex: travelerIndex,
      insuranceData: {
        insurance: "own",
        insuranceDetails: { hasOwnInsurance: true, certificateUploaded: true },
        insuranceCertificate: uploadedCertificate,
      },
    };

    console.log("Saving insurance data:", saveData);
    onComplete && onComplete(saveData);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Upload Insurance Certificate</h3>
        </div>
      </div>

      {/* Document Upload Section */}
      <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
        <h4 className="text-white font-gilroy-bold text-lg mb-4">Insurance Certificate</h4>
        <p className="text-gray-300 mb-4">Upload your existing insurance certificate document</p>
        
        <div className="border-2 border-dashed border-[#423577] rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleCertificateUpload}
            className="hidden"
            id="insurance-upload"
          />
          <label
            htmlFor="insurance-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-white font-medium">Click to upload insurance certificate</span>
            <span className="text-gray-400 text-sm mt-1">PDF, JPG, PNG up to 10MB</span>
          </label>
        </div>

        {uploadedCertificate && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-400 font-medium">Certificate uploaded: {uploadedCertificate.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading || !uploadedCertificate}
        className="w-full bg-[#7350FF] text-white py-3 px-4 rounded-md hover:bg-[#6350E5] disabled:bg-[#7350FF]/30 font-medium"
      >
        {loading ? "Saving..." : uploadedCertificate ? "Save Insurance Certificate" : "Upload Certificate First"}
      </button>
    </div>
  );
};

const PaymentStep = ({
  travelerIndex,
  travelerData,
  updateCurrentTravelerData,
  onComplete,
  loading,
  parentVisaApplication,
}) => {
  // Calculate fees properly
  const appointmentFees = 2060;
  const teleportFeeBase = 1524.60;
  const cgstRate = 0.09; // 9%
  const sgstRate = 0.09; // 9%
  const cgstAmount = Math.round(teleportFeeBase * cgstRate * 100) / 100;
  const sgstAmount = Math.round(teleportFeeBase * sgstRate * 100) / 100;
  const teleportFeeTotal = Math.round((teleportFeeBase + cgstAmount + sgstAmount) * 100) / 100;
  const baseGrandTotal = appointmentFees + teleportFeeTotal;

  // Initialize payment data from traveler if available
  const initialPayment = travelerData?.payment || {};
  const [paymentData, setPaymentData] = useState({
    appointmentFees: initialPayment.appointmentFees || appointmentFees,
    teleportFee: initialPayment.teleportFee || teleportFeeBase,
    cgst: initialPayment.cgst || cgstAmount,
    sgst: initialPayment.sgst || sgstAmount,
    teleportFeeTotal: initialPayment.teleportFeeTotal || teleportFeeTotal,
    grandTotal: initialPayment.grandTotal || baseGrandTotal,
    paymentStatus: initialPayment.paymentStatus || "pending",
    paymentMethod: initialPayment.paymentMethod || "",
    couponCode: initialPayment.couponCode || "",
    discountAmount: initialPayment.discountAmount || 0,
  });
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [couponCode, setCouponCode] = useState(paymentData.couponCode || "");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentVerificationSent, setStudentVerificationSent] = useState(false);
  const [studentOtp, setStudentOtp] = useState("");
  const [studentVerified, setStudentVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    const updatedPaymentData = { ...paymentData, paymentMethod: method };
    setPaymentData(updatedPaymentData);
    updateCurrentTravelerData("payment", updatedPaymentData);
  };

  const handleCouponApply = () => {
    // Apply coupon logic locally - prefer backend validation in production
    const code = (couponCode || "").trim().toLowerCase();
    let discount = 0;

    if (!code) {
      showToast("Please enter a coupon code to apply");
      return;
    }

    // Supported coupons:
    // 'save10' -> 10% off immediately
    // 'group20' -> 20% off but only valid when numberOfTravelers >= 3
    // 'student10' -> reserved for students, requires verification via email (handled via separate flow)
    if (code === "save10") {
      discount = Math.round(baseGrandTotal * 0.1 * 100) / 100;
    } else if (code === "group20") {
      if (numberOfTravelers >= 3) {
        discount = Math.round(baseGrandTotal * 0.2 * 100) / 100;
      } else {
        showToast("GROUP20 requires 3 or more travellers");
        return;
      }
    } else {
      // unknown coupon
      showToast("Invalid coupon code");
      return;
    }

    const finalGrandTotal = Math.round((baseGrandTotal - discount) * 100) / 100;
    const updatedPaymentData = {
      ...paymentData,
      couponCode: code,
      discountAmount: discount,
      grandTotal: finalGrandTotal,
    };

    setPaymentData(updatedPaymentData);
    updateCurrentTravelerData("payment", updatedPaymentData);
    showToast(`Coupon applied: -₹${discount}`);
  };

  // Student verification flows - calls local API to send and verify codes
  const sendStudentVerification = async () => {
    const email = (studentEmail || "").trim();
    if (!email) {
      showToast("Please enter your student email");
      return;
    }
    setIsSendingVerification(true);
    try {
      const res = await fetch("/api/student/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentVerificationSent(true);
        showToast("Verification email sent. Check your inbox (or debug response in dev).");
      } else {
        showToast(data?.error || "Failed to send verification email");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to send verification email");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const verifyStudentCode = async () => {
    const email = (studentEmail || "").trim();
    const code = (studentOtp || "").trim();
    if (!email || !code) {
      showToast("Please provide email and verification code");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/student/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data?.verified) {
        setStudentVerified(true);
        // Apply 10% student discount
        const discount = Math.round(baseGrandTotal * 0.1 * 100) / 100;
        const finalGrandTotal = Math.round((baseGrandTotal - discount) * 100) / 100;
        const updatedPaymentData = {
          ...paymentData,
          couponCode: "student10",
          discountAmount: discount,
          grandTotal: finalGrandTotal,
        };
        setPaymentData(updatedPaymentData);
        updateCurrentTravelerData("payment", updatedPaymentData);
        showToast(`Student verified — 10% applied: -₹${discount}`);
      } else {
        showToast(data?.error || "Invalid or expired code");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to verify code");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    const updatedPaymentData = {
      ...paymentData,
      paymentStatus: "completed",
    };
    
    setPaymentData(updatedPaymentData);
    updateCurrentTravelerData("payment", updatedPaymentData);
    onComplete && onComplete({ paymentData: updatedPaymentData });
  };

  return (
    <div className="space-y-6">
      {/* Main Content Container */}
      <div className="flex gap-6">
        {/* Left Side - Payment Method Selection */}
        <div className="flex-1">
          <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
            <h4 className="text-white font-gilroy-bold text-lg mb-4">Select a plan type</h4>
            
            <div className="space-y-3">
              {/* Collapsible plan item (accordion-like) */}
              <div className={`border-2 rounded-lg p-2 transition-all ${isPlanOpen ? "border-[#7350FF] bg-[#7350FF]/8" : "border-[#423577]"}`}>
                <div className="flex items-center justify-between p-3 cursor-pointer" onClick={
                  () => setSelectedPaymentMethod("full") 
                }>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === "full" ? "border-[#7350FF]" : "border-gray-400"}`}>
                      {selectedPaymentMethod === "full" && (
                        <div className="w-3 h-3 bg-[#7350FF] rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">Full payment</div>
                      <div className="text-white font-gilroy-bold text-xl">₹{paymentData.grandTotal}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    Pay nothing later
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Payment Summary */}
        <div className="w-80">
          <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6">
            <h4 className="text-white font-gilroy-bold text-lg mb-4">Summary</h4>
            
            {/* Coupon Code */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Apply coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#292933] border border-[#423577] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-[#6366F1] placeholder-gray-400"
                />
                <button
                  onClick={handleCouponApply}
                  className="bg-[#423577] border border-[#423577] text-white px-4 py-2 rounded-lg hover:bg-[#353540] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Student verification (optional) */}
            <div className="mb-6 border-t border-[#423577] pt-4">
              <div className="text-sm text-gray-300 mb-2">Student? Add your student email, we'll send a verification email there.</div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Student email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="flex-1 bg-[#292933] border border-[#423577] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-[#6366F1] placeholder-gray-400"
                />
                <button
                  onClick={sendStudentVerification}
                  disabled={isSendingVerification || studentVerificationSent}
                  className="bg-[#423577] border border-[#423577] text-white px-4 py-2 rounded-lg hover:bg-[#353540] transition-colors"
                >
                  {isSendingVerification ? "Sending..." : studentVerificationSent ? "Sent" : "Send"}
                </button>
              </div>

              {studentVerificationSent && !studentVerified && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={studentOtp}
                    onChange={(e) => setStudentOtp(e.target.value)}
                    className="flex-1 bg-[#292933] border border-[#423577] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-[#6366F1] placeholder-gray-400"
                  />
                  <button
                    onClick={verifyStudentCode}
                    disabled={isVerifyingOtp}
                    className="bg-[#22c55e] border border-[#22c55e] text-black px-4 py-2 rounded-lg hover:bg-[#16a34a] transition-colors"
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify"}
                  </button>
                </div>
              )}

              {studentVerified && (
                <div className="mt-3 text-sm text-green-400">Student verified — 10% discount applied.</div>
              )}
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">Appointment fees</span>
                <span className="text-white font-medium">₹{paymentData.appointmentFees}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">₹{paymentData.appointmentFees} (per traveller) x 1</span>
                <span className="text-white"></span>
              </div>
              
              <div className="border-t border-[#423577] pt-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-medium">Teleport fee</span>
                    <span className="text-white font-medium">₹{paymentData.teleportFeeTotal}</span>

                  </div>
                </div>
                <div className="ml-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teleport fee</span>
                    <span className="text-gray-300">₹{paymentData.teleportFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CGST (9%)</span>
                    <span className="text-gray-300">₹{paymentData.cgst}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">SGST (9%)</span>
                    <span className="text-gray-300">₹{paymentData.sgst}</span>
                  </div>
                </div>
              </div>
              
              {paymentData.discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-400 border-t border-[#423577] pt-3">
                  <span>Discount ({couponCode})</span>
                  <span>-₹{paymentData.discountAmount}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t border-[#423577] pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white font-gilroy-bold text-lg">Grand Total</span>
                <span className="text-white font-gilroy-bold text-lg">₹{paymentData.grandTotal}</span>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading || !selectedPaymentMethod}
              className="w-full bg-[#7350FF] text-white py-3 px-4 rounded-md hover:bg-[#6350E5] disabled:bg-[#7350FF]/30 font-medium text-lg"
            >
              {loading ? "Processing..." : `Pay ₹${paymentData.grandTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Small Icon Components */
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
