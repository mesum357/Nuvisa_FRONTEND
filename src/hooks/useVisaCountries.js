import { useState, useEffect, useCallback } from 'react';
export const useVisaCountries = (activeOnly = true) => {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/visa-countries${activeOnly ? '?active=true' : ''}`,
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch visa countries');
      }

      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        setCountries(json.data);
      } else {
        setCountries([]);
      }
    } catch (err) {
      console.error('Error fetching visa countries:', err);
      setError(err);
      setCountries([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return { countries, isLoading, error, refetch: fetchCountries };
};
