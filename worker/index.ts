import { z } from 'zod';
import { InputError } from '../shared/portfolio';
import { UNIVERSE, type AnalysisJob, type LedgerInput } from '../shared/types';
import { addLedger, getPortfolio } from './database';
import { fetchQuote, MarketError } from './market';

interface Env { DB: D1Database; ASSETS: Fetcher; APP_ORIGIN?: string; BRIDGE_TOKEN?: string; BRIDGE_ENABLED?: string }
const reportSchema = z.object({
  verdict: z.enum(['buy','hold','reduce','avoid','insufficient-data']), summary: z.string().min(1).max(2000),
  reasons: z.array(z.string().max(2000)).max(12), risks: z.array(z.string().max(2000)).max(12),
  entryPrice: z.number().positive().nullable(), targetPrice: z.number().positive().nullable(), stopLoss: z.number().positive().nullable(),
  details: z.string().max(30000), sources: z.array(z.object({ title: z.string().max(500), url: z.url().startsWith('https://'), asOf: z.string().max(100) })).max(30),
  missingData: z.array(z.string().max(1000)).max(30),
});
function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
async function body(request: Request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new InputError('請使用 JSON 格式。');
  const text = await request.text();
  if (text.length > 100_000) throw new InputError('資料量超出限制。');
  try { return JSON.parse(text); } catch { throw new InputError('JSON 格式無效。'); }
}
function publicJob(row: any): AnalysisJob {
  return { id: row.id, symbol: row.symbol, horizon: row.horizon, risk: row.risk, status: row.status,
    result: row.result ? JSON.parse(row.result) : null, error: row.error, createdAt: row.created_at, updatedAt: row.updated_at };
}
async function bridgeAuthorized(request: Request, env: Env) {
  if (!env.BRIDGE_TOKEN || env.BRIDGE_ENABLED !== 'true') return false;
  const expected = new TextEncoder().encode(`Bearer ${env.BRIDGE_TOKEN}`);
  const actual = new TextEncoder().encode(request.headers.get('Authorization') ?? '');
  if (actual.byteLength !== expected.byteLength) return false;
  const a = new Uint8Array(await crypto.subtle.digest('SHA-256', actual));
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', expected));
  return a.reduce((difference, byte, i) => difference | (byte ^ b[i]), 0) === 0;
}

async function api(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (path === '/api/health') return json({ status: 'ok', storage: !!env.DB, version: '0.1.0' });
  if (path === '/api/universe') return json(UNIVERSE);
  if (path === '/api/quote' && method === 'GET') {
    const symbol = (url.searchParams.get('symbol') ?? '').toUpperCase();
    const range = url.searchParams.get('range') ?? '1D';
    const key = new Request(`${url.origin}/api/quote?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
    const cache = await caches.open('market-quotes');
    const cached = await cache.match(key);
    if (cached) return cached;
    const quote = await fetchQuote(symbol, range);
    const response = Response.json(quote, { headers: { 'Cache-Control': 'public, max-age=5' } });
    ctx.waitUntil(cache.put(key, response.clone()));
    return response;
  }
  if (path === '/api/portfolio' && method === 'GET') return json(await getPortfolio(env.DB));
  if (path === '/api/ledger' && method === 'POST') return json(await addLedger(env.DB, await body(request) as LedgerInput), 201);
  if (path === '/api/watchlist') {
    if (method === 'GET') {
      const { results } = await env.DB.prepare('SELECT symbol FROM watchlist ORDER BY added_at,symbol').all<{symbol:string}>();
      return json(results.map(x => x.symbol));
    }
    if (method === 'POST' || method === 'DELETE') {
      const { symbol } = z.object({ symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/) }).parse(await body(request));
      await env.DB.prepare(method === 'POST' ? 'INSERT OR IGNORE INTO watchlist VALUES (?,?)' : 'DELETE FROM watchlist WHERE symbol=?')
        .bind(...(method === 'POST' ? [symbol, new Date().toISOString()] : [symbol])).run();
      return json({ ok: true });
    }
  }
  if (path === '/api/analysis/status') {
    const state = await env.DB.prepare('SELECT last_seen FROM bridge_state WHERE id=1').first<{last_seen:string}>();
    return json({ enabled: !!env.BRIDGE_TOKEN && env.BRIDGE_ENABLED === 'true',
      online: !!state && Date.now() - Date.parse(state.last_seen) < 90_000, lastSeen: state?.last_seen ?? null });
  }
  if (path === '/api/analysis/jobs' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM analysis_jobs ORDER BY created_at DESC LIMIT 30').all();
    return json(results.map(publicJob));
  }
  if (path === '/api/analysis/jobs' && method === 'POST') {
    if (!env.BRIDGE_TOKEN || env.BRIDGE_ENABLED !== 'true') return json({ error: 'Mac 分析端尚未設定，請先完成本機連接。' }, 503);
    const input = z.object({ symbol: z.enum(UNIVERSE.map(x => x.symbol) as [string,...string[]]),
      horizon: z.enum(['short','swing','long']), risk: z.enum(['conservative','balanced','aggressive']) }).parse(await body(request));
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE analysis_jobs SET status='failed',error='Mac 工作中斷，請重新分析。',updated_at=? WHERE status='running' AND updated_at<?")
      .bind(now, new Date(Date.now()-900_000).toISOString()).run();
    const [quote, portfolio] = await Promise.all([fetchQuote(input.symbol), getPortfolio(env.DB)]);
    const snapshot = { quote, portfolio, horizon: input.horizon, risk: input.risk, capturedAt: now };
    const id = crypto.randomUUID();
    const inserted = await env.DB.prepare(`INSERT INTO analysis_jobs (id,symbol,horizon,risk,snapshot,created_at,updated_at)
      SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM analysis_jobs WHERE status IN ('queued','running'))`)
      .bind(id,input.symbol,input.horizon,input.risk,JSON.stringify(snapshot),now,now).run();
    if (!inserted.meta.changes) return json({ error: '已有分析排隊或執行中，請先等待完成。' }, 409);
    return json(publicJob(await env.DB.prepare('SELECT * FROM analysis_jobs WHERE id=?').bind(id).first()), 201);
  }
  if (path.startsWith('/api/bridge/')) {
    if (!await bridgeAuthorized(request, env)) return json({ error: '分析端驗證失敗。' }, 401);
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO bridge_state VALUES(1,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen').bind(now).run();
    if (path === '/api/bridge/claim' && method === 'POST') {
      const token = crypto.randomUUID();
      const row = await env.DB.prepare(`UPDATE analysis_jobs SET status='running',claim_token=?,updated_at=?
        WHERE id=(SELECT id FROM analysis_jobs WHERE status='queued' ORDER BY created_at LIMIT 1) AND status='queued' RETURNING *`)
        .bind(token,now).first<any>();
      return json(row ? { id: row.id, claimToken: token, snapshot: JSON.parse(row.snapshot) } : null);
    }
    if (path === '/api/bridge/heartbeat' && method === 'POST') {
      const input = z.object({ id:z.string(), claimToken:z.string() }).parse(await body(request));
      await env.DB.prepare("UPDATE analysis_jobs SET updated_at=? WHERE id=? AND claim_token=? AND status='running'").bind(now,input.id,input.claimToken).run();
      return json({ ok:true });
    }
    if (path === '/api/bridge/result' && method === 'POST') {
      const input = z.object({ id:z.string(),claimToken:z.string(),report:reportSchema.optional(),error:z.string().max(1000).optional() }).parse(await body(request));
      if (!input.report && !input.error) throw new InputError('分析結果為空。');
      const updated = await env.DB.prepare("UPDATE analysis_jobs SET status=?,result=?,error=?,updated_at=? WHERE id=? AND claim_token=? AND status='running'")
        .bind(input.report?'completed':'failed',input.report?JSON.stringify(input.report):null,input.report?null:input.error,now,input.id,input.claimToken).run();
      return updated.meta.changes ? json({ok:true}) : json({error:'工作已結束或租約不符。'},409);
    }
  }
  return json({ error: '找不到這個 API。' }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const origin = request.headers.get('Origin');
    const allowed = !origin || origin === url.origin || origin === env.APP_ORIGIN;
    if (!allowed) return json({ error: '不接受這個網站來源。' }, 403);
    const cors: Record<string,string> = origin && origin !== url.origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors,
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' } });
    try {
      const response = await api(request, env, ctx);
      Object.entries(cors).forEach(([key,value]) => response.headers.set(key,value));
      return response;
    } catch (error) {
      const response = json({ error: error instanceof InputError || error instanceof MarketError ? error.message :
        error instanceof z.ZodError ? '輸入資料不完整或格式無效。' : '服務暫時無法完成請求，請稍後重試。' },
        error instanceof InputError || error instanceof z.ZodError ? 400 : error instanceof MarketError ? error.status : 500);
      Object.entries(cors).forEach(([key,value]) => response.headers.set(key,value));
      return response;
    }
  },
};
