import { useCallback, useState } from 'react';
import { AxiosError } from 'axios';

interface UseFormState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

interface UseFormActions<T> {
  setState: (data: Partial<T>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useForm = <T extends Record<string, any>>(
  initialState: T
): UseFormState<T> & UseFormActions<T> => {
  const [state, setState] = useState<UseFormState<T>>({
    data: initialState,
    loading: false,
    error: null,
  });

  const handleSetState = useCallback((data: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...data },
      error: null,
    }));
  }, []);

  const handleSetLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const handleSetError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const handleReset = useCallback(() => {
    setState({
      data: initialState,
      loading: false,
      error: null,
    });
  }, [initialState]);

  return {
    ...state,
    setState: handleSetState,
    setLoading: handleSetLoading,
    setError: handleSetError,
    reset: handleReset,
  };
};

export const useAsync = <T, E extends AxiosError>(
  asyncFunction: () => Promise<T>,
  immediate = true
) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  if (immediate) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useCallback(() => {
      execute();
    }, [execute]);
  }

  return { execute, status, data, error };
};
