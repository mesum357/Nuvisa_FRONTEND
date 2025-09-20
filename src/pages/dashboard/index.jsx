import { getUserVisaApplications } from "@/api/visaApplications";
import ClientOnly from "@/components/ClientOnly";
import CountrySelector from "@/components/CountrySelector";
import { Header } from "@/components/layout/Header";
import schengenCountries from "@/enums/flagCodes";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, FileText, ChevronDown,  Eye, } from "lucide-react";
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
      app?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchivedApplications = archivedApplications.filter(
    (app) =>
      app?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app?.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newApplications = filteredApplications.filter(
    (app) => app?.applicationStatus === "new"
  );

  const submittedApplications = filteredApplications.filter(
    (app) => app?.applicationStatus === "submitted"
  );

  const handleNewApplication = () => {
    router.push("/application-step");
  };

  const fetchUserApplications = async () => {
    const response = await getUserVisaApplications(token);

    console.log(response?.data?.data?.results?.applications);
    if (/^2\d{2}$/.test(response?.status)) {
      setUserApplications(response.data.data.results.applications);
    }
  };

  useEffect(() => {
    setArchivedApplications([
    ]);
  }, []);

  const handleArchiveApplication = (id) => {
    const appToArchive = userApplications.find((app) => app?.id === id);
    if (appToArchive) {
      setUserApplications((prev) => prev.filter((app) => app?.id !== id));
      setArchivedApplications((prev) => [
        ...prev,
        { ...appToArchive, archivedAt: new Date().toISOString() },
      ]);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, []);

  return (
    <div className="w-full pri_bg !text-white min-h-screen">
      {/* Top Header */}
      <Header />

      {/* Welcome Section */}
      <div className="w-full max-w-4xl py-[25px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-[#423577]/10 pb-3">
          <div>
            <h1 className="text-2xl font-gilroy-bold">
              Welcome to <span className="text-[#7350FF]">NUvisa</span>!
            </h1>
            {/* <p className="text-gray-600 mt-2">
              Your one-stop solution for visa applications worldwide
            </p> */}
          </div>

          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-[#7350FF] hover:bg-[#6247D3] text-white px-6 py-3 rounded-full shadow-md transition-all"
            onClick={handleNewApplication}
          >
            <Plus size={18} />
            <span>New Application</span>
          </motion.button> */}
        </div>

        {/* Hero Search Box */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full mx-auto flex mt-6 items-center bg-white rounded-xl border-[#423577] shadow-lg pl-6 pr-2 py-3 border"
        >
          <FaPlaneDeparture className="text-[#7350FF] mr-3 text-xl" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Where would you like to go?"
            className="flex-grow outline-none text-white placeholder-gray-400 bg-transparent text-lg"
          />
          <button className="bg-[#7350FF] hover:bg-[#6247D3] transition-all text-white rounded-xl p-4 flex items-center gap-2">
            <FaSearch />
            <span className="hidden md:inline">Search</span>
          </button>
        </motion.div> */}

        {/* Popular Destinations */}
        <CountrySelector />

        {/* Application Dashboard */}
        <div className="border-none border-[#423577] rounded-xl overflow-hidden mt-8">
          {/* Tabs */}
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

          {/* Tab Content */}
          <div className="">
            {activeTab === "all" && (
              <div className="space-y-8">
                {/* Draft Applications Section */}
                <div className="border border-[#423577] rounded-xl">
                  <h3 className=" font-medium text-white mb-6 border-b border-[#423577] p-4 px-6">
                    Your draft applications ({newApplications.length})
                  </h3>

                  <div className="px-6">
          

                    {newApplications.length > 0 ? (
                      <div className="space-y-1 pb-3">
                        {newApplications.map((app, index) => (
                          <ApplicationCard
                            key={index}
                            app={app}
                            type="draft"
                            onArchive={handleArchiveApplication}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        {/* <div className="text-gray-400 mb-4">
                          <FileText size={48} className="mx-auto mb-4" />
                        </div> */}
                        <h4 className="text-lg font-medium text-white mb-2">
                          No draft applications yet
                        </h4>
                        <p className="text-white/60">
                          Start a new application to see it here
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submitted Applications Section */}
                <div className="border border-[#423577] rounded-xl">
                  <h3 className=" font-medium text-white mb-6 border-b border-[#423577] p-4 px-6">
                    Submitted applications ({submittedApplications.length})
                  </h3>

                  {submittedApplications.length > 0 ? (
                    <div className="space-y-1 px-6 pb-3">
                      {submittedApplications.map((app, index) => (
                        <ApplicationCard
                          key={index}
                          app={app}
                          type="submitted"
                          onArchive={handleArchiveApplication}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-white/60">
                        Your submitted applications will show up here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "archived" && (
              <div className="border border-[#423577] rounded-xl">
                <h3 className=" font-medium text-white mb-6 border-b border-[#423577] p-4 px-6">
                  Your archived applications (
                  {filteredArchivedApplications.length})
                </h3>

                {filteredArchivedApplications.length > 0 ? (
                  <div className="space-y-1 px-6 pb-3">
                    {filteredArchivedApplications.map((app, index) => (
                      <ApplicationCard
                        key={index}
                        app={app}
                        type="archived"
                        onArchive={handleArchiveApplication}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/60">
                      Your archived applications will show up here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, type, onArchive }) {
  const router = useRouter();
  const [daysAgo, setDaysAgo] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleContinueApplication = (id) => {
    router.push(`/application-step?application_id=${id}`);
  };

  const handleArchiveApplication = (id) => {
    onArchive(id);
  };

  // Calculate days ago client-side to avoid hydration issues
  useEffect(() => {
    if (app?.createdAt) {
      const calculatedDays = Math.floor(
        (new Date() - new Date(app?.createdAt)) / (1000 * 60 * 60 * 24)
      );
      setDaysAgo(calculatedDays);
    }
  }, [app?.createdAt]);

  const getApplicantName = () => {
    if (app?.travelersData && Array.isArray(app.travelersData) && app.travelersData[0]?.basicDetails?.firstName) {
      return `${app.travelersData[0].basicDetails.firstName} ${app.travelersData[0].basicDetails.lastName || ''}`.trim();
    }
    if (app?.travelersData && typeof app.travelersData === "string") {
      try {
        const parsed = JSON.parse(app.travelersData);
        if (parsed[0]?.basicDetails?.firstName) {
          return `${parsed[0].basicDetails.firstName} ${parsed[0].basicDetails.lastName || ''}`.trim();
        }
      } catch (e) {}
    }
    return "Unknown Applicant";
  };

  // Get applicant initials
  const getApplicantInitials = () => {
    const name = getApplicantName();
    if (name === "Unknown Applicant") return "?";
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  // Get status info based on type
  const getStatusInfo = () => {
    switch (type) {
      case 'draft':
        return { status: 'Draft', color: 'bg-orange-500', textColor: 'text-orange-400' };
      case 'submitted':
        return { status: app?.paymentStatus === 'completed' ? 'Under Review' : 'Document Review', color: 'bg-blue-500', textColor: 'text-blue-400' };
      case 'archived':
        return { status: 'Archived', color: 'bg-gray-500', textColor: 'text-gray-400' };
      default:
        return { status: 'Unknown', color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  };

  const statusInfo = getStatusInfo();

  // Progress steps for the timeline
  const getProgressSteps = () => {
    const baseSteps = [
      { label: 'Under Review', completed: false, current: false },
      { label: 'Documents Reviewed', completed: false, current: false },
      { label: 'Appointment booked', completed: false, current: false },
      { label: 'At embassy', completed: false, current: false },
      { label: 'Amount Refunded', completed: false, current: false }
    ];

    if (type === 'submitted') {
      baseSteps[0].completed = true;
      baseSteps[0].current = true;
    }

    return baseSteps;
  };

  return (
    <motion.div 
      className="border border-[#423577] rounded-xl overflow-hidden bg-[#2A1B3D]/50 hover:bg-[#2A1B3D]/70 transition-all duration-200"
      layout
    >
      {/* Main Card Header - Always Visible */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left side - Flag and country info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-8 rounded border border-[#423577] overflow-hidden bg-gray-800">
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
          <div className="min-w-0">
            <h4 className="font-medium text-white truncate">{app?.country}</h4>
            <p className="text-sm text-white/60 truncate">
              {app?.code || "#" + app?.id?.slice(0, 8)?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Center - Applicant info */}
        <div className="flex items-center gap-4 flex-1 justify-center min-w-0 px-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${statusInfo.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-sm font-semibold">
                {getApplicantInitials()}
              </span>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {getApplicantName()}
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusInfo.color} ${type === 'submitted' ? 'animate-pulse' : ''}`}></div>
                <span className={`text-xs ${statusInfo.textColor} font-medium`}>
                  {statusInfo.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Time and expand button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <span className="text-xs text-white/60">
              <ClientOnly fallback="Loading...">
                {daysAgo} day{daysAgo !== 1 ? "s" : ""} ago
              </ClientOnly>
            </span>
            {type === 'submitted' && (
              <p className="text-xs text-green-400 mt-1">
                As on {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </p>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/60 hover:text-white"
          >
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-[#423577] overflow-hidden"
          >
            <div className="p-6 space-y-6">
          

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleContinueApplication(app?.id)}
                  className="flex items-center gap-2 bg-[#7350FF] hover:bg-[#6247D3] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Eye size={16} />
                  View application
                </motion.button>
                
     
              </div>

              {/* Progress Timeline - Only for submitted applications */}
              {type === 'submitted' && (
                <div className="space-y-4">
                  <h4 className="text-white font-medium text-sm">Application Progress</h4>
                  <div className="space-y-3">
                    {getProgressSteps().map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          step.completed 
                            ? 'bg-green-500 border-green-500' 
                            : step.current 
                            ? 'bg-blue-500 border-blue-500 animate-pulse' 
                            : 'bg-transparent border-[#423577]'
                        }`}>
                          {step.completed && (
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${
                          step.completed 
                            ? 'text-green-400' 
                            : step.current 
                            ? 'text-blue-400' 
                            : 'text-white/60'
                        }`}>
                          {step.label}
                        </span>
                        {index < getProgressSteps().length - 1 && (
                          <div className={`flex-1 h-px ${
                            step.completed ? 'bg-green-500' : 'bg-[#423577]'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Application ID:</span>
                  <p className="text-white font-medium">{app?.code || "#" + app?.id?.slice(0, 8)?.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-white/60">Visa Type:</span>
                  <p className="text-white font-medium">{app?.visaType || "Tourist Visa"}</p>
                </div>
                <div>
                  <span className="text-white/60">Submitted:</span>
                  <p className="text-white font-medium">
                    <ClientOnly fallback="Loading...">
                      {new Date(app?.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </ClientOnly>
                  </p>
                </div>
                {type !== 'draft' && (
                  <div>
                    <span className="text-white/60">Status:</span>
                    <p className={`font-medium ${statusInfo.textColor}`}>{statusInfo.status}</p>
                  </div>
                )}
              </div>

              {/* Archive button for draft applications */}
              {type === 'draft' && (
                <div className="pt-3 border-t border-[#423577]">
                  <button
                    onClick={() => handleArchiveApplication(app?.id)}
                    className="flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors text-sm"
                  >
                    <Archive size={16} />
                    Archive application
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
