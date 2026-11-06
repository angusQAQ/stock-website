import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe('GitHub Pages API configuration', () => {
  it('does not send financial writes to GitHub Pages when the backend is absent', async () => {
    vi.stubEnv('VITE_DEPLOYMENT_TARGET', 'github-pages');
    vi.stubEnv('VITE_API_BASE_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { post, API_AVAILABLE } = await import('../src/api');
    expect(API_AVAILABLE).toBe(false);
    await expect(post('/ledger', { kind: 'deposit', amount: '100' })).rejects.toThrow('不會被儲存');
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
});
