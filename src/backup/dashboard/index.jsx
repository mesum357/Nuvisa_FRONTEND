"use client";
import {
  FaWhatsapp,
  FaSearch,
  FaPlaneDeparture,
  FaUser,
  FaChevronRight,
} from "react-icons/fa";
import Image from "next/image";
import { motion } from "framer-motion";
import CountrySelector from "@/components/CountrySelector";
import { Phone, Trash2, Plus, Clock, CheckCircle, Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import Cookies from "js-cookie";
import useParsedUser from "@/hooks/useParsedUser";
import { check } from "@/api/visa";
import { getUserVisaApplications } from "@/api/visaApplications";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import { localStorageEnums } from "@/enums/localstorage.enums";
import schengenCountries from "@/enums/flagCodes";
import { useRouter } from "next/navigation";

const applications = [
  {
    country: "Norway",
    code: "#lkwp28",
    daysAgo: 0,
    flagCode: "no",
    status: "draft",
    progress: 30,
  },
  {
    country: "Denmark",
    code: "#nrj5v",
    daysAgo: 8,
    flagCode: "dk",
    status: "submitted",
    progress: 100,
  },
  {
    country: "Sweden",
    code: "#swd92",
    daysAgo: 3,
    flagCode: "se",
    status: "draft",
    progress: 65,
  },
  {
    country: "Finland",
    code: "#fin44",
    daysAgo: 15,
    flagCode: "fi",
    status: "submitted",
    progress: 100,
  },
];

export default function HeaderSearchSection() {
  const token = localStorageGateway("token", localStorageEnums.GET);
  const { parsedUserData } = useParsedUser();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userApplications, setUserApplications] = useState([]);

  const filteredApplications = userApplications.filter(
    (app) =>
      app.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newApplications = filteredApplications.filter(
    (app) => app.applicationStatus === "new"
  );

  const submittedApplications = filteredApplications.filter(
    (app) => app.status === "submitted"
  );

  const handleCheck = async () => {
    const response = await check();
  };

  const fetchUserApplications = async () => {
    const response = await getUserVisaApplications(token);

    if (/^2\d{2}$/.test(response?.status)) {
      setUserApplications(response.data.data.results.applications);
    }
  };

  useEffect(() => {
    fetchUserApplications();
  }, []);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Top Header */}
      <Header />

      {/* Welcome Section */}
      <div className="w-full max-w-[1200px] py-[25px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-gilroy-bold text-gray-800">
              Welcome to <span className="text-[#7350FF]">NUvisa</span>!
            </h1>
            <p className="text-gray-600 mt-2">
              Your one-stop solution for visa applications worldwide
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-[#7350FF] hover:bg-[#6247D3] text-white px-6 py-3 rounded-full shadow-md transition-all"
            onClick={handleCheck}
          >
            <Plus size={18} />
            <span>New Application</span>
          </motion.button>
        </div>

        {/* Hero Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full mx-auto flex mt-6 items-center bg-white rounded-xl border-gray-200 shadow-lg pl-6 pr-2 py-3 border"
        >
          <FaPlaneDeparture className="text-[#7350FF] mr-3 text-xl" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Where would you like to go?"
            className="flex-grow outline-none text-gray-700 placeholder-gray-400 bg-transparent text-lg"
          />
          <button className="bg-[#7350FF] hover:bg-[#6247D3] transition-all text-white rounded-xl p-4 flex items-center gap-2">
            <FaSearch />
            <span className="hidden md:inline">Search</span>
          </button>
        </motion.div>

        {/* Popular Destinations */}
        <CountrySelector />

        {/* Application Dashboard */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-4 flex justify-center gap-2 items-center font-medium text-sm md:text-base ${activeTab === "all"
                ? "border-b-2 border-[#7350FF] text-[#7350FF]"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Image
                src="/image/Unionapplication.svg"
                alt="All applications"
                width={24}
                height={16}
                className="h-5 w-5"
              />
              All Applications
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "all" && (
              <div className="space-y-8">
                {/* Draft Applications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Clock className="text-yellow-500" size={20} />
                      New Applications ({newApplications.length})
                    </h3>
                  </div>

                  {newApplications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newApplications.map((app, index) => (
                        <ApplicationCard key={index} app={app} type="new" />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Clock className="text-gray-400" size={40} />}
                      title="No new applications"
                      description="Start a new application to see it here"
                    />
                  )}
                </div>

                {/* Submitted Applications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <CheckCircle className="text-green-500" size={20} />
                      Submitted Applications ({submittedApplications.length})
                    </h3>
                    {submittedApplications.length > 0 && (
                      <button className="text-sm text-[#7350FF] hover:text-purple-800 flex items-center gap-1">
                        View all <FaChevronRight size={12} />
                      </button>
                    )}
                  </div>

                  {submittedApplications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {submittedApplications.map((app, index) => (
                        <ApplicationCard
                          key={index}
                          app={app}
                          type="submitted"
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<CheckCircle className="text-gray-400" size={40} />}
                      title="No submitted applications"
                      description="Complete and submit your drafts to see them here"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === "archived" && (
              <EmptyState
                icon={<Archive className="text-gray-400" size={40} />}
                title="No archived applications"
                description="Archive applications to see them here"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, type }) {
  const router = useRouter();

  const handleContinueApplication = (id) => {
    router.push(`/application-step?application_id=${id}`);
  };
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          { }
          <img
            src={`https://flagcdn.com/w80/${schengenCountries[app.country]
              }.png`}
            alt={`${app.country} flag`}
            className="w-12 h-8 object-cover rounded-md border border-gray-200"
          />
          <div>
            <h4 className="font-semibold text-gray-800">{app.country}</h4>
            <p className="text-gray-500 text-sm">app.code</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {(() => {
            const daysAgo = Math.floor(
              (new Date() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24)
            );
            return `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
          })()}

          {/* {app.daysAgo} day{app.daysAgo !== 1 ? "s" : ""} ago */}
        </div>
      </div>

      {type === "new" && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{app.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#7350FF] h-2 rounded-full"
              style={{ width: `${app.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end items-center">
        <button
          onClick={() => handleContinueApplication(app.id)}
          className="flex items-center gap-2 bg-[#7350FF] hover:bg-[#6247D3] text-white text-sm px-4 py-2 rounded-lg transition cursor-pointer"
        >
          {type === "draft" ? "Continue" : "View"} application
          <FaChevronRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">{icon}</div>
      <h4 className="text-lg font-medium text-gray-700 mb-1">{title}</h4>
      <p className="text-gray-500 max-w-md">{description}</p>
    </div>
  );
}
