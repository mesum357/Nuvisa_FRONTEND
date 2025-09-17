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
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";

const MultiStepAccordion = () => {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("application_id");
  const visaState = useAppSelector((state) => state.visa);
  const dispatch = useAppDispatch();

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
      // Note: Step tracking moved to stepInfo object only - no more redundant currentStep/completedSteps
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
      id: 3,
      title: "Upload your visa documents",
      completed: false,
      open: false,
      stepType: "documents",
    },
    {
      id: 4,
      title: "Insurance",
      completed: false,
      open: false,
      stepType: "insurance",
    },
    {
      id: 5,
      title: "Application Completed",
      completed: false,
      open: false,
      stepType: "completed",
    },
  ]);

  // const [documents, setDocuments] = useState({});

  // Map step info to UI steps - now uses current traveler's step info
  const updateStepsFromStepInfo = (stepInfo = null) => {
    // Use provided stepInfo or get current traveler's step info
    const relevantStepInfo = stepInfo || getCurrentTravelerStepInfo();
    if (!relevantStepInfo) return;

    const stepMapping = {
      basicDetails: 1,
      visitDetails: 2,
      documents: 3,
      insurance: 4,
      completed: 5,
    };

    setSteps((prev) =>
      prev.map((step) => {
        const isCompleted = relevantStepInfo.completedSteps?.includes(
          step.stepType
        );
        const isCurrent = relevantStepInfo.currentStep === step.stepType;
        const isNext = relevantStepInfo.nextStep === step.stepType;

        return {
          ...step,
          completed: isCompleted,
          open: isCurrent || isNext,
        };
      })
    );
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
    const travelerRequiresInsurance =
      currentTravelerStepInfo?.requiresInsurance || false;
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
              isTravelerCompleted ||
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
              isTravelerCompleted ||
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
        totalSteps: 4,
        stepNames: {
          createApplication: "Application Created",
          basicDetails: "Basic Details",
          visitDetails: "Visit Details",
          documents: "Documents Upload",
          insurance: "Insurance",
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
        totalSteps: 4,
        stepNames: {
          createApplication: "Application Created",
          basicDetails: "Basic Details",
          visitDetails: "Visit Details",
          documents: "Documents Upload",
          insurance: "Insurance",
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

      // Special handling for insurance step data
      if (
        (stepId === "insurance" ||
          stepId === 4 ||
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

      const payload = {
        type: step.stepType,
        applicationId: applicationId,
        currentTravelerIndex: currentTravelerIndex,
        travelersData: travelersDataToSend, // Send updated travelers data
        numberOfTravellers: numberOfTravelers,
        ...stepData,
      };

      // Remove the updatedTravelersData and insuranceData from stepData to avoid duplication
      delete payload.updatedTravelersData;
      delete payload.insuranceData;

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
          }
        }

        // Update UI steps based on current traveler's updated step info
        updateStepsFromStepInfo();

        // Refresh application data
        await fetchApplicationById();
      }
    } catch (error) {
      console.error("Error completing step:", error);
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
    const requiredDocIds = [1, 2, 5];
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
                    totalSteps: 4,
                    stepNames: {
                      createApplication: "Application Created",
                      basicDetails: "Basic Details",
                      visitDetails: "Visit Details",
                      documents: "Documents Upload",
                      insurance: "Insurance",
                    },
                  };
                }
              });
              setTravelersStepInfo(initialTravelersStepInfo);
            } catch (error) {
              console.error("Error parsing travelersData:", error);
            }
          }

          // Also update number of travelers from application data if available
          if (applicationData.numberOfTravellers) {
            setNumberOfTravelers(applicationData.numberOfTravellers);
            // Update Redux store to sync with loaded application data
            dispatch(setTravelers(applicationData.numberOfTravellers));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching application:", error);
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

                    {step.id === 2 && (
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

                    {step.id === 3 && (
                      <DocumentStep
                        travelerIndex={currentTravelerIndex}
                        travelerData={getCurrentTravelerData()}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        validateDocuments={validateDocuments}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                      />
                    )}

                    {step.id === 4 && step.stepType === "insurance" && (
                      <InsuranceStep
                        travelerIndex={currentTravelerIndex}
                        travelerData={getCurrentTravelerData()}
                        updateCurrentTravelerData={updateCurrentTravelerData}
                        onComplete={(data) => handleCompleteStep(step.id, data)}
                        loading={loading}
                        parentVisaApplication={parentVisaApplication}
                      />
                    )}

                    {step.id === 4 && step.stepType === "completed" && (
                      <ApplicationCompletedSection />
                    )}

                    {step.stepType === "completed" && step.id === 5 && (
                      <ApplicationCompletedSection />
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
      if (!file) {
        resolve(null);
        return;
      }

      // If it's already a base64 string, return it as is
      if (typeof file === "string" && file.startsWith("data:")) {
        resolve(file);
        return;
      }

      // If it's a File object, convert it to base64
      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
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
    console.log("updateBasicDetails called with:", data);
    console.log("Current traveler index:", travelerIndex);
    console.log(
      "Current traveler data before update:",
      travelerData.basicDetails
    );

    // Handle both function and object updates
    if (typeof data === "function") {
      const updatedData = data(travelerData.basicDetails || {});
      console.log("Function update result:", updatedData);
      updateCurrentTravelerData("basicDetails", updatedData);
    } else {
      console.log("Direct object update:", data);
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
  const visaState = useAppSelector((state) => state.visa);
  const insuranceFee = visaState.insuranceFees || 0; // Will be set dynamically based on selected country

  const [selectedInsurance, setSelectedInsurance] = useState(
    travelerData?.insurance?.insurance || ""
  );
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [uploadedCertificate, setUploadedCertificate] = useState(
    travelerData?.insurance?.insuranceCertificate || null
  );
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();

  // Get current traveler's step info to check if they're additional traveler
  const stepInfo = travelerData?.stepInfo || {};
  const isAdditionalTraveler = stepInfo.isAdditionalTraveler || false;
  const requiresInsurance = stepInfo.requiresInsurance || false;
  const hasInsurance = stepInfo.hasInsurance || false;

  // Check if this traveler needs to pay for insurance
  const needsInsurancePayment = selectedInsurance === "true";

  const handleInsuranceSelection = (value) => {
    setSelectedInsurance(value);
    // Update traveler's insurance data locally
    updateCurrentTravelerData("insurance", {
      insurance: value,
      insuranceDetails:
        value === "true"
          ? { selected: true }
          : value === "own"
          ? { hasOwnInsurance: true }
          : null,
      insuranceCertificate: value === "own" ? uploadedCertificate : null,
    });
  };

  const handleCertificateUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const certificateData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result, // base64 string
        };

        console.log("=== CERTIFICATE UPLOAD DEBUG ===");
        console.log("Certificate data:", certificateData);
        console.log("Selected insurance:", selectedInsurance);
        console.log("Current traveler data:", travelerData);

        setUploadedCertificate(certificateData);

        // Update traveler's insurance data with certificate
        const insuranceUpdate = {
          insurance: selectedInsurance,
          insuranceDetails:
            selectedInsurance === "own"
              ? { hasOwnInsurance: true, certificateUploaded: true }
              : null,
          insuranceCertificate: certificateData,
        };

        console.log("Insurance update data:", insuranceUpdate);
        console.log("=== END CERTIFICATE UPLOAD DEBUG ===");

        updateCurrentTravelerData("insurance", insuranceUpdate);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsurancePayment = async () => {
    if (!selectedInsurance || selectedInsurance !== "true") {
      alert("Please select insurance option first");
      return;
    }

    // console.log("=== FRONTEND PAYMENT DEBUG ===");
    // console.log("Insurance fee from Redux:", insuranceFee);
    // console.log("Parent visa application:", parentVisaApplication);
    // console.log("Traveler index:", travelerIndex);
    // console.log("Is additional traveler:", isAdditionalTraveler);

    if (!insuranceFee || insuranceFee <= 0) {
      alert(
        "Insurance fee not available. Please refresh the page and try again."
      );
      return;
    }

    setPaymentLoading(true);
    try {
      // Prepare payment data
      const paymentData = {
        email: parentVisaApplication?.email || "",
        amount: insuranceFee.toString(), // Ensure it's a string
        travellers: "1", // For this specific traveler
        country: parentVisaApplication?.country || "United Kingdom",
        insurance: "true",
        applicationId: parentVisaApplication?.id?.toString() || "",
        travelerIndex: travelerIndex.toString(),
        paymentType: isAdditionalTraveler
          ? "additional_traveler_insurance"
          : "traveler_insurance",
      };

      console.log(
        `Creating payment session for ${
          isAdditionalTraveler ? "additional" : "regular"
        } traveler insurance:`,
        paymentData
      );
      console.log("=== END FRONTEND PAYMENT DEBUG ===");

      const response = await handleCreateDynamicCheckoutSession(paymentData);

      console.log("=== PAYMENT RESPONSE DEBUG ===");
      console.log("Full response:", response);
      console.log("Response data:", response?.data);
      console.log("Response data.data:", response?.data?.data);
      console.log("Response data.data.results:", response?.data?.data?.results);
      console.log("URL:", response?.data?.data?.results?.url);
      console.log("=== END PAYMENT RESPONSE DEBUG ===");

      if (response?.data?.data?.results?.url) {
        // Redirect to Stripe payment page
        console.log(
          "Redirecting to Stripe URL:",
          response.data.data.results.url
        );
        window.location.href = response.data.data.results.url;
      } else {
        console.error("Payment response error - no URL found:", response);
        alert("Error creating payment session. Please try again.");
      }
    } catch (error) {
      console.error("Error creating payment session:", error);
      alert("Error creating payment session. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedInsurance) {
      alert("Please select an insurance option");
      return;
    }

    // If user selected "own" insurance but hasn't uploaded certificate
    if (selectedInsurance === "own" && !uploadedCertificate) {
      alert("Please upload your insurance certificate");
      return;
    }

    // If this is an additional traveler who selected insurance but hasn't paid yet
    if (needsInsurancePayment) {
      handleInsurancePayment();
      return;
    }

    // Get the current traveler's insurance data from the props
    const currentInsuranceData = travelerData?.insurance || {};

    // Build complete save data with all insurance information
    const saveData = {
      insurance: selectedInsurance,
      travelerIndex: travelerIndex,
      // Include complete insurance object with details and certificate
      insuranceData: {
        insurance: selectedInsurance,
        insuranceDetails:
          selectedInsurance === "own"
            ? { hasOwnInsurance: true, certificateUploaded: true }
            : null,
        insuranceCertificate:
          selectedInsurance === "own" ? uploadedCertificate : null,
      },
    };

    console.log("=== INSURANCE SAVE DEBUG ===");
    console.log("Selected insurance:", selectedInsurance);
    console.log("Uploaded certificate:", uploadedCertificate);
    console.log("Current traveler data:", travelerData);
    console.log("Save data being sent:", saveData);
    console.log("=== END INSURANCE SAVE DEBUG ===");

    onComplete(saveData);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-gilroy-bold mb-4">
          {isAdditionalTraveler
            ? "Additional Traveler Insurance"
            : "Travel Insurance"}
        </h3>

        {isAdditionalTraveler && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  Additional Traveler
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You are an additional traveler beyond the originally paid
                  count. You need to select and pay for your own insurance.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedInsurance === "true"
                ? "border-[#7350FF] bg-[#7350FF]/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleInsuranceSelection("true")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name={`insurance-${travelerIndex}`}
                  value="true"
                  checked={selectedInsurance === "true"}
                  onChange={(e) => handleInsuranceSelection(e.target.value)}
                  className="h-4 w-4 text-[#7350FF] focus:ring-[#7350FF] border-gray-300"
                />
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">
                    Yes, I want travel insurance
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isAdditionalTraveler
                      ? "Comprehensive coverage for additional traveler"
                      : "Comprehensive travel insurance coverage"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg">
                  ¥{insuranceFee.toLocaleString()}
                </span>
                <p className="text-sm text-gray-600">per person</p>
              </div>
            </div>

            {selectedInsurance === "true" && (
              <div className="mt-4 pl-7 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Medical expenses up to ¥1,000,000
                </div>
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Trip cancellation coverage
                </div>
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lost baggage protection
                </div>
              </div>
            )}
          </div>

          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedInsurance === "own"
                ? "border-[#7350FF] bg-[#7350FF]/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleInsuranceSelection("own")}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name={`insurance-${travelerIndex}`}
                value="own"
                checked={selectedInsurance === "own"}
                onChange={(e) => handleInsuranceSelection(e.target.value)}
                className="h-4 w-4 text-[#7350FF] focus:ring-[#7350FF] border-gray-300"
              />
              <div className="ml-3">
                <h4 className="font-semibold text-gray-900">
                  I have my own insurance certificate
                </h4>
                <p className="text-sm text-gray-600">
                  Upload your existing insurance certificate document
                </p>
              </div>
            </div>

            {selectedInsurance === "own" && (
              <div className="mt-4 pl-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Insurance Certificate
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7350FF] file:text-white hover:file:bg-[#7350FF]/90"
                />
                {uploadedCertificate && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✓ Certificate uploaded: {uploadedCertificate.name}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Accepted formats: PDF, JPG, JPEG, PNG (max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {requiresInsurance && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong>{" "}
              {isAdditionalTraveler
                ? "As an additional traveler, you must make an insurance selection to complete your application."
                : "You need to make an insurance selection to complete your application."}
            </p>
          </div>
        )}

        {needsInsurancePayment && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Payment Required:</strong> You'll be redirected to secure
              payment to complete your insurance purchase for ¥
              {insuranceFee.toLocaleString()}.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={
          loading ||
          paymentLoading ||
          cretingDynamicCheckout ||
          !selectedInsurance
        }
        className="w-full bg-[#7350FF] text-white py-3 px-4 rounded-md hover:bg-[#7350FF] disabled:bg-[#7350FF]/30 font-medium"
      >
        {loading || paymentLoading || cretingDynamicCheckout
          ? needsInsurancePayment
            ? "Redirecting to Payment..."
            : "Saving..."
          : needsInsurancePayment
          ? `Pay for Insurance (¥${insuranceFee.toLocaleString()})`
          : selectedInsurance === "own"
          ? uploadedCertificate
            ? "Complete with Own Insurance"
            : "Upload Certificate First"
          : isAdditionalTraveler
          ? "Complete Additional Traveler Insurance"
          : "Complete Insurance Step"}
      </button>
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
