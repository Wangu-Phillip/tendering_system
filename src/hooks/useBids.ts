import { useEffect, useState } from 'react';
import firestoreService from '@/firebase/firestore';
import { Bid } from '@types';

export const useBids = (filters?: Record<string, any>) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBids();
  }, [filters]);

  const refetch = () => fetchBids();

  return { bids, loading, error, refetch };
};

export const useBidDetail = (id: string) => {
  const [bid, setBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (id) {
      fetchBid();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchBid();
    }
  };

  return { bid, loading, error, refetch };
};
