import { useState, useEffect } from 'react';

export const useHeroContent = () => {
  const [heroContent, setHeroContent] = useState({
    title: "Don't Postpone Your Happiness!",
    description: 'Flat £200 fee, faster processing, dedicated support',
    ctaText: 'Get the Visa',
    ctaLink: '/get-the-visa',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from admin panel API first
        const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001'}/api/public/hero-content`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const contentMap = {};
            data.data.forEach((item) => {
              contentMap[item.key] = item.value;
            });
            
            setHeroContent({
              title: contentMap['hero_title'] || heroContent.title,
              description: contentMap['hero_description'] || heroContent.description,
              ctaText: contentMap['hero_cta_text'] || heroContent.ctaText,
              ctaLink: contentMap['hero_cta_link'] || heroContent.ctaLink,
            });
          }
        } else {
          // Fallback to default values if API fails
          console.warn('Failed to fetch hero content from API, using defaults');
        }
      } catch (err) {
        console.warn('Error fetching hero content:', err);
        setError('Failed to load dynamic content');
        // Keep default values
      } finally {
        setLoading(false);
      }
    };

    fetchHeroContent();
  }, []);

  return {
    heroContent,
    loading,
    error,
  };
};
