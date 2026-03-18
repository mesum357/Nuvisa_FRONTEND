import { useMemo } from 'react';
import { useContentData } from './useContentData';

/**
 * Transform Recommended Section content data into component-friendly format
 */
export const transformRecommendedContent = (rawData) => {
  if (!rawData) return null;

  return {
    id: rawData.id,
    title: rawData.title || 'More to love',
    description: rawData.description || '',
    cards: (rawData.cards || []).map(card => ({
      title: card.title || '',
      description: card.description || '',
      image: card.image || '',
      price: card.price || '',
      strikeOutPrice: card.strikeOutPrice || ''
    }))
  };
};

export const useRecommendedSection = () => {
  const { data, loading, error } = useContentData('recommended-section', transformRecommendedContent);
  
  const recommendedContent = useMemo(() => data || {
    title: 'More to love',
    description: '',
    cards: []
  }, [data]);
  
  return { recommendedContent, loading, error };
};
