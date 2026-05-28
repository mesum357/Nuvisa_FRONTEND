import { mergeKlarnaContent } from '@/constants/klarnaContentDefaults';
import { useMemo } from 'react';
import { useContentData, transformKlarnaContent } from './useContentData';

export const useKlarnaContent = () => {
  const { data, loading, error } = useContentData('klarna-content', transformKlarnaContent);
  
  const klarnaContent = useMemo(() => mergeKlarnaContent(data), [data]);
  
  return { klarnaContent, loading, error };
};
