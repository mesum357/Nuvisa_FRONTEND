import { useState, useEffect } from 'react';
import { fetchContent, mapContentArray } from '../utils/apiHelper';

/**
 * Generic hook for fetching and caching content data
 * @param {string} endpoint - API endpoint path
 * @param {Function} transformData - Function to transform raw data into component format
 * @returns {Object} - { data, loading, error }
 */
export const useContentData = (endpoint, transformData) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const rawData = await fetchContent(endpoint);
        
        if (isMounted && rawData) {
          const transformedData = transformData(rawData);
          setData(transformedData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load content');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [endpoint, transformData]);

  return { data, loading, error };
};

/**
 * Transform Klarna content data into component-friendly format
 */
export const transformKlarnaContent = (rawData) => {
  const contentMap = mapContentArray(rawData);

  return {
    heading: contentMap.klarna_heading || '',
    subtitle: contentMap.klarna_subtitle || '',
    paymentAmount: contentMap.klarna_payment_amount || '',
    interestRate: contentMap.klarna_interest_rate || '',
    fees: contentMap.klarna_fees || '',
  };
};

/**
 * Transform Process content data into component-friendly format
 */
export const transformProcessContent = (rawData) => {
  const contentMap = mapContentArray(rawData);

  return {
    heading: (contentMap.process_heading || '').replace(/\\n/g, '\n'),
    description: contentMap.process_description || '',
    steps: [
      { title: contentMap.step1_title || '', description: contentMap.step1_description || '' },
      { title: contentMap.step2_title || '', description: contentMap.step2_description || '' },
      { title: contentMap.step3_title || '', description: contentMap.step3_description || '' },
      { title: contentMap.step4_title || '', description: contentMap.step4_description || '' }
    ]
  };
};

