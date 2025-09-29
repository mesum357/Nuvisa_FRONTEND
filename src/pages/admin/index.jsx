import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, FileText, RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getApplicationOverview, getDocumentsOverview } from "@/api/admin";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import Cookies from 'js-cookie';
import ApplicationStatusList from "@/components/admin/ApplicationStatusList";
import DocumentsList from "@/components/admin/DocumentsList";
import { saveOrderId, getOrderId } from "@/utils/adminStorage";
import { formatApplicationId, formatOrderId } from "@/utils/idFormat";
import { useRouter } from "next/router";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [searching, setSearching] = useState(false);

  const token = localStorageGateway("token", localStorageEnums.GET);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchApplicationOverview(),
        fetchDocumentsOverview()
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationOverview = async () => {
    try {
      const response = await getApplicationOverview(token);
      if (response?.status >= 200 && response?.status < 300) {
        const res = response.data?.data?.results || {};
        const apps = Array.isArray(res) ? res : (res.applications || []);
        setApplications(apps);
        setAllApplications(apps);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchDocumentsOverview = async () => {
    try {
      const response = await getDocumentsOverview(token);
      if (response?.status >= 200 && response?.status < 300) {
        const res = response.data?.data?.results || {};
        const docs = Array.isArray(res) ? res : (res.documents || []);
        setDocuments(docs);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      setApplications(allApplications);
      return;
    }
    setSearching(true);
    const qLower = q.toLowerCase();
    const filtered = allApplications.filter((app) => {
      const rawAppId = app?.id ?? app?.applicationId ?? app?.code ?? '';
      const rawOrderId = app?.orderId ?? app?.order_id ?? app?.orderCode ?? '';
      const dispAppId = formatApplicationId(rawAppId).toLowerCase();
      const dispOrderId = formatOrderId(rawOrderId).toLowerCase();
      const country = String(app?.country || app?.countryName || '').toLowerCase();
      const email = String(app?.email || '').toLowerCase();

      if (searchType === 'applicationId') {
        return dispAppId.includes(qLower) || String(rawAppId).toLowerCase().includes(qLower);
      }
      if (searchType === 'orderId') {
        return dispOrderId.includes(qLower) || String(rawOrderId).toLowerCase().includes(qLower);
      }
      // all
      return (
        dispAppId.includes(qLower) ||
        dispOrderId.includes(qLower) ||
        country.includes(qLower) ||
        email.includes(qLower)
      );
    });
    setApplications(filtered);
    setActiveTab('overview');
    setSearching(false);
  };

  const handleUseSavedOrderId = () => {
    const saved = getOrderId();
    if (saved) {
      setSearchQuery(saved);
      setSearchType("orderId");
    }
  };

  if (loading) {
    return (
      <div className="w-full pri_bg !text-white min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-white/60">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pri_bg !text-white min-h-screen">
      <Header />

      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <h1 className="text-3xl font-gilroy-bold">Admin <span className="text-[#7350FF]">Dashboard</span></h1>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Application ID or Order ID"
                className="flex-1 lg:flex-none lg:w-96 bg-[#1A0F2E] text-white/90 border border-[#423577] rounded-md px-3 py-2 text-sm outline-none focus:border-[#7350FF]"
              />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="bg-[#1A0F2E] text-white/90 border border-[#423577] rounded-md px-2 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="applicationId">Application ID</option>
                <option value="orderId">Order ID</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-3 py-2 bg-[#7350FF] hover:bg-[#6247D3] disabled:opacity-50 text-white rounded-md text-sm"
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
              <button
                onClick={handleUseSavedOrderId}
                className="px-3 py-2 bg-transparent border border-[#423577] text-white/80 hover:text-white rounded-md text-sm"
                title="Use saved Order ID"
              >
                Use Saved ID
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-[#7350FF] hover:bg-[#6247D3] disabled:opacity-50 text-white px-3 py-2 rounded-md text-sm"
              >
                <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="flex border-b border-[#423577] gap-2 mb-6">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<Users size={20} />}
            label="Applications Overview"
          />
          <TabButton
            active={activeTab === "documents"}
            onClick={() => setActiveTab("documents")}
            icon={<FileText size={20} />}
            label="Documents"
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ApplicationStatusList
                applications={applications}
                onSelect={(app) => {
                  if (app?.orderId) saveOrderId(app.orderId);
                  const rawAppId = app?.id || app?.applicationId || app?.code;
                  if (rawAppId) {
                    router.push(`/application-step?application_id=${encodeURIComponent(rawAppId)}`);
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentsList documents={documents}
                onView={
                  (doc) => {
                    window.open(doc?.previewUrl || doc?.downloadUrl, '_blank', 'noopener,noreferrer');
                  }
                }

              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-3 font-medium text-sm relative border-b-2 transition-colors ${active
        ? "text-white border-[#7350FF]"
        : "text-white/60 border-transparent hover:text-white hover:border-[#7350FF]"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}