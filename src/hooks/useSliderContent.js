import { mergeSliderContentMap } from '@/constants/sliderContentDefaults';
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
        const bust = process.env.NODE_ENV !== 'production' ? `?t=${Date.now()}` : '';
        const res = await fetch(`/api/slider-content${bust}`, { cache: 'no-store' });
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
          setContent(mergeSliderContentMap(map));
        } else {
          // As a fallback, if API returned an object map already
          if (json && typeof json === 'object') {
            setContent(mergeSliderContentMap(json));
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


