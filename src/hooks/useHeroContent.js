import { useState, useEffect } from 'react';
import { DEFAULT_HERO_DESCRIPTION } from '@/utils/parseHeroDescription';

export const useHeroContent = () => {
  const [heroContent, setHeroContent] = useState({
    title: "Don't Postpone Your Happines!",
    description: DEFAULT_HERO_DESCRIPTION,
    ctaText: 'Get the Visa',
    ctaLink: '/get-the-visa',
    discountTicketText: 'Students! Get 10% Off',
    discountTicketLink: '/get-the-visa',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/public/hero-content');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const contentMap = {};
            data.data.forEach((item) => {
              contentMap[item.key] = item.value;
            });
            
            setHeroContent((prevContent) => {
              const next = {
                title: contentMap.hero_title || prevContent.title,
                description: contentMap.hero_description || prevContent.description,
                ctaText: contentMap.hero_cta_text || prevContent.ctaText,
                ctaLink: contentMap.hero_cta_link || prevContent.ctaLink,
                discountTicketText:
                  contentMap.hero_discount_ticket_text || prevContent.discountTicketText,
                discountTicketLink:
                  contentMap.hero_discount_ticket_link || prevContent.discountTicketLink,
              };
              const unchanged =
                next.title === prevContent.title &&
                next.description === prevContent.description &&
                next.ctaText === prevContent.ctaText &&
                next.ctaLink === prevContent.ctaLink &&
                next.discountTicketText === prevContent.discountTicketText &&
                next.discountTicketLink === prevContent.discountTicketLink;
              return unchanged ? prevContent : next;
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
