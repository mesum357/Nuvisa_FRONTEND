import { useMemo, useState, useEffect } from 'react';
import { Eye, ChevronDown, FileText, Download, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatApplicationId, formatOrderId } from '@/utils/idFormat';
import { saveOrderId } from '@/utils/adminStorage';
import { getApplicationDetails, getTravelerDocuments, updateDocumentStatus } from '@/api/admin';
import { localStorageGateway } from '@/gateways/localStoragegateway';
import { localStorageEnums } from '@/enums/localstorage.enums';

export default function ApplicationStatusCard({ application, onSelect, isExpanded, onToggle }) {
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [updatingDocument, setUpdatingDocument] = useState(null);

  const token = localStorageGateway("token", localStorageEnums.GET);
  const rawAppId = application?.id ?? application?.applicationId ?? application?.code;
  const rawOrderId = application?.orderId ?? application?.order_id ?? application?.orderCode;
  const appId = useMemo(() => formatApplicationId(rawAppId), [rawAppId]);
  const orderId = useMemo(() => formatOrderId(rawOrderId), [rawOrderId]);

  const onClickView = () => {
    if (rawOrderId) saveOrderId(rawOrderId);
    onSelect?.(application);
  };

  const fetchApplicationDetails = async () => {
    if (!rawAppId) return null;

    try {
      const response = await getApplicationDetails(token, rawAppId);
      if (response?.status >= 200 && response?.status < 300) {
        const details = response.data?.data || response.data;
        setApplicationDetails(details);
        return details;
      }
    } catch (error) {
      console.error("Error fetching application details:", error);
    }
    return null;
  };

  const fetchDocuments = async () => {
    if (!rawAppId || !documentsOpen) return;

    setLoadingDocuments(true);
    try {
      let details = applicationDetails;
      if (!details) {
        details = await fetchApplicationDetails();
      }

      const allDocuments = [];

      // First, try to extract documents from the application details directly
      if (details?.travelersData && Array.isArray(details.travelersData)) {

        for (const traveler of details.travelersData) {
          const travelerName = `${traveler.basicDetails?.firstName || 'Unknown'} ${traveler.basicDetails?.lastName || ''}`.trim();

          // Extract documents from traveler.documents.documents structure
          if (traveler.documents?.documents) {
            const docsByType = traveler.documents.documents;

            Object.entries(docsByType).forEach(([docTypeId, docData]) => {
              // Handle both array and object formats
              const docs = Array.isArray(docData) ? docData : [docData];

              docs.forEach((doc, index) => {
                if (doc && (doc.preview || doc.name)) {
                  const documentObj = {
                    id: `${traveler.id}-${docTypeId}-${index}`,
                    name: doc.name || `Document ${docTypeId}`,
                    type: getDocumentTypeName(docTypeId),
                    url: doc.preview,
                    previewUrl: doc.preview,
                    downloadUrl: doc.preview,
                    fileUrl: doc.preview,
                    status: 'uploaded',
                    uploadedAt: doc.uploadedAt,
                    createdAt: doc.uploadedAt,
                    travelerName: travelerName,
                    travelerId: traveler.id,
                    size: doc.size,
                    mimeType: doc.type
                  };
                  allDocuments.push(documentObj);
                }
              });
            });
          }

          // Also try to fetch additional documents via API
          if (traveler.id) {
            try {
              const docResponse = await getTravelerDocuments(token, rawAppId, traveler.id);
              if (docResponse?.status >= 200 && docResponse?.status < 300) {
                const travelerDocs = docResponse.data?.data || docResponse.data || [];

                const docsWithTravelerInfo = (Array.isArray(travelerDocs) ? travelerDocs : []).map(doc => ({
                  ...doc,
                  travelerName: travelerName,
                  travelerId: traveler.id
                }));

                // Only add if not already in allDocuments
                docsWithTravelerInfo.forEach(doc => {
                  if (!allDocuments.find(existing => existing.url === doc.url || existing.previewUrl === doc.previewUrl)) {
                    allDocuments.push(doc);
                  }
                });
              }
            } catch (error) {
              console.error(`Error fetching additional documents for traveler ${traveler.id}:`, error);
            }
          }
        }
      }

      if (allDocuments.length === 0) {
        try {
          const docResponse = await getTravelerDocuments(token, rawAppId, '1');
          if (docResponse?.status >= 200 && docResponse?.status < 300) {
            const docs = docResponse.data?.data?.results?.documents || docResponse.data?.data || docResponse.data || [];
            const docsWithInfo = (Array.isArray(docs) ? docs : []).map(doc => ({
              ...doc,
            }));
            allDocuments.push(...docsWithInfo);
          }
        } catch (error) {
          console.error("Error fetching default documents:", error);
        }
      }

      setDocuments(allDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Helper function to map document type IDs to readable names
  const getDocumentTypeName = (typeId) => {
    const typeMap = {
      '1': 'Passport Copy',
      '2': 'Passport Photo',
      '3': 'Travel Insurance',
      '4': 'Bank Statement',
      '5': 'Employment Letter',
      '6': 'Hotel Booking',
      '7': 'Flight Booking',
      '8': 'Cover Letter',
      '9': 'Additional Document',
      '10': 'Visa Application Form'
    };
    return typeMap[typeId] || `Document Type ${typeId}`;
  };

  const updateDocStatus = async (documentId, newStatus, notes = '') => {
    setUpdatingDocument(documentId);
    try {
      const response = await updateDocumentStatus(token, documentId, {
        status: newStatus,
        notes
      });

      if (response?.status >= 200 && response?.status < 300) {
        setDocuments(docs =>
          docs.map(doc =>
            doc.id === documentId
              ? { ...doc, status: newStatus, adminNotes: notes }
              : doc
          )
        );
      }
    } catch (error) {
      console.error("Error updating document status:", error);
    } finally {
      setUpdatingDocument(null);
    }
  };

  useEffect(() => {
    if (documentsOpen && !documents.length) {
      fetchDocuments();
    }
  }, [documentsOpen, rawAppId]);

  useEffect(() => {
    if (isExpanded) {
      fetchApplicationDetails();
    }
  }, [isExpanded, rawAppId]);

  // Reset documents when card is collapsed
  useEffect(() => {
    if (!isExpanded) {
      setDocumentsOpen(false);
      setDocuments([]);
      setApplicationDetails(null);
    }
  }, [isExpanded]);


  return (
    <div className="border border-[#423577] rounded-xl overflow-hidden bg-[#23232B] hover:bg-[#2c2c3a] transition-colors duration-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Country & Status */}
        <div className="flex items-center gap-3 w-1/4">
          <div className="flex items-center justify-center w-10 h-7 rounded-sm border border-[#454553] overflow-hidden bg-gray-800">
            <span className="text-white text-xs font-bold">
              {(application?.country || application?.countryName || '??').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-white truncate">
              {application?.country || application?.countryName || 'Unknown'}
            </h4>
            <p className="text-sm text-white/60 truncate">

              {appId}
              <span className="text-xs text-white/50 ml-2">
                • {orderId}
              </span>
            </p>
          </div>
        </div>

        {/* Application Info */}
        <div className="flex items-center gap-3 w-1/2 justify-center">
          <div className="w-8 h-8 rounded-full bg-[#4A3B65] text-[#C1A2F4] flex items-center justify-center font-bold text-sm">
            {(application?.email?.charAt(0) || 'A').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {application?.email || 'No email'}
            </p>
            <p className="text-xs text-white/60">
              {application?.createdAt
                ? `${Math.floor((new Date() - new Date(application.createdAt)) / (1000 * 60 * 60 * 24))} days ago`
                : 'Recently created'
              }
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-4 w-1/4 justify-end">
          <div className="text-right">
            <StatusPill status={application?.applicationStatus || application?.status} />
            {documents.length > 0 && (
              <p className="text-xs text-white/50 mt-1">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </p>
            )}
          </div>
          <button className="flex items-center text-white/80 hover:text-white">
            <ChevronDown
              size={20}
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[#423577] bg-[#1a1a22] p-4 space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClickView}
              className="flex items-center gap-2 px-4 py-2 bg-[#7350FF] hover:bg-[#6247D3] text-white rounded-lg text-sm font-medium transition-colors duration-200"
            >
              <Eye size={16} />
              View Application
            </button>

            <button
              onClick={() => setDocumentsOpen(!documentsOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${documentsOpen
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-[#3b2b55] hover:bg-[#4a3768] text-white/90'
                }`}
            >
              <FileText size={16} />
              <span>{documentsOpen ? 'Hide' : 'Show'} Documents</span>
              {documents.length > 0 && !documentsOpen && (
                <span className="bg-[#7350FF] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {documents.length}
                </span>
              )}
            </button>
          </div>

          {/* Application Details - Compact Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {application?.email && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Email</div>
                <div className="text-white truncate">{application.email}</div>
              </div>
            )}
            {(application?.phone || application?.phoneNumber) && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Phone</div>
                <div className="text-white">{application.phone || application.phoneNumber}</div>
              </div>
            )}
            {(application?.numberOfTravellers || application?.travelers_count) && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Travelers</div>
                <div className="text-white">{application.numberOfTravellers || application.travelers_count || 1}</div>
              </div>
            )}
            {application?.createdAt && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Created</div>
                <div className="text-white">{new Date(application.createdAt).toLocaleDateString()}</div>
              </div>
            )}
            {(application?.visaType || application?.visa_type) && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Visa Type</div>
                <div className="text-white">{application.visaType || application.visa_type}</div>
              </div>
            )}
            {(application?.entryType || application?.entry_type) && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Entry Type</div>
                <div className="text-white">{application.entryType || application.entry_type}</div>
              </div>
            )}
            {(application?.processingType || application?.processing_type) && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Processing</div>
                <div className="text-white">{application.processingType || application.processing_type}</div>
              </div>
            )}
            {(application?.totalAmount || application?.amount) && (
              <div className="bg-[#2c2c3a] rounded-lg p-3">
                <div className="text-white/60 text-xs font-medium mb-1">Amount</div>
                <div className="text-white">{application.totalAmount ? `$${application.totalAmount}` : application.amount}</div>
              </div>
            )}
          </div>

          {/* Documents Section */}
          {documentsOpen && (
            <div className="bg-[#2c2c3a] rounded-lg p-4 border border-[#423577]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <FileText size={16} className="text-[#7350FF]" />
                  Documents ({documents.length})
                </h4>
              </div>

              {loadingDocuments ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 text-white/60">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#7350FF] border-t-transparent"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/60 text-sm">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <DocumentItem
                      key={doc.id || `${doc.travelerId}-${doc.type}`}
                      document={doc}
                      onUpdateStatus={updateDocStatus}
                      isUpdating={updatingDocument === doc.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentItem({ document, onUpdateStatus, isUpdating }) {
  const getStatusIcon = (status) => {
    const statusLower = String(status || 'pending').toLowerCase();

    if (statusLower === 'approved' || statusLower === 'accepted') {
      return <CheckCircle size={14} className="text-green-400" />;
    }
    if (statusLower === 'rejected' || statusLower === 'declined') {
      return <XCircle size={14} className="text-red-400" />;
    }
    if (statusLower === 'pending' || statusLower === 'uploaded') {
      return <Clock size={14} className="text-yellow-400" />;
    }
    return <AlertCircle size={14} className="text-gray-400" />;
  };

  const getStatusBadge = (status) => {
    const statusLower = String(status || 'pending').toLowerCase();

    if (statusLower === 'approved' || statusLower === 'accepted') {
      return 'bg-green-500/20 text-green-300 border-green-500/40';
    }
    if (statusLower === 'rejected' || statusLower === 'declined') {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
    if (statusLower === 'pending' || statusLower === 'uploaded') {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    }
    return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
  };

  const handleView = () => {
    const url = document?.previewUrl || document?.downloadUrl || document?.url || document?.fileUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const hasViewableUrl = !!(document?.previewUrl || document?.downloadUrl || document?.url || document?.fileUrl);
  const documentName = document.name || document.type || document.documentType || document.title || 'Document';
  const documentStatus = document.status || document.documentStatus || 'pending';

  return (
    <div className="bg-[#1a1a22] border border-[#423577] rounded-lg p-3 hover:bg-[#23232b] transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Document Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-[#4A3B65] rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={14} className="text-[#C1A2F4]" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-white text-sm font-medium truncate mb-1">
              {documentName}
            </h5>
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getStatusBadge(documentStatus)}`}>
                {getStatusIcon(documentStatus)}
                <span className="capitalize">{documentStatus}</span>
              </div>
              {document.size && (
                <span className="text-xs text-white/50">
                  {(document.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasViewableUrl && (
            <button
              onClick={handleView}
              className="p-2 bg-[#7350FF] hover:bg-[#6247D3] text-white rounded-lg transition-colors duration-200"
              title="View document"
            >
              <Eye size={14} />
            </button>
          )}


        </div>
      </div>

      {(document.adminNotes || document.notes) && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
          <span className="text-yellow-300 font-medium">Note: </span>
          <span className="text-yellow-300/90">{document.adminNotes || document.notes}</span>
        </div>
      )}
    </div>
  );
}

// Helper component for detail rows
function DetailRow({ icon, label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-center w-6 h-6">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
        <div className="text-white font-medium text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const norm = String(status || 'pending').replace(/_/g, ' ').toLowerCase();
  let color, icon;

  if (norm.includes('approved') || norm.includes('complete')) {
    color = 'bg-green-500/20 text-green-300 border-green-500/40';
    icon = <CheckCircle size={12} />;
  } else if (norm.includes('reject') || norm.includes('fail')) {
    color = 'bg-red-500/20 text-red-300 border-red-500/40';
    icon = <XCircle size={12} />;
  } else if (norm.includes('processing') || norm.includes('submitted')) {
    color = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    icon = <Clock size={12} />;
  } else {
    color = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    icon = <AlertCircle size={12} />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium ${color}`}>
      {icon}
      <span className="capitalize">{norm}</span>
    </span>
  );
}


