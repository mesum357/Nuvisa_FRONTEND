import {
  getUserVisaApplications,
  archiveVisaApplication,
  unarchiveVisaApplication,
} from "@/api/visaApplications";
import ClientOnly from "@/components/ClientOnly";
import CountrySelector from "@/components/CountrySelector";
import { Header } from "@/components/layout/Header";
import schengenCountries from "@/enums/flagCodes";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  Archive,
  FileText,
  ChevronDown,
  Download,
  Phone,
  CheckCircle2,
  CalendarDays,
  Building2,
  CircleDollarSign,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { countryCodeMap } from "@/utils/countryCodeMap";

export default function HeaderSearchSection() {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, _setSearchQuery] = useState("");
  const [userApplications, setUserApplications] = useState([]);
  const [archivedApplications, setArchivedApplications] = useState([]);
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [archiveError, setArchiveError] = useState(null);

  const filteredApplications = userApplications.filter(
    (app) =>
      app?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app?.id?.slice(0, 8).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchivedApplications = archivedApplications.filter(
    (app) =>
      app?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app?.id?.slice(0, 8).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Comprehensive status filtering with proper categorization
  const newApplications = filteredApplications.filter(
    (app) => {
      const status = app?.applicationStatus?.toLowerCase();
      return status === "new" || status === "draft" || status === "pending";
    }
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const submittedApplications = filteredApplications.filter(
    (app) => {
      const status = app?.applicationStatus?.toLowerCase();
      // Include all active processing states, approved applications, and rejected applications
      return status === "submitted" || 
             status === "under_review" || 
             status === "appointment_booked" || 
             status === "at_embassy" || 
             status === "processing" ||
             status === "approved" ||
             status === "rejected" ||
             status === "cancelled";
    }
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const approvedApplications = filteredApplications.filter(
    (app) => {
      const status = app?.applicationStatus?.toLowerCase();
      return status === "approved";
    }
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const rejectedApplications = filteredApplications.filter(
    (app) => {
      const status = app?.applicationStatus?.toLowerCase();
      return status === "rejected" || status === "cancelled";
    }
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const completedApplications = filteredApplications.filter(
    (app) => {
      const status = app?.applicationStatus?.toLowerCase();
      return status === "completed";
    }
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const fetchUserApplications = async () => {
    try {
      const response = await getUserVisaApplications(token);
      if (response?.status >= 200 && response?.status < 300) {
        const normalizeAppNo = (app) => {
          const appNo = app.applicationNo || app.application_no || app.applicationNumber || app.application_number || app.formattedApplicationId;
          if (appNo) return String(appNo);
          // fallback: generate AI######## using stable numericTail logic (matches admin)
          const raw = app.id || app._id;
          if (!raw) return undefined;
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
          return `AI${numericTail(raw, 8)}`;
        };
        const applicationsWithStatus =
          response.data.data.results.applications.map((app) => ({
            ...app,
            applicationNo: normalizeAppNo(app),
          }))
        setUserApplications(applicationsWithStatus);
        // load archived from applications that have archivedAt set
        const archived = applicationsWithStatus.filter((a) => a.archivedAt);
        const active = applicationsWithStatus.filter((a) => !a.archivedAt);
        setUserApplications(active);
        setArchivedApplications(archived);
      }
    } catch (error) {
      console.error("Failed to fetch user applications:", error);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, []);

  const handleArchiveApplication = async (id) => {
    setArchiveError(null);
    try {
      const payload = { id };
      const res = await archiveVisaApplication(token, payload);
      if (res?.status >= 200 && res?.status < 300) {
        const appToArchive = userApplications.find((app) => app?.id === id);
        if (appToArchive) {
          setUserApplications((prev) => prev.filter((app) => app?.id !== id));
          setArchivedApplications((prev) => [
            ...prev,
            { ...appToArchive, archivedAt: new Date().toISOString() },
          ]);
        }
      } else {
        setArchiveError("Failed to archive application");
      }
    } catch (err) {
      console.error("Archive API error", err);
      setArchiveError(err?.message || "Archive request failed");
    } finally {
      setConfirmArchiveId(null);
    }
  };

  const handleUnarchiveApplication = async (id) => {
    setArchiveError(null);
    try {
      const payload = { id };
      const res = await unarchiveVisaApplication(token, payload);
      if (res?.status >= 200 && res?.status < 300) {
        const appToUnarchive = archivedApplications.find(
          (app) => app?.id === id
        );
        if (appToUnarchive) {
          setArchivedApplications((prev) =>
            prev.filter((app) => app?.id !== id)
          );
          const restored = { ...appToUnarchive };
          delete restored.archivedAt;
          setUserApplications((prev) => [restored, ...prev]);
        }
      } else {
        setArchiveError("Failed to restore application");
      }
    } catch (err) {
      console.error("Unarchive API error", err);
      setArchiveError(err?.message || "Unarchive request failed");
    }
  };

  return (
    <div className="w-full pri_bg !text-white min-h-screen">
      <Header />
      <div className="w-full max-w-4xl py-[25px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[#423577]/10 pb-3">
          <div>
            <h1 className="text-2xl font-gilroy-bold">
              Welcome to <span className="text-[#7350FF]">NUvisa</span>!
            </h1>
          </div>
        </div>

        <CountrySelector />

        <div className="border-none border-[#423577] rounded-xl overflow-hidden mt-8">
          <div className="flex border-b border-[#423577] gap-2 mb-5">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 flex items-center cursor-pointer gap-3 font-medium text-sm relative ${activeTab === "all"
                ? "text-white border-b-2 border-[#7350FF]"
                : "text-white/60 border-transparent hover:text-white border-b-2 hover:border-[#7350FF]"
                }`}
            >
              <FileText size={20} />
              All Applications
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 flex items-center cursor-pointer gap-3 font-medium text-sm relative ${activeTab === "archived"
                ? "text-white border-b-2 border-[#7350FF]"
                : "text-white/60 border-transparent hover:text-white border-b-2 hover:border-[#7350FF]"
                }`}
            >
              <Archive size={20} />
              Archived
            </button>
          </div>

          <div>
            {activeTab === "all" && (
              <div className="space-y-8">
                <ApplicationSection
                  title="Your draft applications"
                  applications={newApplications}
                  type="draft"
                  onArchive={handleArchiveApplication}
                  requestArchive={setConfirmArchiveId}
                  emptyMessage="No draft applications yet."
                  emptySubMessage="Start a new application to see it here."
                />
                <ApplicationSection
                  title="Submitted applications"
                  applications={submittedApplications}
                  type="submitted"
                  onArchive={handleArchiveApplication}
                  requestArchive={setConfirmArchiveId}
                  emptyMessage="No submitted applications."
                  emptySubMessage="Your submitted and approved applications will show up here."
                />
              </div>
            )}

            {activeTab === "archived" && (
              <ApplicationSection
                title="Your archived applications"
                applications={filteredArchivedApplications}
                type="archived"
                onArchive={handleArchiveApplication}
                onUnarchive={handleUnarchiveApplication}
                requestArchive={setConfirmArchiveId}
                emptyMessage="No archived applications."
                emptySubMessage="Your archived applications will appear here."
              />
            )}
          </div>
        </div>
      </div>
      {confirmArchiveId && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmArchiveId(null)}
          onConfirm={() => handleArchiveApplication(confirmArchiveId)}
          title="Confirm archive"
          message="Are you sure you want to archive this application? You can restore it later from Archived."
          confirmText="Archive"
          cancelText="Cancel"
          type="warning"
        />
      )}
    </div>
  );
}

const ApplicationSection = ({
  title,
  applications,
  type,
  onArchive,
  onUnarchive,
  requestArchive,
  emptyMessage,
  emptySubMessage,
}) => (
  <div className="border border-[#423577] rounded-xl">
    <h3 className="font-medium text-white mb-6 border-b border-[#423577] p-4 px-6">
      {title} ({applications.length})
    </h3>
    <div className="px-6">
      {applications.length > 0 ? (
        <div className="space-y-4 pb-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              type={type}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              onRequestArchive={requestArchive}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h4 className="text-lg font-medium text-white mb-2">
            {emptyMessage}
          </h4>
          <p className="text-white/60">{emptySubMessage}</p>
        </div>
      )}
    </div>
  </div>
);

function ApplicationCard({
  app,
  type,
  onArchive,
  onRequestArchive,
  onUnarchive,
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const formatStatusLabel = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    const cleaned = raw
      .toString()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    return cleaned
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  };

  const handleViewApplication = (id) => {
    router.push(`/application-step?application_id=${id}`);
  };

  const getAllTravelersData = () => {
    let travelers = [];

    if (
      app?.travelersData &&
      Array.isArray(app.travelersData) &&
      app.travelersData.length > 0
    ) {
      travelers = app.travelersData;
    } else if (app?.travelersData && typeof app.travelersData === "string") {
      try {
        const parsed = JSON.parse(app.travelersData);
        if (Array.isArray(parsed)) {
          travelers = parsed;
        }
      } catch (e) {
        console.error("Failed to parse travelersData", e);
      }
    }

    return travelers.map((traveler, index) => {
      const firstName = (traveler?.basicDetails?.firstName || "").trim();
      const lastName = (traveler?.basicDetails?.lastName || "").trim();

      let fullName = `${firstName}`

      const email =
        traveler?.basicDetails?.email || app?.email || "no-email@provided.com";
      if (!fullName) {
        fullName = email;
      }
      const dob = traveler?.basicDetails?.dateOfBirth;

      let initials = "";
      const nameParts = fullName.split(" ").filter(Boolean);
      if (nameParts.length > 0) {
        initials = nameParts
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase();
      }
      if (!initials) {
        const localEmail = (email.split("@")[0] || "").replace(
          /[^a-zA-Z0-9]/g,
          ""
        );
        initials = localEmail.slice(0, 2).toUpperCase() || "AP";
      }

      let age = "";
      if (dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        age = `${calculatedAge} yrs`;
      }

      return {
        fullName,
        initials,
        email,
        age,
        index: index + 1,
        travelerNumber: `Traveler ${index + 1}`
      };
    });
  };

  const getApplicantData = () => {
    const allTravelers = getAllTravelersData();
    return allTravelers.length > 0 ? allTravelers[0] : {
      fullName: app?.email || "no-email@provided.com",
      initials: "AP",
      email: app?.email || "no-email@provided.com",
      age: "",
      index: 1,
      travelerNumber: "Traveler 1"
    };
  };

  const { fullName, initials, email, age } = getApplicantData();

  const statusInfo = {
    message: app.statusMessage || "Under Review",
    color: "bg-green-500/20 text-green-400",
    timestamp: app.statusTimestamp
      ? new Date(app.statusTimestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      : null,
  };

  //const waHref = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`;
  const waHref = `https://wa.me/447387667534`;

  return (
    <motion.div
      layout
      className="border border-[#423577] rounded-xl overflow-hidden bg-[#23232B] hover:bg-[#2c2c3a] transition-colors duration-200"
    >
      <div
  className="
    flex flex-col md:flex-row
    items-start md:items-center
    justify-between gap-4 md:gap-0
    p-4 cursor-pointer
  "
  onClick={() => {
    if (type === "draft") {
      handleViewApplication(app.id);
    } else {
      setIsExpanded(!isExpanded);
    }
  }}
>

<div className="flex items-center gap-3 w-full md:w-1/4">
          <div className="flex items-center justify-center w-10 h-7 rounded-sm border border-[#454553] overflow-hidden bg-gray-800">
            {countryCodeMap[app?.country] ? (
              <img
                src={`https://flagcdn.com/w80/${countryCodeMap[app?.country]
                  }.png`}
                alt={`${app?.country} flag`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-bold">
                {app?.country?.slice(0, 2)?.toUpperCase() || "??"}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-medium text-white truncate">{app?.country}</h4>
            <p className="text-sm text-white/60 truncate">
              #{app?.applicationNo || app?.id}
              {app?.orderId && (
                <span className="text-xs text-white/50 ml-2">
                  • {app.orderId}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-1/2 md:justify-center">

          {(() => {
            const allTravelers = getAllTravelersData();
            const displayTravelers = allTravelers.slice(0, 3); // Show max 3 travelers in compact view
            const remainingCount = Math.max(0, allTravelers.length - 3);

            if (allTravelers.length === 0) {
              return (
                <>
                  <div className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm">
                    {initials}
                  </div>
                  <p className="text-sm font-medium text-white">{fullName}</p>
                </>
              );
            }

            return (
              <div className="flex items-center gap-2">
                {/* Traveler avatars */}
                <div className="flex -space-x-2">
                  {displayTravelers.map((traveler, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm border-2 border-[#23232B] relative z-10"
                      title={traveler.fullName}
                      style={{ zIndex: displayTravelers.length - index }}
                    >
                      {traveler.initials}
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div className="w-8 h-8 rounded-full bg-[#6B5B95] text-white flex items-center justify-center font-bold text-xs border-2 border-[#23232B]">
                      +{remainingCount}
                    </div>
                  )}
                </div>

                {/* Primary traveler name and travelers count */}
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-white">
                    {allTravelers[0]?.fullName}
                    {allTravelers.length > 1 && (
                      <span className="text-xs text-white/60 ml-1">
                        + {allTravelers.length - 1} other{allTravelers.length > 2 ? 's' : ''}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/50">
                    {allTravelers.length} traveler{allTravelers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            );
          })()}

          <p className="text-sm text-white/60">
            <ClientOnly>
              {Math.floor(
                (new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24)
              )}{" "}
              day ago
            </ClientOnly>
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-1/4 md:justify-end justify-between">
          <div className="text-right">
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color}`}
            >
              {formatStatusLabel(app?.applicationStatus || statusInfo.message)}
            </div>
            {statusInfo.timestamp && (
              <p className="text-xs text-white/60 mt-1">
                {statusInfo.timestamp}
              </p>
            )}
          </div>
          {type === "submitted" && (
            <button className="flex items-center text-white/80 hover:text-white">
              {isExpanded ? "Close" : ""}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={24} />
              </motion.div>
            </button>
          )}

          {type !== "submitted" && onRequestArchive && type !== "archived" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestArchive(app.id);
              }}
              title="Archive application"
              className="ml-3 p-2 rounded bg-[#3b2b55] hover:bg-[#4a3768] text-white/90"
            >
              <Archive size={16} />
            </button>
          )}

          {type === "archived" && onUnarchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(app.id);
              }}
              title="Unarchive application"
              className="ml-3 p-2 rounded bg-[#2b553b] hover:bg-[#3b6f4a] text-white/90"
            >
              Unarchive
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && type === "submitted" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-[#423577] overflow-hidden"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleViewApplication(app.id)}
                  className="flex items-center gap-2 text-white font-medium hover:text-[#7350FF] transition-colors"
                >
                  View application <span className="font-bold">&gt;</span>
                </button>

                {type !== "archived" && onRequestArchive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestArchive(app.id);
                    }}
                    className="ml-2 bg-[#3b2b55] px-3 py-1 rounded text-sm hover:bg-[#4a3768]"
                  >
                    {isArchiving ? "Archiving..." : "Archive"}
                  </button>
                )}

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white font-medium hover:text-[#25D366] transition-colors"
                >
                  <FaWhatsapp className="text-green-400" />
                  Need help?
                </a>
              </div>


              <ProgressTimeline
                currentStatus={app.progressStatus ?? app.applicationStatus}
                applicant={{ fullName, age, email, initials }}
                allTravelers={getAllTravelersData()}
                currentLabel={statusInfo.message}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const ProgressTimeline = ({ currentStatus, applicant, allTravelers = [], currentLabel }) => {
  const steps = [
    { id: "submitted", label: "Submitted", icon: <CheckCircle2 size={20} /> },
    { id: "under_review", label: "Under Review", icon: <FileText size={20} /> },
    { id: "appointment_booked", label: "Appointment booked", icon: <CalendarDays size={20} /> },
    { id: "at_embassy", label: "At embassy", icon: <Building2 size={20} /> },
    { id: "decision_made", label: "Decision made", icon: <CheckCircle2 size={20} /> },
  ];

  const getCurrentStepIndex = (statusOrProgress) => {
    if (statusOrProgress == null) return -1;
    if (typeof statusOrProgress === "number") {
      const p = statusOrProgress;
      if (p >= 100) return steps.length - 1;
      if (p >= 90) return 3;
      if (p >= 75) return 2;
      if (p >= 50) return 1;
      if (p >= 25) return 0;
      return -1;
    }

    const s = String(statusOrProgress).toLowerCase();
    const mapping = {
      submitted: "submitted",
      new: "submitted",
      draft: "submitted",
      pending: "submitted",
      under_review: "under_review",
      "under review": "under_review",
      "under-review": "under_review",
      review: "under_review",
      processing: "under_review",
      appointment: "appointment_booked",
      appointment_booked: "appointment_booked",
      "appointment booked": "appointment_booked",
      at_embassy: "at_embassy",
      "at embassy": "at_embassy",
      embassy: "at_embassy",
      decision_made: "decision_made",
      approved: "decision_made",
      rejected: "decision_made",
      payment_required: "appointment_booked",
    };

    const mapped = mapping[s] || s;
    return steps.findIndex((step) => step.id === mapped);
  };

  const currentStepIndex = getCurrentStepIndex(currentStatus);

  return (
    <div>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div
              key={step.id}
              className="flex-1 flex flex-col items-center relative"
            >
              {index > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 ${isCompleted || isCurrent ? "bg-green-500" : "bg-[#423577]"
                    }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${isCompleted || isCurrent
                  ? "bg-[#4A3B65] text-green-400"
                  : "bg-[#4A3B65] text-[#C1A2F4]"
                  }`}
              >
                {isCompleted ? <CheckCircle2 size={20} /> : step.icon}
              </div>
              <p
                className={`text-xs mt-2 text-center ${isCompleted || isCurrent ? "text-green-400" : "text-white/60"
                  }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white">
            Travelers ({allTravelers.length})
          </h4>
        </div>

        {allTravelers.length > 0 ? (
          <div className="space-y-2">
            {allTravelers.map((traveler, index) => (
              <div key={index} className="flex items-center gap-4 bg-[#2c2c3a] p-3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {traveler.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {traveler.fullName}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span>{traveler.age}</span>
                    <span className="truncate">{traveler.email}</span>
                  </div>
                </div>
                <div className="text-xs text-white/50 bg-[#3a3a4a] px-2 py-1 rounded">
                  {traveler.travelerNumber}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 bg-[#2c2c3a] p-3 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm flex-shrink-0">
              {applicant.initials}
            </div>
            <div className="text-sm font-medium text-white">
              {applicant.fullName}
            </div>
            <div className="text-sm text-white/60">{applicant.age}</div>
            <div className="text-sm text-white/60 truncate flex-1">
              {applicant.email}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
