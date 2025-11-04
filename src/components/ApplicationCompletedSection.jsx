import React, { useState, useEffect } from "react";
import ClientOnly from "./ClientOnly";
import Router from "next/router";
import StatusTracker from "./StatusTracker";
import {
  CheckCircle,
  Clock,
  FileText,
  UserPlus,
  Upload,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Plus,
  Download,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { getApplicationStatus } from "@/api/applicationStatus";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";

const ApplicationCompletedSection = ({
  parentVisaApplication = null,
  onAddTraveler = null,
  onUploadDocument = null,
  onRefresh = null,
  applicationId = null
}) => {
  const formatApplicationId = (rawId) => {
    if (!rawId) return null;
    if (/^AI\d{8}$/i.test(String(rawId))) return String(rawId);
    const numericTail = (source, length) => {
      let digits = String(source).replace(/\D+/g, "");
      if (digits.length < length) {
        const codes = Array.from(String(source))
          .map((c) => c.charCodeAt(0))
          .join("");
        digits = (digits + codes).replace(/\D+/g, "");
      }
      if (!digits.length) {
        digits = "0".repeat(length);
      }
      return digits.slice(-length).padStart(length, "0");
    };
    return `AI${numericTail(rawId, 8)}`;
  };

  const formatOrderId = (orderId, fallbackId) => {
    if (orderId && /^ORD\d{6}$/.test(orderId)) return orderId;
    if (orderId && /^ORD-?\d+$/i.test(orderId)) {
      const digits = orderId.replace(/\D/g, "").slice(0, 6).padEnd(6, "0");
      return `ORD${digits}`;
    }
    if (fallbackId) {
      const digits = (fallbackId + "").replace(/\D/g, "").slice(0, 6).padEnd(6, "0");
      return `ORD${digits}`;
    }
    return null;
  };
  const [referenceNumber, setReferenceNumber] = useState("UKV-2023-XXXX");
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTravelerModal, setShowAddTravelerModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const route = Router;
  const token = localStorageGateway("token", localStorageEnums.GET);

  const fetchApplicationStatus = async () => {
    const appId = applicationId || parentVisaApplication?.id;

    if (!appId) {
      setApplicationStatus(null);
      setLoading(false);
      return;
    }

    const mapApplicationToStatus = (app) => {
      if (!app) return null;
      const stepInfo = app.stepInfo || app.applicationData?.stepInfo || {};

      let currentStage = stepInfo.currentStep || app.currentStage || null;
      if (
        stepInfo.stepNames &&
        stepInfo.currentStep &&
        stepInfo.stepNames[stepInfo.currentStep]
      ) {
        currentStage = stepInfo.stepNames[stepInfo.currentStep];
      }

      const statusToProgress = (status) => {
        const s = (status || "").toString().toLowerCase();
        switch (s) {
          case "submitted":
            return 25;
          case "under_review":
            return 50;
          case "appointment_booked":
          case "appointment booked":
            return 75;
          case "at_embassy":
          case "at embassy":
            return 90;
          case "payment_required":
            return 75;
          case "approved":
          case "rejected":
            return 100;
          default:
            // Prefer explicit mapping; fall back conservatively
            const fallback = stepInfo.stepProgress || app.progress || app.stepProgress || 0;
            return Math.min(Number(fallback) || 0, 99);
        }
      };

      return {
        id: app.id,
        status: app.applicationStatus || app.status || app.applicationData?.applicationStatus || "submitted",
        submittedAt: app.createdAt || app.submittedAt || app.applicationData?.createdAt || null,
        estimatedProcessingTime: app.estimatedProcessingTime || null,
        orderId: app.orderId || app.order_id || app.applicationData?.orderId || null,
        applicationNo: app.applicationNo || app.application_no || app.applicationNumber || app.application_number || null,
        formattedApplicationId: formatApplicationId(app.id),
        currentStage: currentStage || "Under review",
        progress: statusToProgress(app.applicationStatus || app.status || app.applicationData?.applicationStatus) || 0,
        nextSteps: stepInfo.nextStep ? [stepInfo.nextStep] : stepInfo.nextSteps || [],
        raw: app,
      };
    };

    try {
      setRefreshing(true);

      console.info("Fetching application status", { appId, tokenPresent: !!token });
      const response = await getApplicationStatus(token || null, appId);
      console.info("getApplicationStatus response summary:", response && {
        success: response.success,
        dataKeys: response.data ? Object.keys(response.data) : null,
        error: response.error || null,
      });

      if (response?.success && response.data) {
        const rawApp =
          response.data.results?.application || response.data.application || response.data.applicationData || response.data;

        const mapped = mapApplicationToStatus(rawApp);
        if (mapped) {
          setApplicationStatus(mapped);
        } else {
          console.error("API returned success but mapping failed:", response.data);
          if (parentVisaApplication) {
            const mappedParent = mapApplicationToStatus(parentVisaApplication);
            setApplicationStatus(mappedParent);
          } else {
            setApplicationStatus(null);
          }
        }
      } else {
        console.error("Failed to fetch application status:", response?.error || response);
        if (parentVisaApplication) {
          const mapped = mapApplicationToStatus(parentVisaApplication);
          setApplicationStatus(mapped);
        } else {
          setApplicationStatus(null);
        }
      }
    } catch (error) {
      console.error("Error fetching application status:", error);
      setApplicationStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Generate reference number client-side to avoid hydration mismatch
    const randomNum = Math.floor(Math.random() * 10000);
    setReferenceNumber(`UKV-2023-${randomNum}`);

    fetchApplicationStatus();
  }, [applicationId, parentVisaApplication, token]);

  // Add effect to re-fetch status when parentVisaApplication changes
  useEffect(() => {
    if (parentVisaApplication?.id) {
      fetchApplicationStatus();
    }
  }, [parentVisaApplication?.applicationStatus, parentVisaApplication?.id]);

  const handleRefreshStatus = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchApplicationStatus();
    }
  };

  const handleAddTraveler = () => {
    setShowAddTravelerModal(true);
    // Call parent callback if provided
    if (onAddTraveler) {
      onAddTraveler();
    }
  };

  const handleUploadDocument = () => {
    setShowUploadModal(true);
    // Call parent callback if provided
    if (onUploadDocument) {
      onUploadDocument();
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "submitted":
        return {
          color: "text-green-400",
          bgColor: "bg-green-400/10",
          borderColor: "border-green-400/20",
          icon: CheckCircle,
          message: "Application Successfully Submitted"
        };
      case "under_review":
        return {
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
          borderColor: "border-blue-400/20",
          icon: Clock,
          message: "Application Under Review"
        };
      case "payment_required":
        return {
          color: "text-yellow-400",
          bgColor: "bg-yellow-400/10",
          borderColor: "border-yellow-400/20",
          icon: AlertCircle,
          message: "Payment Required"
        };
      case "approved":
        return {
          color: "text-green-400",
          bgColor: "bg-green-400/10",
          borderColor: "border-green-400/20",
          icon: CheckCircle,
          message: "Application Approved"
        };
      case "rejected":
        return {
          color: "text-red-400",
          bgColor: "bg-red-400/10",
          borderColor: "border-red-400/20",
          icon: AlertCircle,
          message: "Application Rejected"
        };
      default:
        return {
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
          borderColor: "border-gray-400/20",
          icon: Clock,
          message: "Processing Application"
        };
    }
  };

  // Use applicationStatus from our existing endpoint
  const currentStatus = applicationStatus;
  const statusConfig = getStatusConfig(currentStatus?.status);
  const StatusIcon = statusConfig.icon;


  if (loading) {
    return (
      <div className="w-full mx-auto bg-[#23232B] border border-[#423577] rounded-lg p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#7350FF] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300">Loading application status...</p>
      </div>
    );
  }

  if (!applicationStatus) {
    return (
      <div className="w-full mx-auto bg-[#23232B] border border-[#423577] rounded-lg p-8 text-center">
        <h3 className="text-lg font-gilroy-bold text-white mb-2">Application status unavailable</h3>
        <p className="text-gray-300 mb-4">We couldn't load the application status from the server. Please try refreshing or contact support.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleRefreshStatus}
            className="flex items-center gap-2 bg-[#7350FF] text-white py-2 px-4 rounded-md hover:bg-[#6350E5] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => route.push("/support")}
            className="flex items-center gap-2 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Main Status Card */}
      <div className={`bg-[#23232B] border ${statusConfig.borderColor} rounded-lg p-8 text-center ${statusConfig.bgColor}`}>
        <div className="mb-6">
          <div className={`w-16 h-16 ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 rounded-full mx-auto flex items-center justify-center mb-4`}>
            <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
          </div>
          <h2 className="text-2xl font-gilroy-bold text-white mb-2">
            {statusConfig.message}
          </h2>
          <p className="text-gray-300">
            Your visa application has been received and is being processed.
          </p>
        </div>

        {/* Application Details */}
        <div className="bg-[#1E1E27] border border-[#423577] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-gilroy-bold text-white">Application Details</h3>

          </div>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="text-sm text-gray-400">Application ID</label>
              <p className="text-white font-medium">
                <ClientOnly fallback={referenceNumber}>
                  {currentStatus?.applicationNo || currentStatus?.formattedApplicationId || formatApplicationId(currentStatus?.id)}
                </ClientOnly>
              </p>
            </div>
            {(currentStatus?.formattedOrderId || currentStatus?.orderId) && <div>
              <label className="text-sm text-gray-400">Order ID</label>
              <p className="text-white font-medium">
                {currentStatus?.formattedOrderId || formatOrderId(currentStatus?.orderId) || "N/A"}
              </p>
            </div>}
            <div>
              <label className="text-sm text-gray-400">Submitted On</label>
              <p className="text-white font-medium">
                {new Date(currentStatus?.submittedAt || new Date()).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Status</label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${statusConfig.bgColor} rounded-full`}></div>
                <p className={`font-medium ${statusConfig.color}`}>
                  {currentStatus?.status?.replace('_', ' ')?.toUpperCase()}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Estimated Processing</label>
              <p className="text-white font-medium">
                {currentStatus?.estimatedProcessingTime || "24 working hours"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {!!currentStatus?.progress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Progress</label>
                <span className="text-sm text-white">{currentStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-[#7350FF] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentStatus.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => route.push("/dashboard")}
            className="bg-[#7350FF] text-white py-3 px-6 rounded-md hover:bg-[#6350E5] transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Dashboard
          </button>
        </div>
      </div>

      {/* Status Tracker */}
      <StatusTracker
        applicationId={currentStatus?.id}
        initialStatus={currentStatus}
        onRefresh={handleRefreshStatus}
        className="mb-6"
      />

      {/* Modals */}
      {showAddTravelerModal && (
        <AddTravelerModal
          onClose={() => setShowAddTravelerModal(false)}
          onAdd={handleAddTraveler}
        />
      )}

      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadDocument}
        />
      )}
    </div>
  );
};

// Add Traveler Modal Component
const AddTravelerModal = ({ onClose, onAdd }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-gilroy-bold text-white">Add Another Traveler</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className="text-gray-300 mb-6">
          This will add a new traveler to your existing application. Additional fees may apply.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onAdd();
              onClose();
            }}
            className="flex-1 bg-[#7350FF] text-white py-2 px-4 rounded-md hover:bg-[#6350E5] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Upload Document Modal Component
const UploadDocumentModal = ({ onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#23232B] border border-[#423577] rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-gilroy-bold text-white">Upload Additional Document</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="border-2 border-dashed border-[#423577] rounded-lg p-6 text-center mb-4">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="additional-document-upload"
          />
          <label
            htmlFor="additional-document-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-white font-medium">Click to upload document</span>
            <span className="text-gray-400 text-sm mt-1">PDF, JPG, PNG, DOC up to 10MB</span>
          </label>
        </div>

        {selectedFile && (
          <div className="bg-green-900/20 border border-green-600 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Selected: {selectedFile.name}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCompletedSection;
