import { useMemo } from 'react';
import { useContentData, transformProcessContent } from './useContentData';

export const useProcessContent = () => {
  const { data, loading, error } = useContentData('process-content', transformProcessContent);
  
  const processContent = useMemo(() => data || {
    heading: '',
    description: '',
    steps: [
      { title: '', description: '' },
      { title: '', description: '' },
      { title: '', description: '' },
      { title: '', description: '' }
    ]
  }, [data]);
  
  return { processContent, loading, error };
};
