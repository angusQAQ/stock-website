import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker/index';
import { getRiskSettings, saveRiskSettings } from '../worker/database';
import { initialRiskSettings, parseRiskSettings } from '../shared/risk';
import { sqliteD1 } from './support/sqlite';
import { researchReport } from './support/research';

let env: any;
const ctx = { waitUntil() {} } as any;
const machineToken = 'local-workflow-test-only';
async function request(path: string, body?: unknown, bridge = false) {
  return worker.fetch(new Request('https://site.test/api' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(bridge ? { Authorization: `Bearer ${machineToken}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env, ctx);
}
beforeEach(() => {
  env = { DB: sqliteD1(), BRIDGE_ENABLED: 'true', BRIDGE_TOKEN: machineToken };
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ chart: { result: [{ meta: {
    currency: 'USD', instrumentType: 'EQUITY', regularMarketPrice: 100,
    regularMarketTime: Math.floor(Date.now()/1000), previousClose: 99,
  }, timestamp: [], indicators: { quote: [{}] } }] } })));
});
afterEach(() => vi.unstubAllGlobals());

describe('versioned investment limits', () => {
  it('returns clearly unsaved initial proposals without creating settings', async () => {
    const settings = await getRiskSettings(env.DB);
    expect(settings.revision).toBe(0); expect(settings.updatedAt).toBeNull();
    settings.profiles.balanced.maxPositionBps = 9999;
    expect((await getRiskSettings(env.DB)).profiles.balanced.maxPositionBps).toBe(1500);
  });
  it('persists all three profiles and rejects concurrent stale writes', async () => {
    const input = initialRiskSettings();
    input.profiles.balanced = { maxPositionBps: 2000, riskPerTradeBps: 150 };
    const writes = await Promise.all([saveRiskSettings(env.DB, {revision:input.revision, profiles:input.profiles}), saveRiskSettings(env.DB, {revision:input.revision, profiles:input.profiles})]);
    expect(writes.filter(Boolean)).toHaveLength(1);
    const saved = await getRiskSettings(env.DB);
    expect(saved.revision).toBe(1); expect(saved.profiles.balanced.maxPositionBps).toBe(2000);
    expect(saved.updatedAt).not.toBeNull();
    expect(await saveRiskSettings(env.DB, { revision: 0, profiles: input.profiles })).toBeNull();
    expect((await saveRiskSettings(env.DB, { revision: 1, profiles: input.profiles }))?.revision).toBe(2);
  });
  it('rejects a non-existent revision without inserting settings', async () => {
    expect(await saveRiskSettings(env.DB, { revision: 8, profiles: initialRiskSettings().profiles })).toBeNull();
    expect((await getRiskSettings(env.DB)).revision).toBe(0);
  });
  it('rejects invalid, partial and contradictory risk limits', () => {
    const profiles = initialRiskSettings().profiles;
    for (const value of [null, { revision: 0, profiles: {} }, { revision: -1, profiles },
      { revision: 0, profiles: { ...profiles, balanced: { maxPositionBps: 1500.5, riskPerTradeBps: 100 } } },
      { revision: 0, profiles: { ...profiles, balanced: { maxPositionBps: 100, riskPerTradeBps: 200 } } },
      { revision: 0, profiles: { ...profiles, conservative: { maxPositionBps: 3000, riskPerTradeBps: 100 } } },
    ]) expect(() => parseRiskSettings(value)).toThrow();
  });
  it('returns conflict status to stale clients and leaves the saved policy intact', async () => {
    const input = { revision: 0, profiles: initialRiskSettings().profiles };
    expect((await request('/settings/risk', input)).status).toBe(200);
    expect((await request('/settings/risk', input)).status).toBe(409);
    expect((await (await request('/settings/risk')).json() as any).revision).toBe(1);
  });
  it('records immutable limits with the analysis and never changes historical policy', async () => {
    const response = await request('/analysis/jobs', { symbol: 'AAPL', horizon: 'long', risk: 'balanced', settingsRevision: 0 });
    const job = await response.json() as any;
    expect(job.riskLimits).toEqual({ maxPositionBps: 1500, riskPerTradeBps: 100 });
    const input = initialRiskSettings(); input.profiles.balanced.maxPositionBps = 2000;
    await saveRiskSettings(env.DB, { revision: 0, profiles: input.profiles });
    const claim = await (await request('/bridge/claim', {}, true)).json() as any;
    expect(claim.snapshot.settingsRevision).toBe(0);
    expect(claim.snapshot.riskLimits.maxPositionBps).toBe(1500);
    const stored = await (await request(`/analysis/jobs/${job.id}`)).json() as any;
    expect(stored.riskLimits.maxPositionBps).toBe(1500); expect(stored.settingsRevision).toBe(0);
    expect(stored).not.toHaveProperty('snapshot'); expect(stored).not.toHaveProperty('claim_token');
  });
  it('does not fetch quotes or queue analysis when the displayed policy is stale', async () => {
    await saveRiskSettings(env.DB, { revision: 0, profiles: initialRiskSettings().profiles });
    const response = await request('/analysis/jobs', { symbol: 'AAPL', horizon: 'swing', risk: 'balanced', settingsRevision: 0 });
    expect(response.status).toBe(409); expect(fetch).not.toHaveBeenCalled();
    expect(await (await request('/analysis/jobs')).json()).toEqual([]);
  });
});

async function seedHistory(count: number) {
  const rows = [];
  for (let index = 0; index < count; index++) {
    const id = `${index.toString(16).padStart(8,'0')}-0000-4000-8000-000000000000`;
    const result = { verdict:'hold', summary:`Historical report ${index}`, reasons:[], risks:[], entryPrice:null,targetPrice:null,stopLoss:null,details:'',sources:[],missingData:[] };
    await env.DB.prepare(`INSERT INTO analysis_jobs(id,symbol,horizon,risk,status,snapshot,result,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?)`).bind(id,index%2?'MSFT':'AAPL',index%2?'short':'long','balanced','completed','{}',JSON.stringify(result),'2026-11-01T00:00:00.000Z','2026-11-01T00:00:00.000Z').run();
    rows.push({id,summary:result.summary});
  }
  return rows;
}
describe('exact historical reports and queue cancellation', () => {
  it('captures daily evidence for a new one-month report and protects it after completion', async()=>{
    const now=Math.floor(Date.now()/1000);
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json({chart:{result:[{meta:{currency:'USD',instrumentType:'EQUITY',regularMarketPrice:100,regularMarketTime:now,previousClose:99},timestamp:Array.from({length:252},(_,i)=>now-(251-i)*86400),indicators:{quote:[{open:Array(252).fill(100),high:Array(252).fill(102),low:Array(252).fill(98),close:Array(252).fill(100),volume:Array(252).fill(1000)}]}}]}})));
    const response=await request('/analysis/jobs',{symbol:'AAPL',horizon:'month',risk:'balanced'});expect(response.status).toBe(201);
    const job=await response.json() as any;expect(job.researchSnapshot.chart.range).toBe('1Y');expect(job.researchSnapshot.chart.bars).toHaveLength(252);expect(job.researchSnapshot.indicators.ma200).toBe(100);
    const start=Date.parse(job.researchSnapshot.window.start),end=Date.parse(job.researchSnapshot.window.end);expect(end-start).toBe(30*86400000);
    const claim=await (await request('/bridge/claim',{},true)).json() as any;
    const report=researchReport();report.verdict='buy';report.research!.rating='moderate-buy';report.sources=[{title:'Test company filing',url:'https://example.com/filing',asOf:new Date().toISOString().slice(0,10)}];
    report.research!.evidence[0]={kind:'financials',status:'available',asOf:new Date().toISOString().slice(0,10),summary:'Test filing only',sourceIndices:[0],metrics:[{label:'Test revenue',value:100,unit:'USD',period:'Test quarter only',sourceIndices:[0]}]};
    expect((await request('/bridge/result',{id:job.id,claimToken:claim.claimToken,report},true)).status).toBe(200);
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:503})));
    const stored=await (await request('/analysis/jobs/'+job.id)).json() as any;
    expect(stored.result.research.rating).toBe('moderate-buy');expect(stored.researchSnapshot.chart.bars).toEqual(job.researchSnapshot.chart.bars);expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects a substantive rating without enough actual candles',async()=>{
    const job=await (await request('/analysis/jobs',{symbol:'AAPL',horizon:'month',risk:'balanced'})).json() as any;
    const claim=await (await request('/bridge/claim',{},true)).json() as any;
    const report=researchReport();report.verdict='hold';report.research!.rating='hold';
    const response=await request('/bridge/result',{id:job.id,claimToken:claim.claimToken,report},true);
    expect(response.status).toBe(400);expect((await response.json() as any).error).toContain('日 K 線');
    expect((await request('/bridge/result',{id:job.id,claimToken:claim.claimToken,report:researchReport()},true)).status).toBe(200);
  });
  it('still accepts a legacy result for a genuinely old queued job',async()=>{
    const id='dddddddd-0000-4000-8000-000000000000',stamp=new Date().toISOString();
    await env.DB.prepare('INSERT INTO analysis_jobs(id,symbol,horizon,risk,snapshot,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(id,'AAPL','swing','balanced','{}',stamp,stamp).run();
    const claim=await (await request('/bridge/claim',{},true)).json() as any;
    const report=researchReport();delete report.research;
    expect((await request('/bridge/result',{id,claimToken:claim.claimToken,report},true)).status).toBe(200);
  });
  it('paginates beyond 30 reports without losing tied timestamps', async () => {
    const rows = await seedHistory(35), collected: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await (await request('/analysis/history?limit=7' + (cursor ? '&before='+encodeURIComponent(cursor) : ''))).json() as any;
      collected.push(...page.items.map((job:any) => job.id)); cursor = page.nextCursor;
    } while (cursor);
    expect(collected).toHaveLength(35); expect(new Set(collected).size).toBe(35);
    const older = await (await request(`/analysis/jobs/${rows[0].id}`)).json() as any;
    expect(older.result.summary).toBe(rows[0].summary); expect(older.riskLimits).toBeNull();
  });
  it('filters by stock and horizon and rejects invalid cursors', async () => {
    await seedHistory(5);
    const page = await (await request('/analysis/history?symbol=AAPL&horizon=long')).json() as any;
    expect(page.items).toHaveLength(3); expect(page.items.every((job:any) => job.symbol==='AAPL' && job.horizon==='long')).toBe(true);
    for (const query of ['limit=51','before=bad-json','horizon=unknown','symbol=TQQQ'])
      expect((await request('/analysis/history?'+query)).status).toBe(400);
    expect((await request('/analysis/jobs/ffffffff-ffff-4fff-8fff-ffffffffffff')).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('cancels only queued work idempotently and makes it impossible to claim', async () => {
    const job = await (await request('/analysis/jobs',{symbol:'AAPL',horizon:'swing',risk:'balanced'})).json() as any;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(`/analysis/jobs/${job.id}/cancel`,{});
      expect(response.status).toBe(200);
      const cancelled = await response.json() as any;
      expect(cancelled.cancelledAt).toBeTruthy(); expect(cancelled.status).toBe('failed');
    }
    expect(await (await request('/bridge/claim',{},true)).json()).toBeNull();
    expect((await request('/analysis/jobs',{symbol:'MSFT',horizon:'short',risk:'conservative'})).status).toBe(201);
  });
  it('refuses cancellation after the Mac has claimed work', async () => {
    const job = await (await request('/analysis/jobs',{symbol:'AAPL',horizon:'swing',risk:'balanced'})).json() as any;
    await request('/bridge/claim',{},true);
    expect((await request(`/analysis/jobs/${job.id}/cancel`,{})).status).toBe(409);
    const stored = await (await request(`/analysis/jobs/${job.id}`)).json() as any;
    expect(stored.status).toBe('running'); expect(stored.cancelledAt).toBeNull();
  });
  it('has only one winner when claim and cancellation race', async () => {
    const job = await (await request('/analysis/jobs',{symbol:'AAPL',horizon:'swing',risk:'balanced'})).json() as any;
    const [cancelled, claimed] = await Promise.all([request(`/analysis/jobs/${job.id}/cancel`,{}), request('/bridge/claim',{},true)]);
    const claim = await claimed.json() as any;
    expect((cancelled.status===200 && claim===null) || (cancelled.status===409 && claim?.id===job.id)).toBe(true);
  });
});

describe('database readiness and upgrade', () => {
  it('checks the actual database schema instead of only the binding', async () => {
    expect((await (await request('/health')).json() as any).schemaVersion).toBe(2);
    env.DB = { prepare() { throw new Error('missing migration'); } };
    const failed = await request('/health'); expect(failed.status).toBe(503);
    expect((await failed.json() as any).storage).toBe(false);
  });
  it('preserves existing money and historical jobs when upgrading the schema', () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec(readFileSync(new URL('../migrations/0001_initial.sql',import.meta.url),'utf8'));
      db.exec(`INSERT INTO ledger(request_id,kind,cash_delta_cents,created_at) VALUES('migration-test','deposit',100000,'2026-11-01');
        INSERT INTO analysis_jobs(id,symbol,horizon,risk,status,snapshot,created_at,updated_at) VALUES('old-job','AAPL','long','balanced','completed','{}','2026-11-01','2026-11-01');`);
      db.exec(readFileSync(new URL('../migrations/0002_research_workflow.sql',import.meta.url),'utf8'));
      expect(db.prepare('SELECT cash_delta_cents FROM ledger').get()?.cash_delta_cents).toBe(100000);
      expect(db.prepare('SELECT id,cancelled_at FROM analysis_jobs').get()).toMatchObject({id:'old-job',cancelled_at:null});
    } finally { db.close(); }
  });
});
