import { getUserVisaApplications } from "@/api/visaApplications";
import ClientOnly from "@/components/ClientOnly";
import CountrySelector from "@/components/CountrySelector";
import { Header } from "@/components/layout/Header";
import schengenCountries from "@/enums/flagCodes";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { motion } from "framer-motion";
import { Archive, FileText } from "lucide-react";
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

  // Mock archived applications for demonstration
  useEffect(() => {
    // This would typically come from an API
    setArchivedApplications([
      // You can add sample archived applications here if needed for testing
    ]);
  }, []);

  const handleArchiveApplication = (id) => {
    // Find the application to archive
    const appToArchive = userApplications.find((app) => app?.id === id);
    if (appToArchive) {
      // Remove from main applications
      setUserApplications((prev) => prev.filter((app) => app?.id !== id));
      // Add to archived applications
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
                    {/* <div className="space-y-1">
                      {[...Array(5)].map((app, index) => (
                        <ApplicationCard
                          key={index}
                          app={app}
                          type="draft"
                          onArchive={handleArchiveApplication}
                        />
                      ))}
                    </div> */}

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

  return (
    <div className="flex items-center justify-between p-4 border-none border-[#423577] rounded-lg transition-colors min-h-[72px]">
      {/* Left side - Flag and country info */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center justify-center w-12 h-8 rounded border border-[#423577] overflow-hidden bg-gray-800">
          {schengenCountries[app?.country] ? (
            <img
              src={`https://flagcdn.com/w80/${
                schengenCountries[app?.country]
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
        <div className="min-w-0">
          <h4 className="font-medium text-white truncate">{app?.country}</h4>
          <p className="text-sm text-white/60 truncate">
            {app?.code || "#" + app?.id?.slice(0, 6)}
          </p>
        </div>
      </div>

      {/* Center - Status indicator */}
      <div className="flex items-center gap-4 flex-1 justify-center min-w-0 px-4">
        <div className="flex items-center gap-3">
          <div className="relative w-5 h-5 flex-shrink-0">
            <p className="text-xs absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-white z-10">
              {(() => {
                // Extract first traveler's name from travelersData
                if (
                  app?.travelersData &&
                  Array.isArray(app.travelersData) &&
                  app.travelersData[0]?.basicDetails?.firstName
                ) {
                  return app.travelersData[0].basicDetails.firstName.slice(
                    0,
                    1
                  );
                }
                // Try parsing if it's a JSON string
                if (
                  app?.travelersData &&
                  typeof app.travelersData === "string"
                ) {
                  try {
                    const parsed = JSON.parse(app.travelersData);
                    if (parsed[0]?.basicDetails?.firstName) {
                      return parsed[0].basicDetails.firstName.slice(0, 1);
                    }
                  } catch (e) {}
                }
                return "?";
              })()}
            </p>
            {type === "draft" && (
              <div className="w-5 h-5 rounded-full bg-[#7350FF]"></div>
            )}
            {type === "submitted" && (
              <div className="w-5 h-5 rounded-full bg-green-500"></div>
            )}
            {type === "archived" && (
              <div className="w-5 h-5 rounded-full bg-gray-400"></div>
            )}
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {(() => {
                if (
                  app?.travelersData &&
                  Array.isArray(app.travelersData) &&
                  app.travelersData[0]?.basicDetails?.firstName
                ) {
                  return app.travelersData[0].basicDetails.firstName;
                }
                if (app?.travelersData && typeof app.travelersData === "string") {
                  try {
                    const parsed = JSON.parse(app.travelersData);
                    if (parsed[0]?.basicDetails?.firstName) {
                      return parsed[0].basicDetails.firstName;
                    }
                  } catch (e) {}
                }
                return "Unknown";
              })()}
            </p>

            {type === "submitted" ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">
                  {app?.paymentStatus === "completed" ? "Payment Completed" : "Processing"}
                </span>
              </div>
            ) : (
              <span className="text-xs text-white/60">
                <ClientOnly fallback="Loading...">
                  {daysAgo} day{daysAgo !== 1 ? "s" : ""} ago
                </ClientOnly>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Action button and archive */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleContinueApplication(app?.id)}
          className="bg-[#7350FF] hover:bg-[#6247D3] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          {type === "draft"
            ? "Resume application"
            : type === "archived"
            ? "View application"
            : "View application"}
        </motion.button>

        {/* Archive button - only show for draft applications, not submitted */}
        {type === "draft" && (
          <button
            onClick={() => handleArchiveApplication(app?.id)}
            className="text-white/60 hover:text-red-400 transition-colors p-1"
            title="Archive application"
          >
            <Archive size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
