import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(fetcher, deps = []) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const requestId = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = requestId.current + 1;
      requestId.current = id;
      if (!silent) {
        setState((previous) => ({
          ...previous,
          loading: true,
          error: null,
        }));
      }
      try {
        const data = await fetcherRef.current();
        if (requestId.current === id) {
          setState({ data, loading: false, error: null });
        }
        return data;
      } catch (error) {
        if (requestId.current === id) {
          setState({ data: null, loading: false, error: error.message });
        }
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    load().catch(() => {});
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const reload = useCallback(
    (options) => load(options).catch(() => {}),
    [load]
  );

  return { ...state, reload, setData: (data) => setState((prev) => ({ ...prev, data })) };
}
