import { useCallback, useEffect, useState } from "react";

// Asenkron veri yükleme için küçük yardımcı hook.
// Tauri komutları (veya mock) Promise döndürür; bu hook durumu yönetir.
export function useData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoFetcher = useCallback(fetcher, deps);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    memoFetcher()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [memoFetcher]);

  useEffect(load, [load]);

  return { data, loading, error, reload: load };
}
