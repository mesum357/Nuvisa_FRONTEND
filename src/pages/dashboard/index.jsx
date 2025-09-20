import { getUserVisaApplications,  } from "@/api/visaApplications";
import ClientOnly from "@/components/ClientOnly";
import CountrySelector from "@/components/CountrySelector";
import { Header } from "@/components/layout/Header";
import schengenCountries from "@/enums/flagCodes";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  FileText,
  ChevronDown,
  Eye,
  Download,
  Phone,
  CheckCircle2,
  CalendarDays,
  Building2,
  CircleDollarSign,
  Circle,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderSearchSection() {
  const router = useRouter();
  const token = localStorageGateway("token", localStorageEnums.GET);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userApplications, setUserApplications] = useState([]);
  const [archivedApplications, setArchivedApplications] = useState([]);
 

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

  const newApplications = filteredApplications.filter(
    (app) => app?.applicationStatus === "new"
  );

  const submittedApplications = filteredApplications.filter(
    (app) => app?.applicationStatus === "submitted"
  );

  const fetchUserApplications = async () => {
    try {
      const response = await getUserVisaApplications(token);
      if (response?.status >= 200 && response?.status < 300) {
        const applicationsWithStatus =
          response.data.data.results.applications.map((app) => ({
            ...app,
          }));
        setUserApplications(applicationsWithStatus);
      }
    } catch (error) {
      console.error("Failed to fetch user applications:", error);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, []);

  const handleArchiveApplication = async (id) => {
    const appToArchive = userApplications.find((app) => app?.id === id);
    if (appToArchive) {
      setUserApplications((prev) => prev.filter((app) => app?.id !== id));
      setArchivedApplications((prev) => [
        ...prev,
        { ...appToArchive, archivedAt: new Date().toISOString() },
      ]);
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
              className={`px-4 py-2 flex items-center cursor-pointer gap-3 font-medium text-sm relative ${
                activeTab === "all"
                  ? "text-white border-b-2 border-[#7350FF]"
                  : "text-white/60 border-transparent hover:text-white border-b-2 hover:border-[#7350FF]"
              }`}
            >
              <FileText size={20} />
              All Applications
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 flex items-center cursor-pointer gap-3 font-medium text-sm relative ${
                activeTab === "archived"
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
                  emptyMessage="No draft applications yet."
                  emptySubMessage="Start a new application to see it here."
                />
                <ApplicationSection
                  title="Submitted applications"
                  applications={submittedApplications}
                  type="submitted"
                  onArchive={handleArchiveApplication}
                  emptyMessage="No submitted applications."
                  emptySubMessage="Your submitted applications will show up here."
                />
              </div>
            )}

            {activeTab === "archived" && (
              <ApplicationSection
                title="Your archived applications"
                applications={filteredArchivedApplications}
                type="archived"
                onArchive={handleArchiveApplication}
                emptyMessage="No archived applications."
                emptySubMessage="Your archived applications will appear here."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ApplicationSection = ({ title, applications, type, onArchive, emptyMessage, emptySubMessage }) => (
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h4 className="text-lg font-medium text-white mb-2">{emptyMessage}</h4>
            <p className="text-white/60">{emptySubMessage}</p>
          </div>
        )}
      </div>
    </div>
);

function ApplicationCard({ app, type, onArchive }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
   const [isArchiving, setIsArchiving] = useState(false);

  const handleViewApplication = (id) => {
    router.push(`/application-step?application_id=${id}`);
  };

  const getApplicantData = () => {
    let traveler = null;
    if (app?.travelersData && Array.isArray(app.travelersData) && app.travelersData.length > 0) {
      traveler = app.travelersData[0];
    } else if (app?.travelersData && typeof app.travelersData === "string") {
      try {
        const parsed = JSON.parse(app.travelersData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          traveler = parsed[0];
        }
      } catch (e) {
        console.error("Failed to parse travelersData", e);
      }
    }
    
    const firstName = traveler?.basicDetails?.firstName || '';
    const lastName = traveler?.basicDetails?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'N. Applicant';
    const email = traveler?.basicDetails?.email || 'no-email@provided.com';
    const dob = traveler?.basicDetails?.dateOfBirth;

    const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    
    let age = '';
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

    return { fullName, initials, email, age };
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

  return (
    <motion.div
      layout
      className="border border-[#423577] rounded-xl overflow-hidden bg-[#23232B] hover:bg-[#2c2c3a] transition-colors duration-200"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 w-1/4">
          <div className="flex items-center justify-center w-10 h-7 rounded-sm border border-[#454553] overflow-hidden bg-gray-800">
             {schengenCountries[app?.country] ? (
              <img
                src={`https://flagcdn.com/w80/${schengenCountries[app?.country]}.png`}
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
              #{app?.id?.slice(0, 6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-1/2 justify-center">
            <div className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm">
                {initials}
            </div>
            <p className="text-sm font-medium text-white">{fullName}</p>
            <p className="text-sm text-white/60"><ClientOnly>{Math.floor((new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24))} day ago</ClientOnly></p>
        </div>

        <div className="flex items-center gap-4 w-1/4 justify-end">
          <div className="text-right">
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color}`}>
              {app?.applicationStatus ? app.applicationStatus.charAt(0).toUpperCase() + app.applicationStatus.slice(1) : statusInfo.message}
            </div>
            {statusInfo.timestamp && <p className="text-xs text-white/60 mt-1">{statusInfo.timestamp}</p>}
          </div>
          <button className="flex items-center text-white/80 hover:text-white">
            {isExpanded ? "Close" : ""}
            <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <ChevronDown size={24} />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && type === 'submitted' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-[#423577] overflow-hidden"
          >
            <div className="p-6 space-y-6">
                <div className="p-4 bg-[#7350FF]/10 border border-[#7350FF]/30 rounded-lg">
          <p className="font-semibold text-white">Have questions about your application?</p>
          <p className="text-sm text-white/80">{app?.assignedAgent?.name || 'Support'}, Available 10am-7pm • Mon-Sat</p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <button onClick={() => handleViewApplication(app.id)} className="flex items-center gap-2 text-white font-medium hover:text-[#7350FF] transition-colors">
                        View application <span className="font-bold">&gt;</span>
                    </button>
                    <button className="flex items-center gap-2 text-white font-medium hover:text-[#7350FF] transition-colors">
                        <Download size={16} /> Invoice
                    </button>
                    <button className="flex items-center gap-2 text-white font-medium hover:text-[#7350FF] transition-colors">
                        <Phone size={16} /> Need help?
                    </button>
                    {type !== 'archived' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsArchiving(true);
                          try {
                            await onArchive(app.id);
                          } catch (err) {
                            console.error('Archive failed', err);
                          } finally {
                            setIsArchiving(false);
                          }
                        }}
                        className="ml-2 bg-[#3b2b55] px-3 py-1 rounded text-sm hover:bg-[#4a3768]"
                      >
                        {isArchiving ? 'Archiving...' : 'Archive'}
                      </button>
                    )}
                </div>
                
                <ProgressTimeline currentStatus={app.progressStatus} applicant={{fullName, age, email, initials}} currentLabel={statusInfo.message} />

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


const ProgressTimeline = ({ currentStatus, applicant, currentLabel }) => {
    const steps = [
        { id: 'under_review', label: 'Under Review', icon: <FileText size={20} /> },
        { id: 'documents_reviewed', label: 'Documents Reviewed', icon: <CheckCircle2 size={20} /> },
        { id: 'appointment_booked', label: 'Appointment booked', icon: <CalendarDays size={20} /> },
        { id: 'at_embassy', label: 'At embassy', icon: <Building2 size={20} /> },
        { id: 'amount_refunded', label: 'Amount Refunded', icon: <CircleDollarSign size={20} /> },
    ];

    const currentStepIndex = steps.findIndex(step => step.id === currentStatus);

    return (
        <div>
            <div className="flex justify-between items-center">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                        <div key={step.id} className="flex-1 flex flex-col items-center relative">
                            {index > 0 && (
                                <div className={`absolute top-4 right-1/2 w-full h-0.5 ${isCompleted || isCurrent ? 'bg-green-500' : 'bg-[#423577]'}`} />
                            )}
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                 isCompleted ? 'bg-green-500 text-white' : 
                                 isCurrent ? 'bg-green-500 text-white' : 
                                 'bg-[#4A3B65] text-[#C1A2F4]'
                             }`}>
                                 {isCompleted ? <CheckCircle2 size={20} /> : step.icon}
                             </div>
                             <p className={`text-xs mt-2 text-center ${isCompleted || isCurrent ? 'text-white' : 'text-white/60'}`}>{step.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Applicant Details Bar */}
            <div className="mt-6 flex items-center gap-4 bg-[#2c2c3a] p-3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {applicant.initials}
                </div>
                <div className="text-sm font-medium text-white">{applicant.fullName}</div>
                <div className="text-sm text-white/60">{applicant.age}</div>
                <div className="text-sm text-white/60 truncate flex-1">{applicant.email}</div>
        <div className="bg-[#7350FF]/20 text-[#C1A2F4] text-xs font-semibold px-3 py-1 rounded-full">
          {currentLabel || 'Under Review'}
        </div>
            </div>
        </div>
    );
};