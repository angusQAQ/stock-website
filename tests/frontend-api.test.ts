import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe('GitHub Pages API configuration', () => {
  it('does not queue research on GitHub Pages when the backend is absent', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_TARGET', 'github-pages');
    vi.stubEnv('VITE_API_BASE_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { post, API_AVAILABLE } = await import('../src/api');
    expect(API_AVAILABLE).toBe(false);
    await expect(post('/analysis/jobs', { symbol: 'AAPL', horizon: 'month', risk: 'balanced' })).rejects.toThrow('尚未連接研究服務');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('uses the configured API origin while leaving the Pages project URL independent', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_TARGET', 'github-pages');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/');
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ cashCents: 10000 }));
    vi.stubGlobal('fetch', fetchMock);
    const { api, API_AVAILABLE } = await import('../src/api');
    expect(API_AVAILABLE).toBe(true);
    expect(await api('/portfolio')).toEqual({ cashCents: 10000 });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/portfolio');
  });
  it('times out a stalled request instead of leaving a save or report waiting forever', async () => {
    vi.useFakeTimers(); vi.stubEnv('VITE_DEPLOYMENT_TARGET','cloudflare');
    vi.stubGlobal('fetch',vi.fn((_url,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))))));
    const { api }=await import('../src/api');
    const pending=expect(api('/portfolio')).rejects.toThrow('逾時');
    await vi.advanceTimersByTimeAsync(15_000);await pending;
  });
  it('keeps navigation cancellation separate from a connection failure', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_TARGET','cloudflare');
    vi.stubGlobal('fetch',vi.fn((_url,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))))));
    const { api }=await import('../src/api');const controller=new AbortController();
    const pending=expect(api('/analysis/history',{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});
    controller.abort();await pending;
  });
});
