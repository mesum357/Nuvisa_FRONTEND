import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const adminApi = axios.create({
  baseURL: `${BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const addAuthToken = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Get application overview - all applications with their status
 * @param {string} token - Authentication token
 * @returns {Promise} API response
 */
export const getApplicationOverview = async (token) => {
  try {
    const response = await adminApi.get('/orders/application-overview', addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error fetching application overview:', error);
    throw error;
  }
};

/**
 * Get documents overview - all documents with upload status
 * @param {string} token - Authentication token
 * @returns {Promise} API response
 */
export const getDocumentsOverview = async (token) => {
  try {
    const response = await adminApi.get('/orders/documents-overview', addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error fetching documents overview:', error);
    throw error;
  }
};

/**
 * Search applications by various criteria
 * @param {string} token - Authentication token
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.query - Search query
 * @param {string} searchParams.type - Search type (all, applicationId, orderId)
 * @param {string} searchParams.status - Application status filter
 * @param {string} searchParams.country - Country filter
 * @param {string} searchParams.dateFrom - Date range start
 * @param {string} searchParams.dateTo - Date range end
 * @returns {Promise} API response
 */
export const searchApplications = async (token, searchParams) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        queryParams.append(key, value);
      }
    });

    const response = await adminApi.get(`/orders/search?${queryParams.toString()}`, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error searching applications:', error);
    throw error;
  }
};

/**
 * Get detailed application information
 * @param {string} token - Authentication token
 * @param {string} applicationId - Application ID
 * @returns {Promise} API response
 */
export const getApplicationDetails = async (token, applicationId) => {
  try {
    const response = await adminApi.get(`/orders/application/${applicationId}`, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error fetching application details:', error);
    throw error;
  }
};

/**
 * Update application status
 * @param {string} token - Authentication token
 * @param {string} applicationId - Application ID
 * @param {Object} updateData - Update data
 * @param {string} updateData.status - New status
 * @param {string} updateData.notes - Admin notes
 * @returns {Promise} API response
 */
export const updateApplicationStatus = async (token, applicationId, updateData) => {
  try {
    const response = await adminApi.patch(`/orders/application/${applicationId}/status`, updateData, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

/**
 * Get traveler documents
 * @param {string} token - Authentication token
 * @param {string} applicationId - Application ID
 * @param {string} travelerId - Traveler ID
 * @returns {Promise} API response
 */
export const getTravelerDocuments = async (token, applicationId, travelerId) => {
  try {
    const response = await adminApi.get(`/orders/application/${applicationId}/traveler/${travelerId}/documents`, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error fetching traveler documents:', error);
    throw error;
  }
};

/**
 * Update document status
 * @param {string} token - Authentication token
 * @param {string} documentId - Document ID
 * @param {Object} updateData - Update data
 * @param {string} updateData.status - New status (approved, rejected, pending)
 * @param {string} updateData.notes - Admin notes
 * @returns {Promise} API response
 */
export const updateDocumentStatus = async (token, documentId, updateData) => {
  try {
    const response = await adminApi.patch(`/orders/document/${documentId}/status`, updateData, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};

/**
 * Get application statistics
 * @param {string} token - Authentication token
 * @param {Object} filters - Optional filters
 * @returns {Promise} API response
 */
export const getApplicationStats = async (token, filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await adminApi.get(`/orders/stats?${queryParams.toString()}`, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error fetching application stats:', error);
    throw error;
  }
};

/**
 * Export applications data
 * @param {string} token - Authentication token
 * @param {Object} exportParams - Export parameters
 * @param {string} exportParams.format - Export format (csv, xlsx)
 * @param {Array} exportParams.applicationIds - Specific application IDs to export
 * @param {Object} exportParams.filters - Filter criteria
 * @returns {Promise} API response with file data
 */
export const exportApplications = async (token, exportParams) => {
  try {
    const response = await adminApi.post('/orders/export', exportParams, {
      ...addAuthToken(token),
      responseType: 'blob', // Important for file downloads
    });
    return response;
  } catch (error) {
    console.error('Error exporting applications:', error);
    throw error;
  }
};

/**
 * Send notification to traveler
 * @param {string} token - Authentication token
 * @param {string} applicationId - Application ID
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.type - Notification type (email, sms)
 * @param {string} notificationData.message - Message content
 * @param {string} notificationData.subject - Email subject (for email type)
 * @returns {Promise} API response
 */
export const sendNotification = async (token, applicationId, notificationData) => {
  try {
    const response = await adminApi.post(`/orders/application/${applicationId}/notify`, notificationData, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Get application activity log
 * @param {string} token - Authentication token
 * @param {string} applicationId - Application ID
 * @returns {Promise} API response
 */
export const getApplicationActivity = async (token, applicationId) => {
  try {
    const response = await adminApi.get(`/orders/application/${applicationId}/activity`, addAuthToken(token));
    return response;
  } catch (error) {
    console.error('Error fetching application activity:', error);
    throw error;
  }
};

export default {
  getApplicationOverview,
  getDocumentsOverview,
  searchApplications,
  getApplicationDetails,
  updateApplicationStatus,
  getTravelerDocuments,
  updateDocumentStatus,
  getApplicationStats,
  exportApplications,
  sendNotification,
  getApplicationActivity,
};