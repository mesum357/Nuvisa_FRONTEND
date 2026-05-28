import { mergeProcessContent } from '@/constants/processContentDefaults';
import { useMemo } from 'react';
import { useContentData, transformProcessContent } from './useContentData';

export const useProcessContent = () => {
  const { data, loading, error } = useContentData('process-content', transformProcessContent);
  
  const processContent = useMemo(() => mergeProcessContent(data), [data]);
  
  return { processContent, loading, error };
};
