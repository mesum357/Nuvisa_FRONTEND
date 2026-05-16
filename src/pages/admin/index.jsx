import { useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getApplicationOverview } from "@/api/admin";
import { localStorageEnums } from "@/enums/localstorage.enums";
import { localStorageGateway } from "@/gateways/localStoragegateway";
import ApplicationStatusList from "@/components/admin/ApplicationStatusList";
import HomepageCmsPanel from "@/components/admin/HomepageCmsPanel";
import FeedbackSubmissionsPanel from "@/components/admin/FeedbackSubmissionsPanel";
import { saveOrderId, getOrderId } from "@/utils/adminStorage";
import { useRouter } from "next/router";
import { formatApplicationId, formatOrderId } from "@/utils/idFormat";

export default function AdminDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
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
      await fetchApplicationOverview();
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
        const submittedApps = apps.filter(app => {
          const status = (app?.applicationStatus || app?.status || '').toLowerCase();
          return status === 'submitted' || status === 'completed' || status === 'approved' || status === 'processing';
        });
        setApplications(submittedApps);
        setAllApplications(submittedApps);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
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
    setSearching(false);
  };

  const handleUseSavedOrderId = () => {
    const saved = formatOrderId(getOrderId());
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
            <div className="bg-gradient-to-r from-[#7350FF] to-[#A855F7] rounded-full p-4 mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <RefreshCw className="animate-spin text-white" size={32} />
            </div>
            <p className="text-white/80 text-lg font-medium">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pri_bg !text-white min-h-screen scrollbar-hidden">
      <Header />

      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <h1 className="text-3xl xl:text-4xl font-gilroy-bold text-white mb-2">
                Admin <span className="bg-gradient-to-r from-[#7350FF] to-[#A855F7] bg-clip-text text-transparent">Dashboard</span>
              </h1>
              <p className="text-white/60 text-sm">Manage and monitor visa applications</p>
            </div>
            
            {/* Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              <div className="relative min-w-[320px]">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by ID, Order, Country, Email..."
                  className="w-full bg-white/5 backdrop-blur-sm text-white border border-white/10 rounded-lg px-4 py-3 pr-10 text-sm outline-none focus:border-[#7350FF] focus:bg-white/10 transition-all duration-200 placeholder:text-white/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setApplications(allApplications);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="bg-white/5 backdrop-blur-sm text-white border border-white/10 rounded-lg px-4  py-3 text-sm min-w-[120px] outline-none focus:border-[#7350FF] transition-all duration-200"
              >
                <option value="all" className="bg-[#1A0F2E] text-white">All Fields</option>
                <option value="applicationId" className="bg-[#1A0F2E] text-white">App ID</option>
                <option value="orderId" className="bg-[#1A0F2E] text-white">Order ID</option>
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#7350FF] to-[#A855F7] hover:from-[#6247D3] hover:to-[#9333EA] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/10"
                >
                  <RefreshCw className={`${refreshing ? "animate-spin" : ""} transition-transform duration-200`} size={16} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <HomepageCmsPanel />
        <FeedbackSubmissionsPanel />

        <div className="bg-[#7350FF]/10 border border-[#7350FF]/30 rounded-xl p-4 mb-8 text-sm text-white/90">
          <strong className="text-white">Assign &amp; manage applications:</strong>{" "}
          expand any application card below, then use the case panel to assign a team member,
          update status, add internal comments, and view the activity timeline.
        </div>

        {applications.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Application Statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-[#7350FF]/20 to-[#A855F7]/20 rounded-lg border border-[#7350FF]/30">
                <div className="text-2xl font-bold text-white mb-1">{applications.length}</div>
                <div className="text-white/70 text-sm font-medium">Total Applications</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-400 mb-1">
                  {applications.filter(app => {
                    const status = (app?.applicationStatus || app?.status || '').toLowerCase();
                    return status.includes('approved') || status.includes('completed');
                  }).length}
                </div>
                <div className="text-white/70 text-sm font-medium">Approved</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {applications.filter(app => {
                    const status = (app?.applicationStatus || app?.status || '').toLowerCase();
                    return status.includes('processing') || status.includes('submitted');
                  }).length}
                </div>
                <div className="text-white/70 text-sm font-medium">Processing</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-400 mb-1">
                  {applications.filter(app => {
                    const status = (app?.applicationStatus || app?.status || '').toLowerCase();
                    return status.includes('pending') || status.includes('review');
                  }).length}
                </div>
                <div className="text-white/70 text-sm font-medium">Pending Review</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">
              Applications {applications.length > 0 && <span className="text-white/60">({applications.length})</span>}
            </h2>
          </div>
          
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-white/40 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white/60 text-lg font-medium mb-2">
                {searchQuery ? 'No applications found' : 'No applications available'}
              </h3>
              <p className="text-white/40 text-sm">
                {searchQuery 
                  ? 'Try adjusting your search criteria or clearing the search.'
                  : 'Applications will appear here once they are submitted.'
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setApplications(allApplications);
                  }}
                  className="mt-4 px-4 py-2 bg-[#7350FF] hover:bg-[#6247D3] text-white rounded-lg text-sm transition-colors duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}