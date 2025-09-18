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
  applicationId = null
}) => {
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
      // Generate demo data if no application ID
      setTimeout(() => {
        const randomNum = Math.floor(Math.random() * 10000);
        setApplicationStatus({
          id: `APP-${randomNum}`,
          status: "submitted",
          submittedAt: new Date().toISOString(),
          estimatedProcessingTime: "10-15 business days",
          orderId: `ORD-${randomNum}`,
          currentStage: "Document Verification",
          progress: 25,
          nextSteps: [
            "Document verification in progress",
            "Biometric appointment (if required)", 
            "Application review by consulate",
            "Decision notification"
          ]
        });
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      setRefreshing(true);
      
      if (token) {
        const response = await getApplicationStatus(token, appId);
        if (response?.success) {
          setApplicationStatus(response.data);
        } else {
          console.error("Failed to fetch application status:", response?.error);
          // Use parentVisaApplication data as fallback
          if (parentVisaApplication) {
            setApplicationStatus({
              id: parentVisaApplication.id,
              status: parentVisaApplication.applicationStatus || "submitted",
              submittedAt: parentVisaApplication.createdAt || new Date().toISOString(),
              estimatedProcessingTime: "10-15 business days",
              orderId: parentVisaApplication.orderId || `ORD-${parentVisaApplication.id}`,
              currentStage: "Document Verification",
              progress: 25,
              nextSteps: [
                "Document verification in progress",
                "Biometric appointment (if required)",
                "Application review by consulate", 
                "Decision notification"
              ]
            });
          }
        }
      } else {
        // No token, use parentVisaApplication data
        if (parentVisaApplication) {
          setApplicationStatus({
            id: parentVisaApplication.id,
            status: parentVisaApplication.applicationStatus || "submitted",
            submittedAt: parentVisaApplication.createdAt || new Date().toISOString(),
            estimatedProcessingTime: "10-15 business days",
            orderId: parentVisaApplication.orderId || `ORD-${parentVisaApplication.id}`,
            currentStage: "Document Verification",
            progress: 25,
            nextSteps: [
              "Document verification in progress",
              "Biometric appointment (if required)",
              "Application review by consulate",
              "Decision notification"
            ]
          });
        }
      }

    } catch (error) {
      console.error("Error fetching application status:", error);
      // Use parentVisaApplication as fallback
      if (parentVisaApplication) {
        setApplicationStatus({
          id: parentVisaApplication.id,
          status: parentVisaApplication.applicationStatus || "submitted",
          submittedAt: parentVisaApplication.createdAt || new Date().toISOString(),
          estimatedProcessingTime: "10-15 business days",
          orderId: parentVisaApplication.orderId || `ORD-${parentVisaApplication.id}`,
          currentStage: "Document Verification",
          progress: 25,
          nextSteps: [
            "Document verification in progress",
            "Biometric appointment (if required)",
            "Application review by consulate",
            "Decision notification"
          ]
        });
      }
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

  const handleRefreshStatus = () => {
    fetchApplicationStatus();
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
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="flex items-center gap-2 text-[#7350FF] hover:text-[#6350E5] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="text-sm text-gray-400">Application ID</label>
              <p className="text-white font-medium">
                <ClientOnly fallback={referenceNumber}>
                  {currentStatus?.id || parentVisaApplication?.id || referenceNumber}
                </ClientOnly>
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Order ID</label>
              <p className="text-white font-medium">
                {currentStatus?.orderId || parentVisaApplication?.orderId || "N/A"}
              </p>
            </div>
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
                  {currentStatus?.status?.replace('_', ' ')?.toUpperCase() || 'SUBMITTED'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Current Stage</label>
              <p className="text-white font-medium">
                {currentStatus?.currentStage || "Document Verification"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Estimated Processing</label>
              <p className="text-white font-medium">
                {currentStatus?.estimatedProcessingTime || "10-15 business days"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {currentStatus?.progress && (
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
        applicationId={currentStatus?.id || parentVisaApplication?.id || applicationId}
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
