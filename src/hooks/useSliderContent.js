import { useEffect, useState } from 'react';

export const useSliderContent = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';
        const res = await fetch(`${base}/api/public/slider-content?t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to load slider content');
        const json = await res.json();
        const payload = Array.isArray(json) ? json : (json.data || json.items || []);
        if (Array.isArray(payload)) {
          const map = {};
          payload.forEach((item) => {
            if (item && item.key !== undefined) {
              map[item.key] = item.value;
            }
          });
          setContent(map);
        } else {
          // As a fallback, if API returned an object map already
          if (json && typeof json === 'object') {
            setContent(json);
          }
        }
      } catch (e) {
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return { content, loading, error };
};


