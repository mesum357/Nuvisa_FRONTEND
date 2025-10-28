import { useMemo } from 'react';
import { useContentData, transformKlarnaContent } from './useContentData';

export const useKlarnaContent = () => {
  const { data, loading, error } = useContentData('klarna-content', transformKlarnaContent);
  
  const klarnaContent = useMemo(() => data || {
    heading: '',
    subtitle: '',
    paymentAmount: '',
    interestRate: '',
    fees: ''
  }, [data]);
  
  return { klarnaContent, loading, error };
};
