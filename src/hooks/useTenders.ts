import { useEffect, useState } from 'react';
import firestoreService from '@/firebase/firestore';
import { Tender } from '@types';

export const useTenders = (filters?: Record<string, any>) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getDocuments('tenders');
        setTenders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tenders');
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, [filters]);

  return { tenders, loading, error };
};

export const useTenderDetail = (id: string) => {
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTender = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getDocument('tenders', id);
        setTender(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tender');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTender();
    }
  }, [id]);

  return { tender, loading, error };
};
