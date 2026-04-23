import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_STATUS = {
  status: 'idle',
  data: null,
  error: null,
};

export const useAsyncResource = ({
  loader,
  deps = [],
  enabled = true,
  initialData = null,
}) => {
  const mountedRef = useRef(false);
  const callIdRef = useRef(0);
  const loaderRef = useRef(loader);
  const [state, setState] = useState({
    ...DEFAULT_STATUS,
    data: initialData,
    status: enabled ? 'loading' : 'idle',
  });

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const execute = useCallback(async () => {
    if (!enabled || typeof loaderRef.current !== 'function') return null;

    const currentCallId = ++callIdRef.current;
    setState((current) => ({
      ...current,
      status: current.data == null ? 'loading' : 'refreshing',
      error: null,
    }));

    try {
      const result = await loaderRef.current();
      if (!mountedRef.current || currentCallId !== callIdRef.current) return null;

      setState({
        status: 'success',
        data: result,
        error: null,
      });
      return result;
    } catch (error) {
      if (!mountedRef.current || currentCallId !== callIdRef.current) return null;

      setState((current) => ({
        ...current,
        status: 'error',
        error,
      }));
      return null;
    }
  }, [enabled]);
  const depsSignature = JSON.stringify(deps ?? []);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      execute();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, execute, depsSignature]);

  const retry = useCallback(() => execute(), [execute]);

  return useMemo(() => {
    const hasDataArray = Array.isArray(state.data);

    return {
      ...state,
      retry,
      isIdle: state.status === 'idle',
      isLoading: state.status === 'loading',
      isRefreshing: state.status === 'refreshing',
      isError: state.status === 'error',
      isSuccess: state.status === 'success',
      isEmpty: hasDataArray ? state.data.length === 0 : state.data == null,
    };
  }, [retry, state]);
};

export default useAsyncResource;
