import { z } from 'zod';
import { InputError } from '../shared/portfolio';
import { UNIVERSE, type LedgerInput } from '../shared/types';
import { addLedger, getPortfolio, getRiskSettings, saveRiskSettings } from './database';
import { getAnalysisHistory, publicJob } from './analysis';
import { fetchQuote, MarketError } from './market';
import { reportSchema, validateResearchReport } from '../shared/report-schema';
import { captureResearch } from './research';

interface Env { DB: D1Database; ASSETS: Fetcher; APP_ORIGIN?: string; BRIDGE_TOKEN?: string; BRIDGE_ENABLED?: string }
function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } }); }
async function body(request: Request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new InputError('請使用 JSON 格式。');
  const text = await request.text();
  if (text.length > 100_000) throw new InputError('資料量超出限制。');
  try { return JSON.parse(text); } catch { throw new InputError('JSON 格式無效。'); }
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
  if (path === '/api/health' && method === 'GET') {
    try {
      await env.DB.prepare('SELECT id FROM ledger LIMIT 1').first();
      await getRiskSettings(env.DB);
      await env.DB.prepare('SELECT cancelled_at FROM analysis_jobs LIMIT 1').first();
      return json({ status: 'ok', service: 'northstar-api', storage: true, version: '0.4.0', schemaVersion: 2,
        capabilities: ['portfolio','quotes','risk-settings','analysis-history','queue-cancel','research-v2'] });
    } catch { return json({ status: 'unavailable', service: 'northstar-api', storage: false,
      error: '帳本尚未就緒，請檢查資料庫連線與結構更新。' }, 503); }
  }
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
  if (path === '/api/settings/risk') {
    if (method === 'GET') return json(await getRiskSettings(env.DB));
    if (method === 'POST') {
      const settings = await saveRiskSettings(env.DB, await body(request));
      return settings ? json(settings) : json({ error: '風險設定已在其他視窗更新，請重新載入後再儲存。' }, 409);
    }
  }
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
    const { results } = await env.DB.prepare('SELECT * FROM analysis_jobs ORDER BY created_at DESC,id DESC LIMIT 30').all();
    return json(results.map(publicJob));
  }
  if (path === '/api/analysis/history' && method === 'GET') return json(await getAnalysisHistory(env.DB, url.searchParams));
  const jobPath = path.match(/^\/api\/analysis\/jobs\/([a-f0-9-]{36})(\/cancel)?$/);
  if (jobPath && ((method === 'GET' && !jobPath[2]) || (method === 'POST' && jobPath[2]))) {
    let row = await env.DB.prepare('SELECT * FROM analysis_jobs WHERE id=?').bind(jobPath[1]).first<any>();
    if (!row) return json({ error: '找不到這份分析紀錄。' }, 404);
    if (method === 'GET' || row.cancelled_at) return json(publicJob(row));
    const now = new Date().toISOString();
    const changed = await env.DB.prepare(`UPDATE analysis_jobs SET status='failed',cancelled_at=?,updated_at=?,error='已取消排隊，未執行分析。'
      WHERE id=? AND status='queued' RETURNING *`).bind(now, now, row.id).first<any>();
    if (changed) return json(publicJob(changed));
    row = await env.DB.prepare('SELECT * FROM analysis_jobs WHERE id=?').bind(jobPath[1]).first<any>();
    return row?.cancelled_at ? json(publicJob(row)) : json({ error: '工作已開始或已結束，不能再取消排隊。' }, 409);
  }
  if (path === '/api/analysis/jobs' && method === 'POST') {
    if (!env.BRIDGE_TOKEN || env.BRIDGE_ENABLED !== 'true') return json({ error: 'Mac 分析端尚未設定，請先完成本機連接。' }, 503);
    const input = z.object({ symbol: z.enum(UNIVERSE.map(x => x.symbol) as [string,...string[]]),
      horizon: z.enum(['month','short','swing','long']), risk: z.enum(['conservative','balanced','aggressive']),
      settingsRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional() }).parse(await body(request));
    const settings = await getRiskSettings(env.DB);
    if (input.settingsRevision !== undefined && input.settingsRevision !== settings.revision)
      return json({ error: '風險設定已更新，請重新載入設定後再分析。' }, 409);
    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE analysis_jobs SET status='failed',error='Mac 工作中斷，請重新分析。',updated_at=? WHERE status='running' AND updated_at<?")
      .bind(now, new Date(Date.now()-900_000).toISOString()).run();
    const [quote, researchSnapshot] = await Promise.all([fetchQuote(input.symbol),captureResearch(input.symbol,input.horizon,new Date(now))]);
    const snapshot = { quote, horizon: input.horizon, risk: input.risk, capturedAt: now,
      riskLimits: settings.profiles[input.risk], settingsRevision: settings.revision,researchSnapshot,reportVersion:2,reportContract:'learning-prices-citations-v1' };
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
      const row=await env.DB.prepare("SELECT snapshot FROM analysis_jobs WHERE id=? AND claim_token=? AND status='running'").bind(input.id,input.claimToken).first<{snapshot:string}>();
      if(!row)return json({error:'工作已結束或租約不符。'},409);
      if(input.report){
        const saved=JSON.parse(row.snapshot);
        if(saved.reportVersion===2&&!input.report.research)throw new InputError('這份工作需要新版研究報告，請更新 Mac 分析連接程式。');
        if(saved.reportContract==='learning-prices-citations-v1'&&(!input.report.research?.references||!('sellPrice' in input.report)||!('takeProfitPrice' in input.report)||input.report.research.newsImpact.some(item=>!item.mechanism)))throw new InputError('這份工作需要教學因果、四類價位與逐段註腳，請更新 Mac 分析程式。');
        const invalid=validateResearchReport(input.report);if(invalid)throw new InputError(invalid);
        if(input.report.research?.rating!==null&&input.report.research){
          const fundamentals=input.report.research.evidence.find(item=>item.kind==='financials');
          const isETF=UNIVERSE.find(stock=>stock.symbol===saved.quote?.symbol)?.sector==='ETF';
          const hasFinancials=fundamentals?.status==='available'&&fundamentals.metrics.length>0||isETF&&fundamentals?.status==='not-applicable';
          if(!saved.researchSnapshot?.chart||saved.researchSnapshot.chart.bars.length<50||!hasFinancials)
            throw new InputError('日 K 線或財務證據不足，請改用資料不足狀態並列明缺漏。');
        }
      }
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
