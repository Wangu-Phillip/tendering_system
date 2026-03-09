import { useEffect, useState } from 'react';
import firestoreService from '@/firebase/firestore';
import { Bid } from '@types';

export const useBids = (filters?: Record<string, any>) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getDocuments('bids');
        setBids(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bids');
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [filters]);

  return { bids, loading, error };
};

export const useBidDetail = (id: string) => {
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBid = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getDocument('bids', id);
        setBid(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bid');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBid();
    }
  }, [id]);

  return { bid, loading, error };
};
