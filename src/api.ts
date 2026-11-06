const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const API_AVAILABLE = import.meta.env.VITE_DEPLOYMENT_TARGET !== 'github-pages' || BASE !== '';
export const API_UNAVAILABLE_MESSAGE = 'GitHub Pages 目前只部署介面，尚未連接雲端 API；資金與持倉不會被儲存。';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_AVAILABLE) throw new Error(API_UNAVAILABLE_MESSAGE);
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), 15_000);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutController.signal]) : timeoutController.signal;
  try {
    const response = await fetch(`${BASE}/api${path}`, { ...init, signal,
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
    const contentType = response.headers.get('Content-Type') ?? '';
    if (!contentType.includes('application/json')) throw new Error('尚未連接雲端服務，請先完成 API 部署。');
    let data: unknown;
    try { data = await response.json(); } catch { throw new Error('資料服務回應格式無效，請稍後重試。'); }
    if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data ? String(data.error) : `請求失敗（${response.status}）`);
    return data as T;
  } catch (error) {
    if (timeoutController.signal.aborted && !init?.signal?.aborted) throw new Error('資料服務連線逾時，請稍後重試。');
    if (error instanceof TypeError) throw new Error('無法連接資料服務，請檢查網絡與服務連線設定。');
    throw error;
  } finally { clearTimeout(timer); }
}
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });
