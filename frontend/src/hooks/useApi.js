// frontend/src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from "react";

// ── Generic data-fetching hook ────────────────────────────────────────────────
// Usage:
//   const { data, loading, error, refetch } = useApi(() => employees.list());
//   const { data, loading, error, refetch } = useApi(() => employees.list({ dept }), [dept]);

export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const abortRef = useRef(null);

  const fetch_ = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (!controller.signal.aborted) setData(result);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message || "Something went wrong");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ── Mutation hook (POST/PUT/PATCH/DELETE) ─────────────────────────────────────
// Usage:
//   const { mutate, loading, error, data } = useMutation(
//     (formData) => employees.create(formData),
//     { onSuccess: (data) => navigate("/employees") }
//   );
//   <button onClick={() => mutate(formData)}>Save</button>

export function useMutation(mutator, options = {}) {
  const { onSuccess, onError } = options;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutator(...args);
      setData(result);
      onSuccess?.(result);
      return { success: true, data: result };
    } catch (err) {
      const msg = err.message || "Something went wrong";
      setError(msg);
      onError?.(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [mutator, onSuccess, onError]);

  return { mutate, loading, error, data };
}

// ── Paginated fetch hook ───────────────────────────────────────────────────────
// Usage:
//   const { data, loading, page, setPage, total } = usePaginated(
//     (page, limit) => employees.list({ page, limit }), 20
//   );

export function usePaginated(fetcher, limit = 20) {
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const { data, loading, error, refetch } = useApi(
    () => fetcher(page, limit).then(res => { setTotal(res.total || 0); return res.data || res; }),
    [page, limit]
  );

  return { data, loading, error, page, setPage, total, refetch, totalPages: Math.ceil(total / limit) };
}

export default useApi;
