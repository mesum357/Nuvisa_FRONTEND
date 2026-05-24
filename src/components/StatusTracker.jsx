import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Calendar,
  FileText,
  User,
  CreditCard,
  ExternalLink
} from "lucide-react";
import { getApplicationStatus } from "@/api/applicationStatus";
import { getApplicationStatusContent } from "@/constants/applicationStatusMessages";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const StatusTracker = ({ applicationId, className = "", initialStatus = null, onRefresh = null }) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(!initialStatus);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(initialStatus ? new Date() : null);
  const token = localStorageGateway("token", localStorageEnums.GET);

  const fetchStatus = async () => {
    if (!applicationId) return;

    try {
      setRefreshing(true);
      if (token) {
        const response = await getApplicationStatus(token, applicationId);
        if (response?.success) {
          setStatus(response.data);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // If initialStatus is provided by parent, use it and set up auto-refresh
    if (initialStatus) {
      setStatus(initialStatus);
      setLastUpdated(new Date());
      
      // Set up auto-refresh every 5 minutes even with initialStatus
      const interval = setInterval(fetchStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      fetchStatus();

      // Set up auto-refresh every 5 minutes
      const interval = setInterval(fetchStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [applicationId, initialStatus]);

  const getStatusSteps = () => {
    const statusToProgress = (s) => {
      const v = normalizeStatus(s);
      switch (v) {
        case 'submitted':
          return 25;
        case 'under_review':
        case 'under review':
        case 'under-review':
        case 'review':
        case 'processing':
          return 50;
        case 'appointment_booked':
        case 'appointment booked':
          return 75;
        case 'at_embassy':
        case 'at embassy':
          return 90;
        case 'approved':
        case 'rejected':
        case 'decision_made':
          return 100;
        default:
          return 0;
      }
    };

    const progress = status?.progress ?? statusToProgress(status?.status);

    const stepStatusKeys = [
      "submitted",
      "under_review",
      "appointment_booked",
      "at_embassy",
    ];

    const steps = stepStatusKeys.map((key, index) => {
      const copy = getApplicationStatusContent(key);
      const completedAt = [25, 50, 75, 90][index];
      const currentRanges = [
        { min: 0, max: 50 },
        { min: 25, max: 75 },
        { min: 50, max: 100 },
        { min: 75, max: 100 },
      ];
      const range = currentRanges[index];

      return {
        id: key,
        title: copy.progressTitle,
        description: copy.progressDescription,
        completed: progress >= completedAt,
        current: progress >= range.min && progress < range.max,
      };
    });

    const finalStatusKey = ['approved', 'rejected', 'decision_made'].includes(
      normalizeStatus(status?.status)
    )
      ? normalizeStatus(status?.status)
      : 'decision_made';

    const finalCopy = getApplicationStatusContent(
      finalStatusKey,
      status?.statusDisplay || status?.statusMessage
    );

    steps.push({
      id: finalStatusKey,
      title: finalCopy.progressTitle,
      description: finalCopy.progressDescription,
      completed: progress >= 100,
      current: progress === 100,
    });

    return steps;
  };

  const getStatusIcon = (step) => {
    if (step.completed) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (step.current) {
      return <Clock className="w-5 h-5 text-green-400 animate-pulse" />;
    }
    return <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />;
  };

  const getStatusColor = (status) => {
    const v = (status || '').toString().trim().toLowerCase();
    switch (v) {
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'under_review':
      case 'under review':
      case 'under-review':
      case 'review':
      case 'processing':
        return 'text-green-400';
      case 'payment_required': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (loading && !status) {
    return (
      <div className={`bg-[#23232B] border border-[#423577] rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-[#7350FF] border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-300">Loading status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#23232B] border border-[#423577] rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-gilroy-bold text-white">Application Progress</h3>
          {status && (
            <p className={`text-sm font-medium ${getStatusColor(status.status)}`}>
              {`Status: ${getApplicationStatusContent(
                status.status,
                status.statusDisplay || status.statusMessage
              ).label}`}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (onRefresh) {
              setRefreshing(true);
              try {
                const maybePromise = onRefresh();
                if (maybePromise && typeof maybePromise.then === 'function') {
                  maybePromise.finally(() => setRefreshing(false));
                } else {
                  setRefreshing(false);
                }
              } catch (e) {
                console.error('Error calling parent onRefresh:', e);
                setRefreshing(false);
              }
            } else {
              fetchStatus();
            }
          }}
          disabled={refreshing}
          className="flex items-center gap-2 text-[#7350FF] hover:text-[#6350E5] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {getStatusSteps().map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {getStatusIcon(step)}
              {index < getStatusSteps().length - 1 && (
                <div className={`w-0.5 h-8 mt-2 ${step.completed ? 'bg-green-400' : 'bg-gray-600'
                  }`} />
              )}
            </div>
            <div className="flex-1 pb-4">
              <h4 className={`font-medium ${step.completed ? 'text-green-400' :
                step.current ? 'text-green-400' : 'text-gray-400'
                }`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-300 mt-1">{step.description}</p>
              {step.current && status?.estimatedProcessingTime && (
                <p className="text-xs text-blue-400 mt-1">
                  Estimated completion: {status.estimatedProcessingTime}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Details */}
      {status && (
        <div className="mt-6 pt-4 border-t border-[#423577]">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Progress:</span>
              <p className="text-white font-medium">{status.progress || 0}%</p>
            </div>
          </div>

          {status.progress && (
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-[#7350FF] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${status.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Appointment preferences if present */}
          {status.appointment && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1a1a22] border border-[#423577] rounded-lg p-3">
                <p className="text-xs text-gray-400">Preference 1 City</p>
                <p className="text-white text-sm font-medium mt-1">{status.appointment.preference1?.city || '-'}</p>
                <p className="text-xs text-gray-400 mt-3">Preference 1 Date Range</p>
                <p className="text-white text-sm font-medium mt-1">{status.appointment.preference1?.dateRange || '-'}</p>
                {status.appointment.preference1?.slot && (
                  <>
                    <p className="text-xs text-gray-400 mt-3">Preference 1 Slot</p>
                    <p className="text-white text-sm font-medium mt-1">{status.appointment.preference1.slot}</p>
                  </>
                )}
              </div>
              <div className="bg-[#1a1a22] border border-[#423577] rounded-lg p-3">
                <p className="text-xs text-gray-400">Preference 2 City</p>
                <p className="text-white text-sm font-medium mt-1">{status.appointment.preference2?.city || '-'}</p>
                <p className="text-xs text-gray-400 mt-3">Preference 2 Date Range</p>
                <p className="text-white text-sm font-medium mt-1">{status.appointment.preference2?.dateRange || '-'}</p>
                {status.appointment.preference2?.slot && (
                  <>
                    <p className="text-xs text-gray-400 mt-3">Preference 2 Slot</p>
                    <p className="text-white text-sm font-medium mt-1">{status.appointment.preference2.slot}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-4 pt-4 border-t border-[#423577]">
          <p className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex-1 bg-[#7350FF] text-white py-2 px-4 rounded-md hover:bg-[#6350E5] transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          View Dashboard
        </button>
      </div>
    </div>
  );
};

export default StatusTracker;