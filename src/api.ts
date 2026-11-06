const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const API_AVAILABLE = import.meta.env.VITE_DEPLOYMENT_TARGET !== 'github-pages' || BASE !== '';
export const API_UNAVAILABLE_MESSAGE = 'GitHub Pages 目前只部署介面，尚未連接雲端 API；資金與持倉不會被儲存。';
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_AVAILABLE) throw new Error(API_UNAVAILABLE_MESSAGE);
  const response = await fetch(`${BASE}/api${path}`, { ...init,
    headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) throw new Error('尚未連接雲端服務，請先完成 API 部署。');
  const data = await response.json();
  if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data ? String(data.error) : `請求失敗（${response.status}）`);
  return data as T;
}
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });
