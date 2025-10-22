"use client";
import {
  getVisaApplication,
  createOrUpdateApplication,
  updateVisaApplication,
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
import { ChevronLeft, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import BookingAppointment from "@/components/BookingAppointment";
import useCreateDynamicCheckoutSession from "@/hooks/useCreateDynamicCheckoutSession";
import { countryCodeMap } from "@/utils/countryCodeMap";
import { useRouter } from "next/router";
import { XIcon } from "lucide-react";
import { useSendStudentVerification } from "@/hooks/useSendStudentVerification";
import { useCalculatePayment } from "@/hooks/useCalculatePayment";
import ConfirmationModal from "@/components/ConfirmationModal";
import { TravelDates } from "@/components/TravelDates";
import { InsuranceStep } from "@/components/InsuranceStep";
import { calculateDays } from "@/utils/calculateDays";
import { useMemo } from "react";
import { CheckCircle } from "lucide-react";


const MultiStepAccordion = () => {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("application_id");
  const visaState = useAppSelector((state) => state.visa);
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const dispatch = useAppDispatch();
  const { showError } = useToast();
  const router = useRouter();
  const [_isClient, setIsClient] = useState(false);
  const [parentVisaApplication, setParentVisaApplication] = useState(null);
  const isApplicationSubmitted =
    ["submitted", "under_review", "processing", "approved", "rejected", "cancelled"].includes(parentVisaApplication?.applicationStatus);

  const [travelersStepInfo, setTravelersStepInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentTravelerIndex, setCurrentTravelerIndex] = useState(0);
  const [numberOfTravelers, setNumberOfTravelers] = useState(1);
  const [userEmail, setUserEmail] = useState("");
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });
  const currentStep = router.query.step;

  const isOwner = parentVisaApplication?.email === userEmail;

  const totalTraveler =
    parentVisaApplication?.totalTraveler ||
    parentVisaApplication?.numberOfTravellers ||
    1;

  // Prefer application-level insurance summary when available
  const getAppInsurance = () => parentVisaApplication?.insurance || null;
  const getInitialInsurancePaidTotal = () =>
    getAppInsurance()?.paymentAmount ??
    parentVisaApplication?.initialInsurancePaidTotal ??
    "0";
  const _isApplicationInsurancePaid = () => {
    const appIns = getAppInsurance();
    const initial = getInitialInsurancePaidTotal();
    return (
      (appIns && appIns.insurancePaymentCompleted === true) ||
      Number(initial) > 0
    );
  };
  const [isInsuranceAssigning, setIsInsuranceAssigning] = useState(false);

  const { paymentData } = useCalculatePayment(applicationId);

  const [travelersData, setTravelersData] = useState([
    {
      id: 1,
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
        insurancePaymentCompleted: false,
        paidInCheckout: null,
        paymentAmount: null,
      },
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
      id: 3,
      title: "Upload your visa documents",
      completed: false,
      open: false,
      stepType: "documents",
    },

    {
      id: 7,
      title: "Insurance",
      completed: false,
      open: false,
      stepType: "insurance",
    },
    {
      id: 4,
      title: "Payment",
      completed: false,
      open: false,
      stepType: "fullPayment",
    },

    {
      id: 5,
      title: "Book an appointment",
      completed: false,
      open: false,
      stepType: "appointment",
    },
    {
      id: 6,
      title: "Application Completed",
      completed: false,
      open: false,
      stepType: "completed",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStepsFromStepInfo = (stepInfo = null) => {
    const appStepInfo = parentVisaApplication?.stepInfo;
    const relevantStepInfo =
      stepInfo || appStepInfo || getCurrentTravelerStepInfo();
    if (!relevantStepInfo) return;

    // Check if application is submitted - if so, mark all steps as completed
    const isApplicationSubmitted = ["submitted", "under_review", "processing", "approved", "rejected", "cancelled"].includes(parentVisaApplication?.applicationStatus);

    setSteps((prevSteps) => {
      return prevSteps.map((step) => {
        let isCompleted = relevantStepInfo.completedSteps?.includes(
          step.stepType
        );
        
        // If application is submitted, mark all steps as completed
        if (isApplicationSubmitted) {
          isCompleted = true;
        }
        
        const isInsuranceComplete =
          relevantStepInfo.completedSteps?.includes("insurance");
        if (step.stepType === "fullPayment") {
          if (!isInsuranceComplete && !isApplicationSubmitted) {
            isCompleted = false;
          }
        }

        return {
          ...step,
          completed: isCompleted,
        };
      });
    });
  };

  const getVisibleSteps = () => {
    if (!parentVisaApplication) return steps;

    const appStepInfo = parentVisaApplication?.stepInfo;
    const currentTravelerStepInfo = getCurrentTravelerStepInfo();
    const relevantStepInfo = appStepInfo ||
      currentTravelerStepInfo || { completedSteps: [] };

    let visibleSteps = [...steps];

    const isTravelerCompleted = currentTravelerStepInfo?.isCompleted || false;
    const isAdditionalTraveler =
      currentTravelerStepInfo?.isAdditionalTraveler || false;

    // Get payment tracking data from backend
    const initiallyPaidTraveler =
      parentVisaApplication?.initiallyPaidTraveler || 0;
    const amountPaidTotal =
      parentVisaApplication?.amountPaidTotal ||
      parentVisaApplication?.amountPaid ||
      "0";

    // Check if insurance documents are uploaded
    const _hasInsuranceDocuments = () => {
      return travelersData.some((traveler) => {
        const documents = traveler?.documents?.documents || {};
        // Check for insurance documents (ID 6) or any document with insurance in the name
        return (
          documents["6"] ||
          Object.keys(documents).some(
            (key) => key.toLowerCase().includes("insurance") && documents[key]
          )
        );
      });
    };


    // Check if all travelers have insurance handled (either paid or documents uploaded)
    const allInsuranceHandled = () => {
      return parentVisaApplication?.totalTraveler === insuranceDetails?.length;
    };

    // Determine what needs payment
    const hasAnyPayment = parseFloat(amountPaidTotal) > 0;
    const missingTravelerPayment =
      !hasAnyPayment ||
      initiallyPaidTraveler === 0 ||
      initiallyPaidTraveler < totalTraveler;
    const missingInsurancePayment = !allInsuranceHandled();

    visibleSteps = visibleSteps.map((step) => {
      if (step.stepType === "completed") {
        const isAppCompleted =
          relevantStepInfo?.isCompleted &&
          relevantStepInfo?.isSubmitted &&
          relevantStepInfo?.applicationStatus === "submitted";
        return {
          ...step,
          title: "Application Completed",
          completed: isAppCompleted,
          open:
            relevantStepInfo?.currentStep === "completed" ||
            (relevantStepInfo?.completedSteps?.length >= 6 && isAppCompleted)
        };
      }
      return step;
    });

    const showPayment = !parentVisaApplication?.travelersData?.every(
      (traveler, index) => {
        const payment = traveler?.fullPayment;

        return (
          payment?.paidInCheckout
        );
      }
    );

    if (!showPayment) {
      visibleSteps = visibleSteps.filter(
        (step) => step.stepType !== "fullPayment"
      );
    }

    const allPaidInCheckout = parentVisaApplication?.travelersData?.every(
      (traveler) => traveler?.insurance?.paidInCheckout
    )

    const showInsurance = parentVisaApplication?.insuranceDetails ? !(parentVisaApplication?.insuranceDetails?.paidInCheckout?.noOfInsurance === parentVisaApplication?.totalTraveler) : !allPaidInCheckout

    if (!showInsurance) {
      if (parentVisaApplication?.stepInfo?.applicationStatus === "submitted") {
        return visibleSteps
      }
      visibleSteps = visibleSteps.filter(
        (step) => step.stepType !== "insurance"
      )
    }


    return visibleSteps;
  };

  const _addTraveler = async (uniqueId) => {
    const newTraveler = {
      id: uniqueId,
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
        travelStartDate:
          parentVisaApplication?.travelersData?.[0]?.basicDetails
            ?.travelStartDate || "",
        travelEndDate:
          parentVisaApplication?.travelersData?.[0]?.basicDetails
            ?.travelEndDate || "",
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
        insurance: false,
        insuranceDetails: null,
        insuranceCertificate: null,
        paidInCheckout: false, // New travelers need to pay separately unless app-level insurance is paid
        insuranceSource: null,
        insurancePaymentCompleted: false,
      },
      fullPayment: {
        paymentStatus: "pending",
        paymentCompleted: false,
        paymentAmount: 0,
        paymentDate: null,
        paymentMethod: "",
        includeInsurance: false,
        insuranceType: "none",
      },
    };

    const newTravelersData = [...travelersData, newTraveler];

    const hasPaymentBeenMade =
      parentVisaApplication?.amountPaid &&
      parseFloat(parentVisaApplication.amountPaid) > 0;
    const isAdditionalTraveler = hasPaymentBeenMade;

    if (!hasPaymentBeenMade) {
      const newNumberOfTravelers = numberOfTravelers + 1;
      setNumberOfTravelers(newNumberOfTravelers);
      dispatch(setTravelers(newNumberOfTravelers));
    } else {
      const newTotalTravelers = Math.max(
        totalTraveler,
        travelersData.length + 1
      );
      setNumberOfTravelers(newTotalTravelers);
      dispatch(setTravelers(newTotalTravelers));
    }

    setTravelersData(newTravelersData);

    const newStepInfo = {
      completedSteps: isAdditionalTraveler ? ["createApplication"] : [],
      currentStep: "basicDetails",
      nextStep: null,
      isCompleted: false,
      stepProgress: isAdditionalTraveler ? 10 : 0,
      totalSteps: 6,
      isAdditionalTraveler: isAdditionalTraveler,
      stepNames: {
        createApplication: "Application Created",
        basicDetails: "Basic Details",
        visitDetails: "Visit Details",
        appointment: "Book an appointment",
        documents: "Documents Upload",
        insurance: "Insurance",
        payment: "Payment",
      },
    };

    setTravelersStepInfo((prev) => ({
      ...prev,
      [newTraveler.id]: newStepInfo,
    }));

    if (isAdditionalTraveler) {
      try {
        setLoading(true);
        const payload = {
          id: applicationId,
          travelersData: newTravelersData,
        };

        const response = await updateVisaApplication(token, payload);

        if (response?.status >= 200 && response?.status < 300) {
          const response = applicationId && await getVisaApplication(
            token,
            {
              id: applicationId,
            }
          )

          const updatedApplication = response?.data?.data?.results?.application;

          setParentVisaApplication(updatedApplication);

          if (updatedApplication?.travelersData) {
            try {
              const updatedTravelersDataParsed = Array.isArray(
                updatedApplication.travelersData
              )
                ? updatedApplication.travelersData
                : JSON.parse(updatedApplication.travelersData);

              setTravelersData(updatedTravelersDataParsed);

              const updatedTravelersStepInfo = {};
              updatedTravelersDataParsed.forEach((traveler) => {
                if (traveler.stepInfo) {
                  updatedTravelersStepInfo[traveler.id] = traveler.stepInfo;
                }
              });
              setTravelersStepInfo((prev) => ({
                ...prev,
                ...updatedTravelersStepInfo,
              }));

              setCurrentTravelerIndex(updatedTravelersDataParsed.length - 1);
            } catch (error) {
              console.error("Error parsing updated travellers data:", error);
              if (showError)
                showError("Failed to add traveller. Please try again.");
            }
          }
        } else {
          const errorMessage =
            response?.data?.message ||
            response?.data?.error ||
            "Failed to add additional traveller.";
          if (showError) showError(errorMessage);
        }

      } catch (error) {
        console.error("Error adding additional traveller:", error);
        if (showError)
          showError("Failed to add additional traveller. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const _removeTraveler = async (travelerId) => {
    if (travelersData.length > 1) {
      setLoading(true);
      try {
        const newTravelersData = travelersData.filter(
          (traveler) => traveler.id !== travelerId
        );
        const newNumberOfTravelers = numberOfTravelers - 1;

        setTravelersData(newTravelersData);
        setNumberOfTravelers(newNumberOfTravelers);

        dispatch(setTravelers(newNumberOfTravelers));

        setTravelersStepInfo((prev) => {
          const updated = { ...prev };
          delete updated[travelerId];
          return updated;
        });

        if (currentTravelerIndex >= travelersData.length - 1) {
          setCurrentTravelerIndex(0);
        }

        // Update application with removed traveler
        // await createOrUpdateApplication(token, payload);
        await updateVisaApplication(token, {
          id: applicationId,
          travelersData: newTravelersData,
          numberOfTravellers: newTravelersData.length,
          totalTraveler: newTravelersData.length,
        });

        await fetchApplicationById();
      } catch (error) {
        console.error("Error removing traveler:", error);
        if (showError)
          showError("Failed to remove traveler. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const _switchTraveler = (index) => {
    setCurrentTravelerIndex(index);
  };

  const getCurrentTraveler = () =>
    travelersData[currentTravelerIndex] || travelersData[0];

  const getCurrentTravelerStepInfo = () => {
    const currentTraveler = getCurrentTraveler();
    if (currentTraveler?.stepInfo) {
      return currentTraveler.stepInfo;
    }

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

  const _updateCurrentTravelerStepInfo = (stepInfoUpdate) => {
    const currentTraveler = getCurrentTraveler();
    if (!currentTraveler) return;

    setTravelersStepInfo((prev) => ({
      ...prev,
      [currentTraveler.id]: {
        ...prev[currentTraveler.id],
        ...stepInfoUpdate,
      },
    }));

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

  const updateCurrentTravelerData = (section, data) => {
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

  const initializeTravelersData = (newNumber) => {
    const currentData = [...travelersData];

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
          insurance: false,
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
          insurance: false,
          insuranceDetails: null,
          insuranceCertificate: null,
          paidInCheckout: false,
          insuranceSource: null,
          insurancePaymentCompleted: false,
        },
        completedSteps: [],
        currentStep: "basicDetails",
        completed: false,
      }
    );
  };
  const toggleStep = (stepId) => {
    const visible = getVisibleSteps();
    const visibleIndex = visible.findIndex((s) => s.id === stepId);

    if (visibleIndex === -1) return;

    const targetStep = visible[visibleIndex];

    if (targetStep.open) {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          open: step.id === stepId ? !step.open : false,
        }))
      );
      return;
    }

    const allPreviousCompleted = visible
      .slice(0, visibleIndex)
      .every((s) => s.completed === true);

    if (!allPreviousCompleted) {
      if (showError)
        showError("Please complete previous steps before proceeding.");
      return;
    }

    // Open the target step and close others
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        open: step.id === stepId ? true : false,
      }))
    );
  };
  const openDocumentsStep = () => {
    const visible = getVisibleSteps();
    const documentsStep = visible.find((s) => s.stepType === "documents");
    if (documentsStep) {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          open: step.id === documentsStep.id,
        }))
      );
    }
  };

  // Navigate to previous visible step
  const goToPreviousStep = () => {
    const visible = getVisibleSteps();
    const currentIndex = visible.findIndex((s) => s.open);

    if (currentIndex > 0) {
      const prev = visible[currentIndex - 1];
      setCurrentTravelerIndex(0); // reset to first traveler when going back

      setSteps((prevSteps) =>
        prevSteps.map((s) => ({
          ...s,
          open: s.id === prev.id,
        }))
      );

      // Scroll to the previous step
      setTimeout(() => {
        document.getElementById(`step-${prev.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 100);
    }
  }
  const handleCompleteStep = async (stepId, stepData = {}) => {
    setLoading(true);
    let updatedTravelersDataParsed = undefined;
    try {
      const step = steps.find((s) => s.id === stepId);
      const _currentTraveler = travelersData[currentTravelerIndex];

      let travelersDataToSend = stepData.updatedTravelersData || travelersData;


      if (
        (stepId === 3 || step?.stepType === "appointment") &&
        stepData.appointmentData
      ) {
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

      if (
        (stepId === 1 || step?.stepType === "basicDetails") &&
        stepData.basicDetails
      ) {
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
      if (step.stepType === "fullPayment" || step.stepType === "insurance") {
        const pathname = router.pathname;
        router.replace(
          {
            pathname,
            query: {
              application_id: applicationId,
            },
          },
          undefined,
          { shallow: true }
        );
      }
      if (
        (stepId === "fullPayment" ||
          stepId === 4 ||
          step?.stepType === "fullPayment") &&
        (stepData.fullPaymentData || stepData.travelerIndex !== undefined)
      ) {
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedTraveler = {
              ...traveler,
              fullPayment: {
                ...traveler.fullPayment,
                ...stepData.fullPaymentData,
                paymentStatus: "pending", // Will be updated to completed after successful payment
                paymentCompleted: false, // Will be updated after successful payment
                paymentDate: new Date().toISOString(),
              },
            };

            return updatedTraveler;
          }
          return traveler;
        });

        // Add application-level fullPayment data if provided
        if (stepData.applicationFullPayment) {
          // This will be included in the payload sent to backend
          stepDataForPayload.fullPayment = stepData.applicationFullPayment;
        }
      }

      if (stepId === 6 || step?.stepType === "payment") {
        // Update the current traveler's payment data
        travelersDataToSend = travelersDataToSend.map((traveler, index) => {
          if (index === currentTravelerIndex) {
            const updatedPayment = {
              ...traveler.payment,
              ...stepData.paymentData,
              paymentStatus: "completed", // Mark as completed
              paymentMethod:
                stepData.paymentData?.paymentMethod ||
                traveler.payment?.paymentMethod ||
                "stripe",
              paymentDate: new Date().toISOString(),
              amountPaid:
                stepData.paymentData?.grandTotal ||
                traveler.payment?.grandTotal ||
                3859,
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
      let typeToSend = step?.stepType;
      if (!allowedTypes.includes(typeToSend)) {
        const typeMapping = {
          appointment: "documents", // appointment data is merged into travelersData; send under documents
          completed: "createApplication",
          fullPayment: "payment", // fullPayment maps to payment for backend
        };
        typeToSend = typeMapping[typeToSend] || "createApplication";
      }

      const payload = {
        type: step.stepType,
        applicationId: applicationId,
        currentTravelerIndex: currentTravelerIndex,
        travelersData: travelersDataToSend,
        numberOfTravellers: numberOfTravelers,
        ...stepDataForPayload,
        ...(stepData.appointmentData
          ? { appointment: stepData.appointmentData }
          : {}),
      };

      const response = await createOrUpdateApplication(token, payload);

      if (response?.status >= 200 && response?.status < 300) {
        await fetchApplicationById();
        const updatedApplication = response?.data?.data?.results?.application;

        if (updatedApplication?.travelersData) {
          try {
            updatedTravelersDataParsed = Array.isArray(
              updatedApplication.travelersData
            )
              ? updatedApplication.travelersData
              : JSON.parse(updatedApplication.travelersData);

            setTravelersData(updatedTravelersDataParsed);

            const updatedTravelersStepInfo = {};
            updatedTravelersDataParsed.forEach((traveler) => {
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

        const currentTravelersList =
          updatedTravelersDataParsed || travelersData;

        const getCompletedForTraveler = (traveler) => {
          if (!traveler) return [];
          if (
            traveler.stepInfo &&
            Array.isArray(traveler.stepInfo.completedSteps)
          )
            return traveler.stepInfo.completedSteps;
          const stored = travelersStepInfo[traveler.id];
          if (stored && Array.isArray(stored.completedSteps))
            return stored.completedSteps;
          return traveler.completedSteps || [];
        };

        let stepKey = step.stepType || "";
        if (stepKey === "completed") stepKey = "createApplication";

        const paidCount = numberOfTravelers || 1;

        const findNextMissingTraveler = () => {
          for (
            let i = 0;
            i < currentTravelersList.length && i < paidCount;
            i++
          ) {
            if (i === currentTravelerIndex) continue;
            const completed = getCompletedForTraveler(currentTravelersList[i]);
            if (!completed.includes(stepKey)) return i;
          }
          return -1;
        };

        const nextMissingTravelerIndex = findNextMissingTraveler();

        if (nextMissingTravelerIndex !== -1) {
          setCurrentTravelerIndex(nextMissingTravelerIndex);
          setSteps((prevSteps) =>
            prevSteps.map((s) => ({
              ...s,
              open: s.id === step.id,
            }))
          );

          document
            .getElementById(`step-${step.id}`)
            ?.scrollIntoView({ behavior: "smooth" });
        } else {
          let allPaidHaveStep = true;
          for (let i = 0; i < paidCount; i++) {
            const trav = currentTravelersList[i];
            const completed = getCompletedForTraveler(trav);
            if (!completed.includes(stepKey)) {
              allPaidHaveStep = false;
              break;
            }
          }

          if (
            parentVisaApplication?.stepInfo?.completedSteps?.includes(stepKey)
          ) {
            allPaidHaveStep = true;
          }

          setSteps((prevSteps) =>
            prevSteps.map((s) =>
              s.id === step.id
                ? { ...s, completed: allPaidHaveStep, open: false }
                : s
            )
          );

          await fetchApplicationById();

          updateStepsFromStepInfo();

          const visible = getVisibleSteps();
          const currentVisibleIndex = visible.findIndex(
            (s) => s.id === step.id
          );
          if (
            currentVisibleIndex !== -1 &&
            currentVisibleIndex < visible.length - 1
          ) {
            const nextVisibleStep = visible[currentVisibleIndex + 1];
            if (nextVisibleStep) {
              // Reset to first traveler when moving to the next step
              setCurrentTravelerIndex(0);

              setSteps((prevSteps) =>
                prevSteps.map((s) => ({
                  ...s,
                  open: s.id === nextVisibleStep.id,
                }))
              );

              setTimeout(() => {
                document.getElementById(`step-${nextVisibleStep.id}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }, 100);
            }
          }
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

    // Check all required fields are present
    const hasBasicInfo =
      basicDetails.passportNumber &&
      basicDetails.firstName &&
      basicDetails.lastName &&
      basicDetails.sex &&
      basicDetails.dateOfBirth &&
      basicDetails.placeOfBirth;

    const hasPassportInfo =
      basicDetails.passportIssuePlace &&
      basicDetails.passportIssueDate &&
      basicDetails.passportExpiryDate;

    const hasAddressInfo =
      basicDetails.currentAddress1 && basicDetails.city && basicDetails.pincode;

    const hasPassportImages =
      basicDetails.passportFront && basicDetails.passportBack;

    const hasMobileNumber =
      basicDetails.mobileNumber && String(basicDetails.mobileNumber).trim();

    // Also check for valid date relationships
    let validDates = true;
    if (basicDetails.passportIssueDate && basicDetails.passportExpiryDate) {
      validDates =
        new Date(basicDetails.passportExpiryDate) >=
        new Date(basicDetails.passportIssueDate);
    }
    // if (basicDetails.travelStartDate && basicDetails.travelEndDate) {
    //   validDates =
    //     validDates &&
    //     new Date(basicDetails.travelEndDate) >
    //       new Date(basicDetails.travelStartDate);
    // }

    // Check mobile number format
    let validMobile = true;
    if (hasMobileNumber) {
      const digits = String(basicDetails.mobileNumber)
        .trim()
        .replace(/\D/g, "");
      validMobile =
        (digits.length === 10 || digits.length === 11) &&
        (digits.length === 10
          ? digits.charAt(0) !== "0"
          : digits.charAt(0) === "0");
    }

    // Check postcode format
    let validPostcode = true;
    if (basicDetails.pincode) {
      const ukPostcodeRegex =
        /^([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|GIR\s?0AA)$/i;
      validPostcode = ukPostcodeRegex.test(String(basicDetails.pincode).trim());
    }

    return (
      hasBasicInfo &&
      hasPassportInfo &&
      hasAddressInfo &&
      hasPassportImages &&
      hasMobileNumber &&
      validDates &&
      validMobile &&
      validPostcode
    );
  };

  // New validation function for all travelers' passport data
  const _validateAllTravelersPassportData = () => {
    return travelersData.every((traveler) => {
      const basicDetails = traveler.basicDetails || {};
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
        basicDetails.city &&
        basicDetails.pincode &&
        basicDetails.mobileNumber &&
        basicDetails.passportFront &&
        basicDetails.passportBack
      );
    });
  };

  const validateVisitData = () => {
    const currentTraveler = getCurrentTravelerData();
    const visitDetails = currentTraveler.visitDetails || {};

    const isValid =
      visitDetails.visitingOtherSchengenCountries &&
      Array.isArray(visitDetails.visitingOtherSchengenCountries) &&
      visitDetails.visitingOtherSchengenCountries.length > 0 &&
      visitDetails.firstCountryOfEntry &&
      visitDetails.hasSchengenVisa &&
      visitDetails.hasDigitalFingerprints &&
      visitDetails.maritalStatus &&
      visitDetails.employmentStatus &&
      visitDetails.willAnyonePayForVisit &&
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

    return isValid;
  };

  // New validation function for all travelers' visit data
  const _validateAllTravelersVisitData = () => {
    return travelersData.every((traveler) => {
      const visitDetails = traveler.visitDetails || {};
      return (
        visitDetails.visitingOtherSchengenCountries &&
        Array.isArray(visitDetails.visitingOtherSchengenCountries) &&
        visitDetails.visitingOtherSchengenCountries.length > 0 &&
        visitDetails.firstCountryOfEntry &&
        visitDetails.hasSchengenVisa &&
        visitDetails.hasDigitalFingerprints &&
        visitDetails.maritalStatus &&
        visitDetails.employmentStatus &&
        visitDetails.willAnyonePayForVisit &&
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
          (visitDetails.fundingPersonName && visitDetails.tripFundedBy))
      );
    });
  };

  const validateDocuments = () => {
    const currentTraveler = getCurrentTravelerData();
    const documents = currentTraveler.documents?.documents || {};

    // Define required documents with their validation rules
    const requiredDocuments = [
      { id: 1, minCount: 2, field: "passportPhotos" }, // Passport photos - need 2
      { id: 2, minCount: 1, field: "bankStatements" }, // Bank statements
      { id: 3, minCount: 1, field: "employmentProof" }, // Employment proof
      { id: 5, minCount: 1, field: "ukVisa" }, // UK visa
    ];

    return requiredDocuments.every((docReq) => {
      const doc = documents[docReq.field];
      if (!doc) return false;

      // For passport photos (id: 1), check if we have at least 2 photos
      if (docReq.id === 1) {
        const photos = Array.isArray(doc) ? doc : [doc];
        return photos.length >= docReq.minCount;
      }

      // For other documents, just check if they exist
      return true;
    });
  };

  const _validateAllTravelersDocuments = () => {
    const requiredDocuments = [
      { id: 1, minCount: 2 }, // Passport photos - need 2
      { id: 2, minCount: 1 }, // Bank statements
      { id: 3, minCount: 1 }, // Employment proof
      { id: 5, minCount: 1 }, // UK visa
    ];

    return travelersData.every((traveler) => {
      const documents = traveler.documents?.documents || {};

      return requiredDocuments.every((docReq) => {
        const doc = documents[docReq.id];
        if (!doc) return false;

        // For passport photos (id: 1), check if we have at least 2 photos
        if (docReq.id === 1) {
          const photos = Array.isArray(doc) ? doc : [doc];
          return photos.length >= docReq.minCount;
        }

        // For other documents, just check if they exist
        return true;
      });
    });
  };

  const validateAppointment = () => {
    const currentTraveler = getCurrentTravelerData();
    const appointment = parentVisaApplication.appointment || {};

    const pref1 = appointment.preference1 || {};
    return (
      pref1.city && pref1.dateRangeStart && pref1.dateRangeEnd && pref1.slot
    );
  };

  const currentTravellerForInsurance = useMemo(() => {
    const currentTraveler = travelersData[currentTravelerIndex];

    if (!currentTraveler) {
      return null;
    }

    const matchingTraveler = parentVisaApplication?.travelersData?.find(
      (traveler) => traveler.id === currentTraveler.id
    );

    return matchingTraveler || currentTraveler;
  }, [currentTravelerIndex, travelersData, parentVisaApplication?.id]);

  const _validateInsurance = () => {
    const currentTraveler = currentTravellerForInsurance;

    if (!currentTraveler) {
      return false;
    }

    // Check if insurance certificate is uploaded
    const hasCertificate = currentTraveler?.insurance?.insuranceCertificates;

    // Check if payment is completed
    const hasPayment = !!(
      currentTraveler?.insurance?.paidInCheckout ||
      currentTraveler?.insurance?.insurancePaymentCompleted
    );


    return hasCertificate || hasPayment;
  };

  const _validateFullPayment = () => {
    const allPaymentCompleted = travelersData.every(
      (traveler, index) =>
        traveler.fullPayment?.paymentCompleted
    );
    return allPaymentCompleted;
  };

  const canCompleteStep = (stepType) => {
    switch (stepType) {
      case "basicDetails":
        return validatePassportData();
      case "visitDetails":
        return validateVisitData();
      case "documents":
        return validateDocuments();
      case "fullPayment":
        return _validateFullPayment();
      case "appointment":
        return validateAppointment();
      case "insurance":
        return _validateInsurance();
      default:
        return true;
    }
  };

  const fetchApplicationById = async () => {
    try {
      setLoading(true);
      const payload = { id: applicationId };
      const response = await getVisaApplication(token, payload);

      if (response?.status >= 200 && response?.status < 300) {
        const applicationData = response?.data?.data?.results?.application;

        setParentVisaApplication(applicationData);

        updateStepsFromStepInfo();

        if (applicationData) {
          const country = applicationData.country || "United Kingdom";
          const config =
            COUNTRY_CONFIG[country.toUpperCase()] ||
            COUNTRY_CONFIG["UNITED KINGDOM"];
          if (
            config?.insuranceFee &&
            (!visaState?.insuranceFees || visaState?.insuranceFees === 0)
          ) {
            dispatch(setInsuranceFees(Number(config.insuranceFee)));
          }

          if (applicationData.travelersData) {
            try {
              const savedTravelersData = Array.isArray(
                applicationData.travelersData
              )
                ? applicationData.travelersData
                : JSON.parse(applicationData.travelersData);
              const normalizeDate = (v) => {
                if (!v) return "";
                if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
                if (String(v).includes("T")) return String(v).split("T")[0];
                try {
                  const d = new Date(v);
                  if (isNaN(d.getTime())) return "";
                  return d.toISOString().split("T")[0];
                } catch {
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

              const initialTravelersStepInfo = {};
              savedTravelersData.forEach((traveler) => {
                if (traveler.stepInfo) {
                  initialTravelersStepInfo[traveler.id] = traveler.stepInfo;
                } else {
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

          if (applicationData.numberOfTravellers) {
            setNumberOfTravelers(applicationData.numberOfTravellers);
            dispatch(setTravelers(applicationData.numberOfTravellers));
          }
        }
      } else {
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
    } finally {
      setLoading(false);
    }
  };

  // Add refresh function for status updates
  const handleRefreshApplication = async () => {
    await fetchApplicationById();
  };

  useEffect(() => {
    if (applicationId) {
      fetchApplicationById();
    }
  }, [applicationId, paymentData]);

  useEffect(() => {
    if (currentStep === "payment" || currentStep === "full_payment") {
      // scroll to payemnt and open
      const visible = getVisibleSteps();
      const paymentStep = visible.find((s) => s.stepType === "fullPayment");
      if (paymentStep) {
        setSteps((prev) =>
          prev.map((step) => ({
            ...step,
            open: step.id === paymentStep.id,
          }))
        );
        document
          .getElementById(`step-${paymentStep.id}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (currentStep === "traveler_insurance" || "currentStep" === "insurance") {
      const visible = getVisibleSteps();
      const insuranceStep = visible.find((s) => s.stepType === "insurance");
      if (insuranceStep) {
        setSteps((prev) =>
          prev.map((step) => ({
            ...step,
            open: step.id === insuranceStep.id,
          }))
        );
        document
          .getElementById(`step-${insuranceStep.id}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    }


  }, [currentStep]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setUserEmail(email || "");
  }, []);

  useEffect(() => {
    if (
      currentTravelerIndex >= 0 &&
      currentTravelerIndex < travelersData.length
    ) {
      updateStepsFromStepInfo();
    }
  }, [currentTravelerIndex, travelersData, travelersStepInfo]);

  useEffect(() => {
    if (parentVisaApplication?.stepInfo) {
      updateStepsFromStepInfo(parentVisaApplication.stepInfo);
    }
  }, [parentVisaApplication?.stepInfo]);

  // Update steps when application status changes
  useEffect(() => {
    if (parentVisaApplication?.applicationStatus) {
      updateStepsFromStepInfo();
    }
  }, [parentVisaApplication?.applicationStatus]);

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
      } catch {
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

  useEffect(() => {
    if (parentVisaApplication?.travelStartDate) {
      setTravelStartDate(parentVisaApplication.travelStartDate || "");
    }
  }, [parentVisaApplication?.travelStartDate]);
  useEffect(() => {
    if (parentVisaApplication?.travelEndDate) {
      setTravelEndDate(parentVisaApplication.travelEndDate || "");
    }
  }, [parentVisaApplication?.travelEndDate]);

  const handleChangeDates = (name, value) => {
    if (name === "travelStartDate") {
      updateVisaApplication(token, {
        travelStartDate: value,
        id: applicationId,
      });
    }
    if (name === "travelEndDate") {
      updateVisaApplication(token, { travelEndDate: value, id: applicationId });
    }
  };

  const insuranceDetails = parentVisaApplication?.insuranceDetails;
  const paidInCheckout = parentVisaApplication?.paidInCheckout;
  const noOfClaimInsurance =
    insuranceDetails?.paidInCheckout?.noOfInsurance || 0;
  const noOfClaimedInsurance =
    insuranceDetails?.paidInApplication?.noOfInsurance || 0;


  const handleClaimInsurance = async (travelerData) => {
    const paymentAmount =
      calculateDays(
        parentVisaApplication?.travelStartDate,
        parentVisaApplication?.travelEndDate
      ) * 2;
    setIsInsuranceAssigning(true)

    try {
      await updateVisaApplication(token, {
        id: parentVisaApplication?.id,
        travelersData: parentVisaApplication?.travelersData.map((traveler) => {
          if (traveler.id === travelerData.id) {
            return {
              ...traveler,
              insurance: {
                insurancePaymentCompleted: true,
                paymentAmount: paymentAmount,
                paidInCheckout: true,
              },
            };
          }
          return traveler;
        }),
        insuranceDetails: {
          ...parentVisaApplication?.insuranceDetails,
          paidInApplication: {
            noOfInsurance:
              (parentVisaApplication?.insuranceDetails?.paidInApplication
                ?.noOfInsurance || 0) + 1,
          },
        },
      });
    } catch (error) {
      setIsInsuranceAssigning(false);
    } finally {
      setIsInsuranceAssigning(false);
    }

    await fetchApplicationById();
  };

  const filteredTravellers = travelersData.filter((traveler) => {

    return true;
  });

  const handleSubmit = async () => {
    setConfirmationModal({
      isOpen: true,
      title: "Submit Application",
      message: "Are you ready to submit?\n\nApplications are not editable once submitted.\n\nPlease make sure all information is correct before proceeding.",
      onConfirm: async () => {
        setConfirmationModal({ ...confirmationModal, isOpen: false });
        setIsSubmitting(true);

        try {
          await updateVisaApplication(token, {
            id: parentVisaApplication.id,
            applicationStatus: "submitted",
          });

          if (parentVisaApplication?.id) {
            await getVisaApplication(token, {
              id: parentVisaApplication.id,
            });
          }
        } catch (error) {
          console.error("Error submitting application:", error);
        } finally {
          setIsSubmitting(false);
          window.location.reload();
        }
      },
    });
  };

  return (
    <div className="w-full pri_bg text-white h-full min-h-screen">
      <Header href="/dashboard" />
      <div className="w-full max-w-4xl py-[25px] pri_bg mx-auto flex-col gap-3 flex items-center justify-center px-6">
        {/* Go Back Button */}
        <div className="w-full mb-4">
          <button
            onClick={() => router.replace("/dashboard")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            <ChevronLeft className="size-5" />
            <span className="text-sm font-medium">Go Back</span>
          </button>
        </div>

        {/* Country Info */}
        <div className="flex flex-col md:flex-row justify-start w-full items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <ClientOnly>
              <img
                src={`https://flagcdn.com/w80/${countryCodeMap[parentVisaApplication?.country]
                  }.png`}
                alt="United Kingdom Flag"
                width={40}
                height={30}
                className="rounded-md border border-gray-200 w-[50px] h-[42px]"
              />
            </ClientOnly>
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

        {isApplicationSubmitted && isOwner && (
          <div className="w-full mb-4 p-4 bg-yellow-900/10 border border-yellow-600 rounded-lg text-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Application Submitted</div>
                <div className="text-sm text-yellow-200">
                  This application has been submitted. You cannot edit it
                  anymore, but you can upload any pending documents.
                </div>
              </div>
              <div>
                <button
                  onClick={openDocumentsStep}
                  className="bg-yellow-600  px-3 text-white min-w-40 py-2 rounded font-medium text-sm"
                >
                  Upload Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show processing status when admin has updated the status */}
        {isOwner && ["under_review", "processing"].includes(parentVisaApplication?.applicationStatus) && (
          <div className="w-full mb-4 p-4 bg-blue-900/10 border border-blue-600 rounded-lg text-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Application Under Review</div>
                <div className="text-sm text-blue-200">
                  Your application is being reviewed by our team. You will be notified of any updates via email.
                </div>
              </div>
              <div>
                <button
                  onClick={openDocumentsStep}
                  className="bg-blue-600 px-3 text-white min-w-40 py-2 rounded font-medium text-sm"
                >
                  Upload Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show approved status */}
        {isOwner && parentVisaApplication?.applicationStatus === "approved" && (
          <div className="w-full mb-4 p-4 bg-green-900/10 border border-green-600 rounded-lg text-green-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Application Approved</div>
                <div className="text-sm text-green-200">
                  Congratulations! Your visa application has been approved. You will receive further instructions via email.
                </div>
              </div>
              <div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-green-600 px-3 text-white min-w-40 py-2 rounded font-medium text-sm"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show rejected status */}
        {isOwner && parentVisaApplication?.applicationStatus === "rejected" && (
          <div className="w-full mb-4 p-4 bg-red-900/10 border border-red-600 rounded-lg text-red-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Application Rejected</div>
                <div className="text-sm text-red-200">
                  Your visa application has been rejected. Please check your email for detailed reasons and next steps.
                </div>
              </div>
              <div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-red-600 px-3 text-white min-w-40 py-2 rounded font-medium text-sm"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show cancelled status */}
        {isOwner && parentVisaApplication?.applicationStatus === "cancelled" && (
          <div className="w-full mb-4 p-4 bg-gray-900/10 border border-gray-600 rounded-lg text-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Application Cancelled</div>
                <div className="text-sm text-gray-200">
                  This application has been cancelled. Please contact support if you need assistance.
                </div>
              </div>
              <div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gray-600 px-3 text-white min-w-40 py-2 rounded font-medium text-sm"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        <ProgressHeader
          steps={getVisibleSteps()}
          stepInfo={
            parentVisaApplication?.stepInfo || getCurrentTravelerStepInfo()
          }
          onStepClick={(stepId) => toggleStep(stepId)}
        />

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
                id={`step-${step.id}`}
                className={`border rounded-lg border-[#423577] overflow-hidden transition-all duration-300 ${isLocked ? "opacity-50 cursor-not-allowed" : "opacity-100"
                  }`}
                style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 3px 0px" }}
              >
                {/* Step Header */}
                <div
                  className={`p-4 flex justify-between items-center ${isLocked ? "cursor-not-allowed" : "cursor-pointer"
                    } ${step.open ? "bg-[#292933]" : "bg-[#23232B]"}`}
                  onClick={() => !isLocked && toggleStep(step.id)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${step.completed
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

                {step.stepType === "basicDetails" && step.open && (
                  <div>
                    <TravelDates
                      disabled={!isOwner || isApplicationSubmitted}
                      parentVisaApplication={parentVisaApplication}
                      handleChangeDates={handleChangeDates}
                      travelStartDate={travelStartDate}
                      travelEndDate={travelEndDate}
                      setTravelEndDate={setTravelEndDate}
                      setTravelStartDate={setTravelStartDate}
                    />
                  </div>
                )}

                {/* Step Content */}

                {step.open && (step.stepType === "insurance" || step.stepType === "appointment" && step.stepType !== "appointment") && (
                  <div className="p-4 border-[#423577] border-t">
                    {/* Tab-based steps for multi-traveler scenarios */}
                    {(
                      step.stepType === "insurance") &&
                      numberOfTravelers > 1 ? (
                      <div>
                        {/* Traveler Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#423577] pb-4 items-center">
                          {filteredTravellers
                            .map((traveler, index) => {

                              const travelerStepInfo =
                                travelersStepInfo[traveler?.id] ||
                                traveler?.stepInfo ||
                                {};
                              const isCompleted =
                                travelerStepInfo?.completedSteps?.includes(
                                  step.stepType
                                ) || false;

                              return (
                                <div key={index} className="relative group">
                                  <button
                                    onClick={() =>
                                      setCurrentTravelerIndex(index)
                                    }
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${currentTravelerIndex === index
                                      ? "bg-[#6366F1] text-white"
                                      : "bg-[#292933] text-gray-300 hover:bg-[#333340] hover:text-white"
                                      }`}
                                  >
                                    <span>
                                      {travelersData[index]?.basicDetails
                                        ?.firstName
                                        ? `${travelersData[index].basicDetails.firstName}`
                                        : `Traveler ${index + 1}`}
                                    </span>
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
                                  </button>
                                  {numberOfTravelers > 1 &&
                                    step.stepType === "basicDetails" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const travelerName = travelersData[
                                            index
                                          ]?.basicDetails?.firstName
                                            ? `${travelersData[index].basicDetails.firstName}`
                                            : `Traveler ${index + 1}`;

                                          const currentTraveler =
                                            travelersData[index];
                                          if (
                                            currentTraveler?.insurance
                                              ?.insurancePaymentCompleted ||
                                            currentTraveler?.fullPayment
                                              ?.paymentCompleted
                                          ) {
                                            showError(
                                              `Cannot delete ${travelerName} as they have completed payment or insurance purchase.`
                                            );
                                            return;
                                          }

                                          setConfirmationModal({
                                            isOpen: true,
                                            title: `Delete ${travelerName}`,
                                            message: `Are you sure you want to delete ${travelerName}? This action cannot be undone.`,
                                            onConfirm: () => {
                                              const idToRemove = traveler.id;
                                              _removeTraveler(idToRemove);
                                              setConfirmationModal({
                                                ...confirmationModal,
                                                isOpen: false,
                                              });
                                            },
                                          });
                                        }}
                                        title="Remove traveler"
                                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 shadow-lg"
                                      >
                                        <XIcon className="w-3 h-3" />
                                      </button>
                                    )}
                                </div>
                              );
                            })
                            .filter(Boolean)}
                          {step.stepType === "basicDetails" && (
                            <button
                              onClick={async () => {
                                const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                  Math.random() * 1000
                                )}`;
                                await _addTraveler(uniqueId);
                              }}
                              className="bg-[#292933] text-gray-300 hover:bg-[#7350FF] hover:text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-colors duration-200 border border-dashed border-gray-500 hover:border-[#7350FF]"
                              title="Add Traveller"
                            >
                              <span className="text-lg">+</span>
                              <span className="font-medium">Add Traveller</span>
                            </button>
                          )}
                          {noOfClaimInsurance > noOfClaimedInsurance &&
                            !travelersData?.[currentTravelerIndex].insurance
                              ?.paidInCheckout &&
                            step.stepType === "basicDetails" && (
                              <div className="flex justify-self-end">
                                <div className="relative group">
                                  <button
                                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2 rounded-lg flex items-center gap-3 font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 border border-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    onClick={() =>
                                      handleClaimInsurance(
                                        travelersData?.[currentTravelerIndex]
                                      )
                                    }
                                    disabled={isInsuranceAssigning}
                                  >
                                    {isInsuranceAssigning ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span className="font-semibold">
                                      {isInsuranceAssigning ? "Assigning..." : "Assign Insurance"}
                                    </span>
                                  </button>
                                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                      Assign available insurance to this traveler
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div>
                          {step.id === 1 &&
                            step.stepType === "basicDetails" && (
                              <PassportStep
                                travelerIndex={currentTravelerIndex}
                                travelerData={getCurrentTravelerData()}
                                travelersData={travelersData}
                                updateCurrentTravelerData={
                                  updateCurrentTravelerData
                                }
                                validatePassportData={validatePassportData}
                                onComplete={(data) =>
                                  handleCompleteStep(step.id, data)
                                }
                                loading={loading}
                                showError={showError}
                                disabled={!isOwner || isApplicationSubmitted}
                              />
                            )}

                          {
                            step.stepType === "visitDetails" && (
                              <VisitStep
                                travelerIndex={currentTravelerIndex}
                                travelerData={getCurrentTravelerData()}
                                updateCurrentTravelerData={
                                  updateCurrentTravelerData
                                }
                                validateVisitData={validateVisitData}
                                parentVisaApplication={parentVisaApplication}
                                setParentVisaApplication={
                                  setParentVisaApplication
                                }
                                onComplete={(data) =>
                                  handleCompleteStep(step.id, data)
                                }
                                loading={loading}
                                showError={showError}
                                disabled={!isOwner || isApplicationSubmitted}
                              />
                            )}

                          {step.id === 3 && step.stepType === "documents" && (
                            <DocumentStep
                              travelerIndex={currentTravelerIndex}
                              travelerData={getCurrentTravelerData()}
                              updateCurrentTravelerData={
                                updateCurrentTravelerData
                              }
                              validateDocuments={validateDocuments}
                              onComplete={(data) =>
                                handleCompleteStep(step.id, data)
                              }
                              loading={loading}
                              showError={showError}
                              disabled={!isOwner}
                              isOwner={isOwner}
                            />
                          )}

                          {step.stepType === "insurance" && (
                            <InsuranceStep
                              travelerIndex={currentTravelerIndex}
                              applicationData={parentVisaApplication}
                              updateCurrentTravelerData={
                                updateCurrentTravelerData
                              }
                              loading={loading}
                              onComplete={(data) => {
                                handleCompleteStep(step.id, data);
                              }}
                              parentVisaApplication={parentVisaApplication}
                              showError={showError}
                              validateInsurance={_validateInsurance}
                              travelerData={currentTravellerForInsurance}
                              disabled={!isOwner || isApplicationSubmitted}
                              isOwner={isOwner}
                              key={currentTravelerIndex}
                              setParentVisaApplication={setParentVisaApplication}
                            />
                          )}

                          {/* Step action buttons (Back / Next) for tab-based steps */}
                          <div className="mt-6 flex justify-between items-center pt-4">
                            <div className="text-sm text-gray-400">
                              {!canCompleteStep(step.stepType) && (
                                <span className="text-orange-400">
                                  ⚠ Please complete all required fields for this
                                  step
                                </span>
                              )}
                              {canCompleteStep(step.stepType) && (
                                <span className="text-green-400">
                                  ✓ All requirements completed for this step
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {step.stepType === "basicDetails" ? (
                                <button
                                  onClick={async () => {
                                    const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                      Math.random() * 1000
                                    )}`;
                                    await _addTraveler(uniqueId);
                                  }}
                                  className="bg-gray-700 text-white px-4 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 transition-colors duration-200"
                                  title="Add Traveller"
                                >
                                  <span className="text-lg">+</span>
                                  <span className="font-medium">
                                    Add Traveller
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => goToPreviousStep()}
                                  className="bg-gray-700 text-white px-4 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
                                >
                                  Back
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleCompleteStep(step.id, {
                                    allTravelersCompleted: true,
                                  })
                                }
                                disabled={
                                  !canCompleteStep(step.stepType) || loading
                                }
                                className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${canCompleteStep(step.stepType) && !loading
                                  ? "bg-[#7350FF] text-white hover:bg-[#7350FF]/90"
                                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                  }`}
                              >
                                {loading ? "Processing..." : "Next"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single traveler or non-tab steps */
                      <>
                        {step.id === 1 && step.stepType === "basicDetails" && (
                          <PassportStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            travelersData={travelersData}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validatePassportData={validatePassportData}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            showError={showError}
                            disabled={!isOwner || isApplicationSubmitted}
                          />
                        )}

                        {step.id === 2 && step.stepType === "visitDetails" && (
                          <VisitStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validateVisitData={validateVisitData}
                            parentVisaApplication={parentVisaApplication}
                            setParentVisaApplication={setParentVisaApplication}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            showError={showError}
                            disabled={!isOwner || isApplicationSubmitted}
                          />
                        )}

                        {step.id === 3 && step.stepType === "documents" && (
                          <DocumentStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validateDocuments={validateDocuments}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            showError={showError}
                            disabled={!isOwner}
                            isOwner={isOwner}
                            totalTraveler={totalTraveler}
                          />
                        )}

                        {step.stepType === "insurance" && (
                          <InsuranceStep
                            travelerIndex={currentTravelerIndex}
                            applicationData={parentVisaApplication}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            loading={loading}
                            onComplete={(data) => {
                              handleCompleteStep(step.id, data);
                            }}
                            parentVisaApplication={parentVisaApplication}
                            showError={showError}
                            validateInsurance={_validateInsurance}
                            travelerData={travelersData[currentTravelerIndex]}
                            disabled={!isOwner || isApplicationSubmitted}
                            isOwner={isOwner}
                            setParentVisaApplication={setParentVisaApplication}
                          />
                        )}

                        {step.id === 4 && step.stepType === "fullPayment" && (
                          <FullPaymentStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            _validateFullPayment={_validateFullPayment}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            parentVisaApplication={parentVisaApplication}
                            showError={showError}
                            travelersData={travelersData}
                            disabled={!isOwner || isApplicationSubmitted}
                            totalTraveler={totalTraveler}
                            paymentData={paymentData}
                            key={currentTravelerIndex}
                          />
                        )}

                        {step.id === 5 && step.stepType === "appointment" && (
                          <BookingAppointment
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validateAppointment={validateAppointment}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            disabled={!isOwner || isApplicationSubmitted}
                            application={parentVisaApplication}
                          />
                        )}

                        {step.id === 6 && step.stepType === "completed" && (
                          <ApplicationCompletedSection
                            parentVisaApplication={parentVisaApplication}
                            applicationId={applicationId}
                            onRefresh={handleRefreshApplication}
                            onAddTraveler={async () => {
                              const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                Math.random() * 1000
                              )}`;
                              await _addTraveler(uniqueId);
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
                        <div className="mt-6 flex justify-between items-center pt-4">
                          {step.stepType !== "completed" && (
                            <div className="text-sm text-gray-400">
                              {!canCompleteStep(step.stepType) && (
                                <span className="text-orange-400">
                                  ⚠ Please complete all required fields for this
                                  step
                                </span>
                              )}
                              {canCompleteStep(step.stepType) && (
                                <span className="text-green-400">
                                  ✓ All requirements completed for this step
                                </span>
                              )}
                            </div>
                          )}
                          {step.stepType !== "appointment" &&
                            step.stepType !== "completed" && (
                              <div className="flex items-center gap-3">
                                {step.stepType === "basicDetails" ? (
                                  <button
                                    onClick={async () => {
                                      const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                        Math.random() * 1000
                                      )}`;
                                      await _addTraveler(uniqueId);
                                    }}
                                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 transition-colors duration-200"
                                    title="Add Traveler"
                                  >
                                    <span className="text-lg">+</span>
                                    <span className="font-medium">
                                      Add Traveler
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => goToPreviousStep()}
                                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
                                  >
                                    Back
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleCompleteStep(step.id, {})
                                  }
                                  disabled={
                                    !canCompleteStep(step.stepType) || loading
                                  }
                                  className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${canCompleteStep(step.stepType) && !loading
                                    ? "bg-[#7350FF] text-white hover:bg-[#7350FF]/90"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                  {loading ? "Processing..." : "Next"}
                                </button>
                              </div>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step Content */}

                {step.open && step.stepType !== "insurance" && (
                  <div className="p-4 border-[#423577] border-t">
                    {/* Tab-based steps for multi-traveler scenarios */}
                    {(step.stepType === "basicDetails" ||
                      step.stepType === "visitDetails" ||
                      step.stepType === "documents") &&
                      numberOfTravelers > 1 ? (
                      <div>
                        {/* Traveler Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#423577] pb-4 items-center">
                          {Array.from({ length: numberOfTravelers })
                            .map((_, index) => {
                              const traveler = travelersData[index];
                              const travelerStepInfo =
                                travelersStepInfo[traveler?.id] ||
                                traveler?.stepInfo ||
                                {};
                              const isCompleted =
                                travelerStepInfo?.completedSteps?.includes(
                                  step.stepType
                                ) || false;


                              return (
                                <div key={index} className="relative group">
                                  <button
                                    onClick={() =>
                                      setCurrentTravelerIndex(index)
                                    }
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${currentTravelerIndex === index
                                      ? "bg-[#6366F1] text-white"
                                      : "bg-[#292933] text-gray-300 hover:bg-[#333340] hover:text-white"
                                      }`}
                                  >
                                    <span>
                                      {travelersData[index]?.basicDetails
                                        ?.firstName
                                        ? `${travelersData[index].basicDetails.firstName}`
                                        : `Traveler ${index + 1}`}
                                    </span>
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
                                  </button>
                                  {numberOfTravelers > 1 &&
                                    step.stepType === "basicDetails" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const travelerName = travelersData[
                                            index
                                          ]?.basicDetails?.firstName
                                            ? `${travelersData[index].basicDetails.firstName}`
                                            : `Traveler ${index + 1}`;

                                          const currentTraveler =
                                            travelersData[index];
                                          if (
                                            currentTraveler?.insurance
                                              ?.insurancePaymentCompleted ||
                                            currentTraveler?.fullPayment
                                              ?.paymentCompleted
                                          ) {
                                            showError(
                                              `Cannot delete ${travelerName} as they have completed payment or insurance purchase.`
                                            );
                                            return;
                                          }

                                          setConfirmationModal({
                                            isOpen: true,
                                            title: `Delete ${travelerName}`,
                                            message: `Are you sure you want to delete ${travelerName}? This action cannot be undone.`,
                                            onConfirm: () => {
                                              const idToRemove = traveler.id;
                                              _removeTraveler(idToRemove);
                                              setConfirmationModal({
                                                ...confirmationModal,
                                                isOpen: false,
                                              });
                                            },
                                          });
                                        }}
                                        title="Remove traveler"
                                        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 shadow-lg"
                                      >
                                        <XIcon className="w-3 h-3" />
                                      </button>
                                    )}
                                </div>
                              );
                            })
                            .filter(Boolean)}
                          {step.stepType === "basicDetails" && parentVisaApplication?.stepInfo?.applicationStatus !== "submitted" && (
                            <button
                              onClick={async () => {
                                const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                  Math.random() * 1000
                                )}`;
                                await _addTraveler(uniqueId);
                              }}
                              className="bg-[#292933] text-gray-300 hover:bg-[#7350FF] hover:text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-colors duration-200 border border-dashed border-gray-500 hover:border-[#7350FF]"
                              title="Add Traveller"
                            >
                              <span className="text-lg">+</span>
                              <span className="font-medium">Add Traveller</span>
                            </button>
                          )}
                          {noOfClaimInsurance > noOfClaimedInsurance &&
                            !travelersData?.[currentTravelerIndex]?.insurance
                              ?.paidInCheckout &&
                            step.stepType === "basicDetails" && (
                              <div className="flex justify-self-end">
                                <div className="relative group pl-2">
                                  <button
                                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2 rounded-lg flex items-center gap-3 font-medium transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 border border-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    onClick={() =>
                                      handleClaimInsurance(
                                        travelersData?.[currentTravelerIndex]
                                      )
                                    }
                                    disabled={isInsuranceAssigning}
                                  >
                                    {isInsuranceAssigning ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span className="font-semibold">
                                      {isInsuranceAssigning ? "Assigning..." : "Assign Insurance"}
                                    </span>
                                  </button>
                                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                      Assign available insurance to this traveler
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div>
                          {step.id === 1 &&
                            step.stepType === "basicDetails" && (
                              <PassportStep
                                travelerIndex={currentTravelerIndex}
                                travelerData={getCurrentTravelerData()}
                                travelersData={travelersData}
                                updateCurrentTravelerData={
                                  updateCurrentTravelerData
                                }
                                validatePassportData={validatePassportData}
                                onComplete={(data) =>
                                  handleCompleteStep(step.id, data)
                                }
                                loading={loading}
                                showError={showError}
                                disabled={!isOwner || isApplicationSubmitted}
                              />
                            )}

                          {step.id === 2 &&
                            step.stepType === "visitDetails" && (
                              <VisitStep
                                travelerIndex={currentTravelerIndex}
                                travelerData={getCurrentTravelerData()}
                                updateCurrentTravelerData={
                                  updateCurrentTravelerData
                                }
                                validateVisitData={validateVisitData}
                                parentVisaApplication={parentVisaApplication}
                                setParentVisaApplication={
                                  setParentVisaApplication
                                }
                                onComplete={(data) =>
                                  handleCompleteStep(step.id, data)
                                }
                                loading={loading}
                                showError={showError}
                                disabled={!isOwner || isApplicationSubmitted}
                              />
                            )}

                          {step.id === 3 && step.stepType === "documents" && (
                            <DocumentStep
                              travelerIndex={currentTravelerIndex}
                              travelerData={getCurrentTravelerData()}
                              updateCurrentTravelerData={
                                updateCurrentTravelerData
                              }
                              validateDocuments={validateDocuments}
                              onComplete={(data) =>
                                handleCompleteStep(step.id, data)
                              }
                              loading={loading}
                              showError={showError}
                              disabled={!isOwner}
                              isOwner={isOwner}
                            />
                          )}

                          {step.stepType === "insurance" && (
                            <InsuranceStep
                              travelerIndex={currentTravelerIndex}
                              applicationData={parentVisaApplication}
                              updateCurrentTravelerData={
                                updateCurrentTravelerData
                              }
                              loading={loading}
                              onComplete={(data) => {
                                handleCompleteStep(step.id, data);
                              }}
                              parentVisaApplication={parentVisaApplication}
                              showError={showError}
                              validateInsurance={_validateInsurance}
                              travelerData={currentTravellerForInsurance}
                              disabled={!isOwner || isApplicationSubmitted}
                              isOwner={isOwner}
                              key={currentTravelerIndex}
                              setParentVisaApplication={setParentVisaApplication}
                            />
                          )}

                          {/* Step action buttons (Back / Next) for tab-based steps */}
                          <div className="mt-6 flex justify-between items-center pt-4">
                            <div className="text-sm text-gray-400">
                              {!canCompleteStep(step.stepType) && (
                                <span className="text-orange-400">
                                  ⚠ Please complete all required fields for this
                                  step
                                </span>
                              )}
                              {canCompleteStep(step.stepType) && (
                                <span className="text-green-400">
                                  ✓ All requirements completed for this step
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {step.stepType === "basicDetails" ? (
                                <button
                                  onClick={async () => {
                                    const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                      Math.random() * 1000
                                    )}`;
                                    await _addTraveler(uniqueId);
                                  }}
                                  className="bg-gray-700 text-white px-4 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 transition-colors duration-200"
                                  title="Add Traveller"
                                >
                                  <span className="text-lg">+</span>
                                  <span className="font-medium">
                                    Add Traveller
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => goToPreviousStep()}
                                  className="bg-gray-700 text-white px-4 py-1.5 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
                                >
                                  Back
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleCompleteStep(step.id, {
                                    allTravelersCompleted: true,
                                  })
                                }
                                disabled={
                                  !canCompleteStep(step.stepType) || loading
                                }
                                className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${canCompleteStep(step.stepType) && !loading
                                  ? "bg-[#7350FF] text-white hover:bg-[#7350FF]/90"
                                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                  }`}
                              >
                                {loading ? "Processing..." : "Next"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single traveler or non-tab steps */
                      <>
                        {step.id === 1 && step.stepType === "basicDetails" && (
                          <PassportStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            travelersData={travelersData}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validatePassportData={validatePassportData}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            showError={showError}
                            disabled={!isOwner || isApplicationSubmitted}
                          />
                        )}

                        {step.id === 2 && step.stepType === "visitDetails" && (
                          <VisitStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validateVisitData={validateVisitData}
                            parentVisaApplication={parentVisaApplication}
                            setParentVisaApplication={setParentVisaApplication}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            showError={showError}
                            disabled={!isOwner || isApplicationSubmitted}
                          />
                        )}

                        {step.id === 3 && step.stepType === "documents" && (
                          <DocumentStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validateDocuments={validateDocuments}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            showError={showError}
                            disabled={!isOwner}
                            isOwner={isOwner}
                            totalTraveler={totalTraveler}
                          />
                        )}

                        {step.stepType === "insurance" && (
                          <InsuranceStep
                            travelerIndex={currentTravelerIndex}
                            applicationData={parentVisaApplication}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            loading={loading}
                            onComplete={(data) => {
                              handleCompleteStep(step.id, data);
                            }}
                            parentVisaApplication={parentVisaApplication}
                            showError={showError}
                            validateInsurance={_validateInsurance}
                            travelerData={currentTravellerForInsurance}
                            disabled={!isOwner || isApplicationSubmitted}
                            isOwner={isOwner}
                            setParentVisaApplication={setParentVisaApplication}
                          />
                        )}

                        {step.id === 4 && step.stepType === "fullPayment" && (
                          <FullPaymentStep
                            travelerIndex={currentTravelerIndex}
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            _validateFullPayment={_validateFullPayment}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            parentVisaApplication={parentVisaApplication}
                            showError={showError}
                            travelersData={travelersData}
                            disabled={!isOwner || isApplicationSubmitted}
                            totalTraveler={totalTraveler}
                            paymentData={paymentData}
                          />
                        )}

                        {step.id === 5 && step.stepType === "appointment" && (
                          <BookingAppointment
                            travelerData={getCurrentTravelerData()}
                            updateCurrentTravelerData={
                              updateCurrentTravelerData
                            }
                            validateAppointment={validateAppointment}
                            onComplete={(data) =>
                              handleCompleteStep(step.id, data)
                            }
                            loading={loading}
                            disabled={!isOwner || isApplicationSubmitted}
                            application={parentVisaApplication}
                          />
                        )}

                        {step.id === 6 && step.stepType === "completed" && (
                          <ApplicationCompletedSection
                            parentVisaApplication={parentVisaApplication}
                            applicationId={applicationId}
                            onRefresh={handleRefreshApplication}
                            onAddTraveler={async () => {
                              const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                Math.random() * 1000
                              )}`;
                              await _addTraveler(uniqueId);
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
                        <div className="mt-6 flex justify-between items-center pt-4">
                          {step.stepType !== "completed" && (
                            <div className="text-sm text-gray-400">
                              {!canCompleteStep(step.stepType) && (
                                <span className="text-orange-400">
                                  ⚠ Please complete all required fields for this
                                  step
                                </span>
                              )}
                              {canCompleteStep(step.stepType) && (
                                <span className="text-green-400">
                                  ✓ All requirements completed for this step
                                </span>
                              )}
                            </div>
                          )}
                          {step.stepType !== "appointment" &&
                            step.stepType !== "completed" && (
                              <div className="flex items-center gap-3">
                                {step.stepType === "basicDetails" ? (
                                  <button
                                    onClick={async () => {
                                      const uniqueId = `traveler_${Date.now()}_${Math.floor(
                                        Math.random() * 1000
                                      )}`;
                                      await _addTraveler(uniqueId);
                                    }}
                                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2 transition-colors duration-200"
                                    title="Add Traveler"
                                  >
                                    <span className="text-lg">+</span>
                                    <span className="font-medium">
                                      Add Traveler
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => goToPreviousStep()}
                                    className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
                                  >
                                    Back
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleCompleteStep(step.id, {})
                                  }
                                  disabled={
                                    !canCompleteStep(step.stepType) || loading
                                  }
                                  className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${canCompleteStep(step.stepType) && !loading
                                    ? "bg-[#7350FF] text-white hover:bg-[#7350FF]/90"
                                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                  {loading ? "Processing..." : "Next"}
                                </button>
                              </div>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                )}


              </div>
            );
          })}
        </div>

        {
          parentVisaApplication?.stepInfo?.completedSteps?.includes("appointment") &&
          !["under_review", "processing", "approved", "rejected", "cancelled"].includes(parentVisaApplication?.applicationStatus) &&
          <div className="flex w-full justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || loading || !isOwner || isApplicationSubmitted}
              className="px-6 py-2 bg-[#7350FF] text-white rounded-md hover:bg-[#7350FF]/90 disabled:bg-[#7350FF]/30 transition-colors"
            >
              {isSubmitting ? "Loading..." : "Submit"}
            </button>
          </div>}


      </div>

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, isOpen: false })
        }
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText="Yes"
        cancelText="No"
        type="danger"
      />
    </div>
  );
};

/* Updated Sub Components */
const PassportStep = ({
  travelerIndex,
  travelerData,
  travelersData,
  updateCurrentTravelerData,
  _validatePassportData,
  onComplete,
  loading,
  _showError,
  disabled = false,
}) => {
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      if (typeof file === "string") {
        resolve(file); // already URL or base64
        return;
      }

      if (file instanceof File) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });
  };

  const handleSave = async () => {
    try {
      const basicDetails = travelerData.basicDetails || {};

      // Convert files to base64 if they exist
      const passportFrontBase64 = await fileToBase64(
        basicDetails.passportFront
      );
      const passportBackBase64 = await fileToBase64(basicDetails.passportBack);

      const updatedBasicDetails = {
        ...basicDetails,
      };

      const updatedTravelersData = travelersData.map((traveler, index) =>
        index === travelerIndex
          ? { ...traveler, basicDetails: updatedBasicDetails }
          : traveler
      );

      updateCurrentTravelerData("basicDetails", updatedBasicDetails);

      const stepData = {
        basicDetails: updatedBasicDetails,
        firstName: updatedBasicDetails.firstName,
        lastName: updatedBasicDetails.lastName,
        passportNumber: updatedBasicDetails.passportNumber,
        sex: updatedBasicDetails.sex,
        dateOfBirth: updatedBasicDetails.dateOfBirth,
        placeOfBirth: updatedBasicDetails.placeOfBirth,
        passportIssuePlace: updatedBasicDetails.passportIssuePlace,
        passportIssueDate: updatedBasicDetails.passportIssueDate,
        passportExpiryDate: updatedBasicDetails.passportExpiryDate,
        currentAddress1: updatedBasicDetails.currentAddress1,
        currentAddress2: updatedBasicDetails.currentAddress2,
        state: updatedBasicDetails.state,
        city: updatedBasicDetails.city,
        pincode: updatedBasicDetails.pincode,
        mobileNumber: updatedBasicDetails.mobileNumber,
        // travelStartDate: updatedBasicDetails.travelStartDate,
        // travelEndDate: updatedBasicDetails.travelEndDate,
        passportFront: passportFrontBase64,
        passportBack: passportBackBase64,
        travelerIndex: travelerIndex,
        updatedTravelersData: updatedTravelersData,
      };

      onComplete(stepData);
    } catch (error) {
      console.error("Error converting files to base64:", error);
    }
  };

  const updateBasicDetails = (data) => {
    if (typeof data === "function") {
      const updatedData = data(travelerData.basicDetails || {});
      updateCurrentTravelerData("basicDetails", updatedData);
    } else {
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
        loading={loading}
        disabled={disabled}
        showIndividualButtons={false}
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
  showError,
  disabled = false,
}) => {
  const visitData = travelerData?.visitDetails || {};

  const setVisitData = (data) => {
    if (typeof data === "function") {
      updateCurrentTravelerData("visitDetails", data(visitData));
    } else {
      updateCurrentTravelerData("visitDetails", data);
    }
  };

  const handleSave = () => {
    const isValid = validateVisitData();
    if (!isValid) {
      console.error("Visit details validation failed");
      if (showError) {
        showError(
          "Please fill in all required visit details before continuing."
        );
      }
      return;
    }

    const stepData = {
      visitingOtherSchengenCountries:
        visitData.visitingOtherSchengenCountries || [],
      firstCountryOfEntry: visitData.firstCountryOfEntry || "",

      hasSchengenVisa: visitData.hasSchengenVisa || "",
      lastVisaStartDate: visitData.lastVisaStartDate || "",
      lastVisaEndDate: visitData.lastVisaEndDate || "",
      hasDigitalFingerprints: visitData.hasDigitalFingerprints || "",
      previousVisaNumber: visitData.previousVisaNumber || "",

      maritalStatus: visitData.maritalStatus || "",
      partnerFullName: visitData.partnerFullName || "",
      partnerDateOfBirth: visitData.partnerDateOfBirth || "",

      employmentStatus: visitData.employmentStatus || "",
      institutionName: visitData.institutionName || "",
      instituteEmail: visitData.instituteEmail || "",
      instituteAddress: visitData.instituteAddress || "",
      employerPhone: visitData.employerPhone || "",
      employerName: visitData.employerName || "",
      employerEmail: visitData.employerEmail || "",
      employerAddress: visitData.employerAddress || "",
      otherEmploymentStatus: visitData.otherEmploymentStatus || "",

      willAnyonePayForVisit: visitData.willAnyonePayForVisit || "",
      fundingPersonName: visitData.fundingPersonName || "",
      tripFundedBy: visitData.tripFundedBy || "",

      travelerIndex: travelerIndex,
    };

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
        disabled={disabled}
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
  showError,
  disabled = false,
  isOwner = true,
  totalTraveler = 1,
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

  const handleUploadSuccess = (_documentData, _docId) => { };

  const handleUploadError = (errorMessage) => {
    console.error("Document upload error:", errorMessage);
  };

  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  return (
    <div>
      <DocumentUploadSection
        key={`documents-${travelerIndex}`}
        documents={documents}
        setDocuments={setDocuments}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        disabled={disabled}
        isOwner={isOwner}
        totalTravelers={totalTraveler}
        loading={loading}
      />

      {saveSuccessMessage && (
        <div className="mt-4 p-3 bg-green-900/10 border border-green-700 rounded text-green-100">
          <div className="flex items-center justify-between">
            <div>{saveSuccessMessage}</div>
            <div>
              <button
                onClick={() => setSaveSuccessMessage("")}
                className="bg-transparent border border-gray-600 text-white px-3 py-1 rounded"
              >
                Upload More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const _InsuranceStep = ({
  travelerIndex,
  travelerData,
  updateCurrentTravelerData,
  onComplete,
  _loading,
  parentVisaApplication,
  missingInsurancePayment,
  disabled = false,
}) => {
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [insuranceOption, setInsuranceOption] = useState(
    travelerData?.insurance?.insurance || ""
  );
  const [uploadedCertificate, setUploadedCertificate] = useState(
    travelerData?.insurance?.insuranceCertificates || null
  );

  // Initialize payment hook
  const { handleCreateDynamicCheckoutSession, cretingDynamicCheckout } =
    useCreateDynamicCheckoutSession();

  const handleSave = () => {
    setPaymentError("");

    // For traveler payment step, we just mark it as completed
    // The actual payment logic is handled by handlePayForTraveler
    const saveData = {
      travelerIndex: travelerIndex,
    };

    if (onComplete) onComplete(saveData);
  };

  // (calculateInsuranceCost removed - per-traveler calculation handled by computeInsuranceBreakdown)

  const handleInsuranceOptionChange = (option) => {
    setInsuranceOption(option);
    updateCurrentTravelerData("insurance", {
      ...travelerData.insurance,
      insurance: option,
    });
  };

  const handleCertificateUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedCertificate(file);
      updateCurrentTravelerData("insurance", {
        ...travelerData.insurance,
        insuranceCertificate: file,
        insuranceDetails: {
          ...travelerData.insurance?.insuranceDetails,
          certificateUploaded: true,
        },
      });
    }
  };

  const handlePurchaseInsurance = async () => {
    setIsPaying(true);
    setPaymentError("");

    try {
      const totalAmount = totalInsuranceCost.toFixed(2);

      await handleCreateDynamicCheckoutSession({
        email: parentVisaApplication?.email || "",
        amount: totalAmount,
        travellers: String(totalTraveler),
        country: parentVisaApplication?.country || "",
        insurance: true,
        applicationId: parentVisaApplication?.id,
        travelerIndex: travelerIndex,
        paymentType: "insurance",
        currency: "EUR",
      });
    } catch (error) {
      console.error("Error creating insurance payment session:", error);
      setPaymentError("Failed to initiate payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  // Compute insurance per traveler from each traveler's travel days × £2
  const computeInsuranceBreakdown = () => {
    const allTravelers = parentVisaApplication?.travelersData || [];
    const msPerDay = 1000 * 60 * 60 * 24;

    const perTravelerCosts = allTravelers.map((trav) => {
      const startRaw = trav?.basicDetails?.travelStartDate;
      const endRaw = trav?.basicDetails?.travelEndDate;

      if (!startRaw || !endRaw) return 0;

      const start = new Date(startRaw);
      const end = new Date(endRaw);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

      // Inclusive days
      const diff = end.getTime() - start.getTime();
      const days = Math.ceil(diff / msPerDay) + 1;
      return days * 2; // £2 per travel day
    });

    const total = perTravelerCosts.reduce((s, v) => s + v, 0);

    // Determine display value for "per traveler" (same value for all travelers?)
    const perTravelerDisplay =
      perTravelerCosts.length > 0 &&
        perTravelerCosts.every((c) => c === perTravelerCosts[0])
        ? perTravelerCosts[0]
        : null;

    return { perTravelerCosts, total, perTravelerDisplay };
  };

  const {
    perTravelerCosts,
    total: totalInsuranceCost,
    perTravelerDisplay,
  } = computeInsuranceBreakdown();

  // Determine application-level insurance paid flag locally (InsuranceStep is a separate component scope)
  const appInsurancePaid =
    parentVisaApplication?.insurance?.insurancePaymentCompleted === true ||
    Number(
      parentVisaApplication?.insurance?.paymentAmount ||
      parentVisaApplication?.initialInsurancePaidTotal ||
      0
    ) > 0;

  // Check if current traveler has insurance paid in checkout
  const currentTravelerInsurance = travelerData?.insurance || {};
  const travelerInsurancePaid =
    currentTravelerInsurance.paidInCheckout ||
    currentTravelerInsurance.insurancePaymentCompleted ||
    Number(currentTravelerInsurance.paymentAmount || 0) > 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Travel Insurance</h2>
        <p className="text-gray-300">
          Choose your travel insurance option for all travelers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insurance Selection */}
        <div className="lg:col-span-2">
          <div className="border-2 border-[#7350FF] rounded-lg p-6 bg-[#423577]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-6 h-6 border-2 border-[#7350FF] rounded-full flex items-center justify-center mr-3">
                  <div className="w-3 h-3 bg-[#7350FF] rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Insurance Coverage
                  </h3>
                  <div className="text-3xl font-bold text-[#7350FF]">
                    £{totalInsuranceCost}
                  </div>
                  {perTravelerDisplay ? (
                    <div className="text-sm text-gray-400">
                      £{perTravelerDisplay} per traveler × {totalTraveler}{" "}
                      traveler{totalTraveler > 1 ? "s" : ""}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      {perTravelerCosts.length > 0 ? (
                        <div className="space-y-1">
                          {perTravelerCosts.map((c, i) => (
                            <div key={i}>
                              Traveler {i + 1}: £{c}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>£0 per traveler</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-400 font-medium">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Comprehensive Coverage
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Summary */}
        <div className="bg-[#292933] rounded-lg p-6 border border-[#423577]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Insurance Summary
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Per Traveler:</span>
              <span className="text-white">
                {perTravelerDisplay ? `£${perTravelerDisplay}` : "Varies"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Travelers:</span>
              <span className="text-white">{totalTraveler}</span>
            </div>
            <div className="border-t border-[#423577] pt-3">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Total:</span>
                <span className="text-[#7350FF]">£{totalInsuranceCost}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Options */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-white mb-4">
          Insurance Options
        </h4>
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-[#423577] rounded-lg hover:bg-[#292933] cursor-pointer bg-[#23232B]">
            <input
              type="radio"
              name={`insurance-${travelerIndex}`}
              value="own"
              checked={insuranceOption === "own"}
              onChange={() => handleInsuranceOptionChange("own")}
              className="mr-3 w-4 h-4 text-[#7350FF] focus:ring-[#7350FF] focus:ring-offset-gray-800"
              disabled={disabled}
            />
            <div>
              <span className="font-medium text-white">
                I have my own insurance
              </span>
              <p className="text-sm text-gray-400">
                Upload your existing insurance certificate
              </p>
            </div>
          </label>

          <label className="flex items-center p-4 border border-[#423577] rounded-lg hover:bg-[#292933] cursor-pointer bg-[#23232B]">
            <input
              type="radio"
              name={`insurance-${travelerIndex}`}
              value="purchase"
              checked={insuranceOption === "purchase"}
              onChange={() => handleInsuranceOptionChange("purchase")}
              className="mr-3 w-4 h-4 text-[#7350FF] focus:ring-[#7350FF] focus:ring-offset-gray-800"
              disabled={disabled}
            />
            <div>
              <span className="font-medium text-white">
                Purchase insurance (£{totalInsuranceCost})
              </span>
              <p className="text-sm text-gray-400">
                Comprehensive travel insurance coverage for all travelers
              </p>
            </div>
          </label>
        </div>

        {insuranceOption === "own" && (
          <div className="mt-4 p-4 bg-[#292933] border border-[#423577] rounded-lg">
            <label className="block text-sm font-medium text-white mb-2">
              Upload Insurance Certificate
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleCertificateUpload}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#7350FF] file:text-white hover:file:bg-[#7350FF]/90"
              disabled={disabled}
            />
            {uploadedCertificate && (
              <div className="mt-2 p-2 bg-green-900/20 border border-green-700 rounded-md">
                <p className="text-sm text-green-400">
                  ✓ Certificate uploaded: {uploadedCertificate.name}
                </p>
              </div>
            )}
          </div>
        )}

        {insuranceOption === "purchase" && missingInsurancePayment && (
          <div className="mt-4 p-4 bg-[#292933] border border-[#423577] rounded-lg">
            <button
              onClick={handlePurchaseInsurance}
              disabled={isPaying || cretingDynamicCheckout || disabled}
              className="w-full bg-[#7350FF] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#7350FF]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPaying || cretingDynamicCheckout ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing Payment...
                </>
              ) : (
                `Pay £${totalInsuranceCost} for Insurance`
              )}
            </button>
            {paymentError && (
              <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-sm text-red-400">{paymentError}</p>
              </div>
            )}
          </div>
        )}

        {insuranceOption === "purchase" && appInsurancePaid && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-400 font-medium">
                Insurance payment completed
              </span>
            </div>
          </div>
        )}

        {insuranceOption === "purchase" &&
          travelerInsurancePaid &&
          !appInsurancePaid && (
            <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-400 font-medium">
                  Insurance payment completed
                  {currentTravelerInsurance.paidInCheckout
                    ? " (paid in checkout)"
                    : ""}
                </span>
              </div>
            </div>
          )}
      </div>

      {/* Continue Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={disabled}
          className="bg-[#7350FF] text-white py-3 px-8 rounded-lg font-semibold hover:bg-[#7350FF]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const FullPaymentStep = ({
  travelerIndex,
  travelerData,
  onComplete,
  _loading,
  parentVisaApplication,
  travelersData,
  _validateFullPayment,
  disabled = false,
  totalTraveler = 1,
}) => {
  const { paymentData } = useCalculatePayment(
    parentVisaApplication?.id
  )
  const [paymentError, setPaymentError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [appliedDiscount, setAppliedDiscountLocal] = useState(null);
  const [couponCode, setCouponCodeLocal] = useState("");
  const [couponError, setCouponError] = useState("");
  const [userEmail, setUserEmailLocal] = useState("");
  const [_studentEmail, _setStudentEmail] = useState("");
  const [_studentOtp, _setStudentOtp] = useState("");
  const [studentVerified, setStudentVerified] = useState(false);
  const [_isVerifyingOtp, _setIsVerifyingOtp] = useState(false);
  // Initialize payment hook
  const { handleCreateDynamicCheckoutSession } =
    useCreateDynamicCheckoutSession();

  const {
    emailError,
    isSendingVerification,
    sendStudentVerification,
    setEmailError,
    setIsSendingVerification,
    setStudentVerificationSent,
    studentVerificationSent,
  } = useSendStudentVerification();

  const applyCouponCode = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    const availableDiscounts = {
      STUDENT10: {
        description: "Student discount",
        percentage: 10,
      },
      GROUP20: {
        description: "Group discount (3+ travellers)",
        percentage: 20,
        requiresMinTravellers: 3,
      },
    };

    const discount = availableDiscounts[couponCode.toUpperCase()];

    if (!discount) {
      setCouponError("Invalid coupon code");
      return;
    }

    const totalAmount = calculateTotalPayment(discount);

    // for Group20 must be 3 traveller
    if (
      discount.requiresMinTravellers &&
      totalTraveler < discount.requiresMinTravellers
    ) {
      setCouponError(
        `Coupon code requires at least ${discount.requiresMinTravellers} travellers`
      );
      return;
    }

    setAppliedDiscountLocal(discount);
    setCouponError("");
  };

  const removeCoupon = () => {
    setAppliedDiscountLocal(null);
    setCouponCodeLocal("");
    setCouponError("");
  };

  // Get payment tracking data from backend
  const initiallyPaidTraveler =
    parentVisaApplication?.initiallyPaidTraveler || 0;
  const amountPaidTotal =
    parentVisaApplication?.amountPaidTotal ||
    parentVisaApplication?.amountPaid ||
    "0";

  // Get travel base cost from API/application data with fallback
  const baseCosts = travelerData?.payment || {};
  const getBaseTravelCost = () => {
    // Try to get from application data first (like from checkout)
    const appAmountPaid = parseFloat(parentVisaApplication?.amountPaid || "0");
    const initiallyPaid = parentVisaApplication?.initiallyPaidTraveler || 1;

    if (appAmountPaid > 0 && initiallyPaid > 0) {
      return (appAmountPaid / initiallyPaid).toFixed(2); // Per traveler cost from API
    }

    // Fallback to traveler payment data or default
    if (baseCosts.grandTotal) {
      return Math.round(baseCosts.grandTotal);
    }

    // Final fallback (original cost structure)
    const teleportFee = Math.round(baseCosts.teleportFee ?? 1524.6);
    const cgst = Math.round(baseCosts.cgst ?? 137.2);
    const sgst = Math.round(baseCosts.sgst ?? 137.2);
    return teleportFee + cgst + sgst;
  };

  const teleportTotalEUR = getBaseTravelCost();

  // Count travelers who need insurance (no insurance document uploaded AND no application-level insurance paid)
  const getTravelersNeedingInsurance = () => {
    // Check if insurance is already paid at application level
    const appInsurancePaid =
      Number(parentVisaApplication?.initialInsurancePaidTotal || 0) > 0 ||
      parentVisaApplication?.insurance?.insurancePaymentCompleted === true;
    if (appInsurancePaid) return 0;

    return travelersData.filter((traveler) => {
      const travelerInsurance = traveler?.insurance || {};
      const documents = traveler?.documents?.documents || {};

      // Skip if traveler has insurance paid in checkout or individually
      if (
        travelerInsurance.paidInCheckout ||
        travelerInsurance.insurancePaymentCompleted
      ) {
        return false;
      }

      // Check if this traveler has insurance documents uploaded
      const hasInsuranceDocuments =
        documents["6"] ||
        Object.keys(documents).some(
          (key) => key.toLowerCase().includes("insurance") && documents[key]
        );

      return !hasInsuranceDocuments;
    }).length;
  };

  // Determine what needs payment
  const hasAnyPayment = parseFloat(amountPaidTotal) > 0;
  const missingTravelerPayment =
    !hasAnyPayment ||
    initiallyPaidTraveler === 0 ||
    initiallyPaidTraveler < totalTraveler;

  // Check if this traveler needs payment
  const unpaidTravelers = Math.max(0, totalTraveler - initiallyPaidTraveler);
  const isAdditionalTraveler = travelerIndex >= initiallyPaidTraveler;

  // Check if payment is already completed - only if ALL required payments are made
  const fullPayment = travelerData?.fullPayment || {};
  const travelerPaymentCompleted =
    fullPayment.paymentCompleted || fullPayment.paymentStatus === "completed";

  // Payment is only truly completed when all traveler payments are done AND no insurance payment needed
  const isPaymentCompleted =
    travelerPaymentCompleted && !missingTravelerPayment;

  const handlePayForTraveler = async () => {
    setIsPaying(true);
    setPaymentError("");

    try {
      // Calculate total payment including insurance if documents not uploaded
      const totalAmount = calculateTotalPayment();

      // Create checkout session via hook with normalized metadata
      await handleCreateDynamicCheckoutSession({
        email: parentVisaApplication?.email || "",
        amount: totalAmount.toFixed(2),
        travellers: String(totalTraveler),
        country: parentVisaApplication?.country || "",
        insurance: travelersNeedingInsurance > 0, // Include insurance if any travelers need it
        applicationId: parentVisaApplication?.id,
        travelerIndex: travelerIndex,
        paymentType: "full_payment",
        currency: "EUR",
        travelData: parentVisaApplication?.travelersData?.map((item) => ({
          ...item,
          fullPayment: {
            ...item.fullPayment,
            paymentAmount:
              Number(item.fullPayment) > 0
                ? Number(totalAmount)
                : Number(teleportTotalEUR),
            paymentCompleted: item.fullPayment?.paymentCompleted || true,
            paymentStatus: "completed",
            paymentMethod: "stripe",
            paymentDate: new Date().toISOString(),
          },
        })),
      });
    } catch (error) {
      console.error("Error creating full payment session:", error);
      setPaymentError("Failed to initiate payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  // Calculate travel days from traveler data
  const calculateTravelDays = () => {
    const currentTraveler = travelersData[travelerIndex] || travelersData[0];
    const startDate = currentTraveler?.basicDetails?.travelStartDate;
    const endDate = currentTraveler?.basicDetails?.travelEndDate;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
      return diffDays > 0 ? diffDays : 1; // Minimum 1 day
    }

    return 1; // Default to 1 day if no dates available
  };

  const handleSave = () => {
    setPaymentError("");

    // For full payment step, we just mark it as completed
    const saveData = {
      travelerIndex: travelerIndex,
    };

    if (onComplete) onComplete(saveData);
  };

  // Check insurance status with improved logic
  const appInsurance = parentVisaApplication?.insurance;
  const isInsurancePaid =
    appInsurance?.insurancePaymentCompleted === true ||
    Number(parentVisaApplication?.initialInsurancePaidTotal || 0) > 0;
  const hasInsuranceDocuments = travelersData.some((traveler) => {
    const documents = traveler?.documents?.documents || {};
    return (
      documents["6"] ||
      Object.keys(documents).some(
        (key) => key.toLowerCase().includes("insurance") && documents[key]
      )
    );
  });

  // Check if any travelers have individual insurance paid
  const hasIndividualInsurancePaid = travelersData.some((traveler) => {
    const insurance = traveler?.insurance || {};
    return insurance.paidInCheckout || insurance.insurancePaymentCompleted;
  });

  const insuranceHandled =
    isInsurancePaid || hasInsuranceDocuments || hasIndividualInsurancePaid;

  // Show completion only if ALL payments (travel + insurance) are done

  const calculateTotalPayment = () => {
    const total =
      paymentData?.fullRemainingPayment

    if (appliedDiscount && appliedDiscount.percentage) {
      const discountAmount = (total * appliedDiscount.percentage) / 100;
      return total - discountAmount;
    }

    return total;
  };


  const travelerCount =
    missingTravelerPayment || isAdditionalTraveler
      ? isAdditionalTraveler
        ? 1
        : unpaidTravelers
      : 0;
  const travelDays = calculateTravelDays();
  const insurancePerTraveler = travelDays * 2;
  const travelersNeedingInsurance = getTravelersNeedingInsurance();

  useEffect(() => {
    try {
      const key = "nuvisa.verifiedStudentEmail";
      const raw = localStorage.getItem(key);

      if (raw) {
        const payload = JSON.parse(raw);
        if (
          payload &&
          payload.email &&
          payload.expiresAt &&
          Date.now() < payload.expiresAt
        ) {
          setStudentVerified(true);
          setStudentVerificationSent(false);

          try {
            if (!userEmail && payload.email) setUserEmailLocal(payload.email);
          } catch { }

          if (
            !appliedDiscount ||
            (appliedDiscount && appliedDiscount.code !== "STUDENT10")
          ) {
            setAppliedDiscountLocal({
              code: "STUDENT10",
              percentage: 10,
              description: "Student discount",
            });
            setCouponCodeLocal("STUDENT10");
          }
        }
      }
    } catch { }
  }, []);

  useEffect(() => {
    const token = localStorageGateway("token", localStorageEnums.GET);
    if (parentVisaApplication?.id) {
      getVisaApplication(token, {
        id: parentVisaApplication?.id
      })
    }
  }, [parentVisaApplication]);


  const allPayments = parentVisaApplication?.travelersData?.map((el) => ({
    payment: el?.fullPayment,
    name: el.basicDetails.firstName
  }))

  const allPaymentsCompleted = allPayments?.every((el) => el?.payment?.paymentCompleted === true)


  const unpaidPayment = allPayments?.filter((el) => el?.payment?.paymentCompleted === false)


  const paidPayment = allPayments?.filter((el) => el?.payment?.paymentCompleted === true)

  const paidPaymentAmount = allPayments?.filter((el) => el?.payment?.paymentCompleted === true).reduce((acc, curr) => {
    return acc + (curr?.payment?.paymentAmount || 0);
  }, 0);

  const paymentFees = appliedDiscount && appliedDiscount.percentage ? 159 - (159 * appliedDiscount.percentage) / 100 : 159;

  const totalPaymentDue = unpaidPayment?.reduce((acc, curr) => acc + paymentFees, 0)

  const calculatePaidToPayment = () => {
    if (unpaidPayment?.length === 0) return 0;
    return unpaidPayment?.length * paymentFees
  }


  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Payment</h2>
        <p className="text-gray-300">
          Complete your full payment to proceed with the application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Plan Selection */}
        <div className={` ${allPaymentsCompleted ? 'flex items-center justify-between gap-4 col-span-2' : 'lg:col-span-1 flex flex-col gap-4'}`}>
          <div className="border-2 border-[#7350FF] rounded-lg p-6 bg-[#423577]/20 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#7350FF] rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#7350FF] rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Payment</h3>
                  <div className="text-3xl font-bold text-[#7350FF]">
                    £{
                      unpaidPayment?.length > 0 ?
                        calculatePaidToPayment()?.toFixed(2) : paidPaymentAmount?.toFixed(2)
                    }
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-start">Pay nothing later</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full items-center  ">
            {
              paidPayment?.map((el) => {
                return <div className={`flex items-center justify-betweeen gap-6 ${el.paymentCompleted ? 'text-green-600' : ""
                  }`}>
                  <span>{el.name}</span>
                  <div className="flex items-center gap-2">
                    <span className=" text-gray-400">
                      {
                        el.payment?.paymentCompleted ? `£${el.payment?.paymentAmount || 0}` : `£${paymentFees}`
                      }
                    </span>
                    {el.payment.paymentCompleted && (
                      <span className="bg-green-900/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                        Paid
                      </span>
                    )}
                  </div>
                </div>
              })
            }
          </div>
        </div>

        {/* Payment Summary */}
        {!allPaymentsCompleted && <div className="bg-[#292933] rounded-lg p-6 border border-[#423577]">
          {!paymentData.allPaymentCompleted && (
            <div className="flex flex-col gap-4 pb-4">
              <h3 className="text-lg font-semibold text-white">Summary</h3>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCodeLocal(e.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code (e.g., STUDENT10)"
                    className={`w-full border ${couponError ? "border-red-400" : "border-gray-500"
                      } bg-[#24242D] text-white rounded-md p-2 text-sm ${couponError
                        ? "outline-none ring-2 ring-red-400"
                        : "focus:outline-none focus:ring-2 focus:ring-purple-500"
                      }`}
                    disabled={appliedDiscount}
                  />
                </div>
                {!appliedDiscount ? (
                  <button
                    onClick={applyCouponCode}
                    className="px-4 py-2 bg-[#7350FF] text-white text-sm rounded-md hover:opacity-0.9 transition-colors font-medium"
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    onClick={removeCoupon}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {couponError && (
                <span className="text-sm text-red-400">{couponError}</span>
              )}

              {appliedDiscount && (
                <div className="flex items-center space-x-2 text-sm text-green-400 bg-green-600/20 p-2 rounded-md">
                  <span>
                    ✓ {appliedDiscount.description} (
                    {appliedDiscount.percentage}% off) applied!
                  </span>
                </div>
              )}
            </div>
          )}

          {appliedDiscount &&
            !paymentData.allPaymentCompleted &&
            appliedDiscount.description.toLowerCase().includes("student") && (
              <div className="space-y-3 mb-6">
                <h2 className="font-medium text-lg">
                  Student Verification Required
                </h2>
                <div className="space-y-2">
                  <div className="text-sm text-yellow-300 mb-2">
                    <span className="font-medium">📧 Email Verification</span> -
                    Please verify your student email to continue with the
                    discount
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmailLocal(e.target.value)}
                        placeholder="Enter your student email (e.g., you@student.uni.ac.uk)"
                        className={`w-full border ${emailError ? "border-red-400" : "border-gray-500"
                          } bg-[#24242D] text-white rounded-md p-2 text-sm ${emailError
                            ? "outline-none ring-2 ring-red-400"
                            : "focus:outline-none focus:ring-2 focus:ring-purple-500"
                          }`}
                        disabled={studentVerified}
                      />
                    </div>
                    {!studentVerified ? (
                      <button
                        onClick={() =>
                          sendStudentVerification(
                            userEmail,
                            `/application-step?application_id=${parentVisaApplication?.id}`
                          )
                        }
                        disabled={isSendingVerification || !userEmail}
                        className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {isSendingVerification ? "Sending..." : "Verify Email"}
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-green-600 text-white text-sm rounded-md flex items-center">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {emailError && (
                    <span className="text-sm text-red-400">{emailError}</span>
                  )}

                  {studentVerificationSent && !studentVerified && (
                    <div className="text-sm text-green-400 bg-green-600/20 p-2 rounded-md">
                      ✓ Verification email sent! Please check your inbox and
                      click the verification link.
                    </div>
                  )}

                  {studentVerified && (
                    <div className="text-sm text-green-400 bg-green-600/20 p-2 rounded-md">
                      ✓ Student email verified! You can now proceed with the
                      student discount.
                    </div>
                  )}
                </div>
              </div>
            )}

          <div className="space-y-3 mb-6">


            <div className="flex flex-col gap-2">
              {
                unpaidPayment?.map((el) => {
                  return <div className={`flex items-center justify-betweeen gap-6 ${el.paymentCompleted ? 'text-green-600' : ""
                    }`}>
                    <span>{el.name}</span>
                    <div className="flex items-center gap-2">
                      <span className=" text-gray-400">
                        {
                          el.payment?.paymentCompleted ? `£${el.payment?.paymentAmount || 0}` : `£${paymentFees}`
                        }
                      </span>
                      {el.payment.paymentCompleted && (
                        <span className="bg-green-900/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                })
              }
            </div>


            {appliedDiscount && !paymentData.allPaymentCompleted && (
              <div className="border-t border-[#423577] pt-3">
                <div className="flex justify-between text-sm text-green-400">
                  <span>
                    {appliedDiscount.description} ({appliedDiscount.percentage}%
                    off)
                  </span>
                  <span>
                    -£
                    {(
                      ((paymentData?.fullRemainingPayment || 0)) *
                      (appliedDiscount.percentage / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}


            <div className="w-full h-[1px] bg-gray-200"></div>

            <div className="flex justify-between text-lg font-semibold text-white">
              <span></span>
              <span>
                {
                  unpaidPayment?.length > 0
                    ? `Total Due: £${totalPaymentDue.toFixed(2)}`
                    : `Total Paid: £${paidPaymentAmount}`
                }
              </span>

            </div>

            {allPaymentsCompleted && (
              <span className="flex items-center gap-2 py-2">
                <LockIcon />{" "}
                <span className="text-sm text-gray-400">
                  All payments completed. You may now proceed.
                </span>
              </span>
            )}

            <button
              onClick={
                !paymentData.allPaymentCompleted
                  ? handlePayForTraveler
                  : handleSave
              }
              disabled={
                unpaidPayment?.length === 0
              }
              className="w-full bg-[#7350FF] text-white py-3 rounded-lg font-semibold text-lg mt-6 hover:bg-[#7350FF]/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isPaying
                ? "Processing..."
                : totalPaymentDue > 0
                  ? `Pay £${totalPaymentDue.toFixed(2)}`
                  : "Continue"}
            </button>

            {paymentError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-400 text-sm">{paymentError}</p>
              </div>
            )}
          </div>
        </div>}
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
