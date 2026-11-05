import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import worker from '../worker/index';
import { sqliteD1 } from './support/sqlite';

let env:any;
const ctx={waitUntil:()=>{}} as any;
const token='test-only-bridge-credential';
async function request(path:string,body?:unknown,bridge=false,origin?:string){
  const headers:Record<string,string>={'Content-Type':'application/json'};
  if(bridge)headers.Authorization=`Bearer ${token}`;
  if(origin)headers.Origin=origin;
  return worker.fetch(new Request('https://site.example/api'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)}),env,ctx);
}
beforeEach(()=>{
  env={DB:sqliteD1(),BRIDGE_TOKEN:token,BRIDGE_ENABLED:'true'};
  const time=Math.floor(Date.now()/1000);
  vi.stubGlobal('fetch',vi.fn(async()=>Response.json({chart:{result:[{meta:{currency:'USD',instrumentType:'EQUITY',regularMarketPrice:100,regularMarketTime:time,previousClose:99},timestamp:[],indicators:{quote:[{}]}}]}})));
});
afterEach(()=>vi.unstubAllGlobals());

describe('cloud API and Mac analysis workflow',()=>{
  it('does not enqueue work when viewing status or history',async()=>{
    expect((await request('/analysis/status')).status).toBe(200);
    expect(await (await request('/analysis/jobs')).json()).toEqual([]);
  });
  it('requires configured bridge access before accepting model work',async()=>{
    env.BRIDGE_ENABLED='false';
    expect((await request('/analysis/jobs',{symbol:'AAPL',horizon:'swing',risk:'balanced'})).status).toBe(503);
  });
  it('protects claim and result endpoints with the separate machine credential',async()=>{
    expect((await request('/bridge/claim',{})).status).toBe(401);
    expect((await request('/bridge/result',{})).status).toBe(401);
  });
  it('enqueues, claims exactly once, and accepts only the valid lease result',async()=>{
    const response=await request('/analysis/jobs',{symbol:'AAPL',horizon:'swing',risk:'balanced'});
    expect(response.status).toBe(201);
    expect((await request('/analysis/jobs',{symbol:'MSFT',horizon:'long',risk:'balanced'})).status).toBe(409);
    const claim:any=await (await request('/bridge/claim',{},true)).json();
    expect(claim.snapshot.quote.symbol).toBe('AAPL');
    expect(await (await request('/bridge/claim',{},true)).json()).toBeNull();
    const report={verdict:'insufficient-data',summary:'缺少當期財報，暫不形成買入結論。',reasons:[],risks:['基本面未核實'],entryPrice:null,targetPrice:null,stopLoss:null,details:'測試輸出',sources:[],missingData:['當期財報']};
    expect((await request('/bridge/result',{id:claim.id,claimToken:'invalid-lease',report},true)).status).toBe(409);
    expect((await request('/bridge/result',{id:claim.id,claimToken:claim.claimToken,report},true)).status).toBe(200);
    const jobs:any=await (await request('/analysis/jobs')).json();
    expect(jobs[0].status).toBe('completed');expect(jobs[0].result.entryPrice).toBeNull();
    expect(jobs[0]).not.toHaveProperty('claim_token');
  });
  it('rejects malformed ledger requests with a useful client error',async()=>{
    expect((await request('/ledger',null)).status).toBe(400);
    const response=await request('/ledger',{requestId:'test-request-1',kind:'deposit',amount:100});
    expect(response.status).toBe(400);
  });
  it('rejects unrelated browser origins and supports only the configured frontend',async()=>{
    expect((await request('/portfolio',undefined,false,'https://unrelated.example')).status).toBe(403);
    env.APP_ORIGIN='https://frontend.example';
    const response=await request('/portfolio',undefined,false,env.APP_ORIGIN);
    expect(response.status).toBe(200);expect(response.headers.get('Access-Control-Allow-Origin')).toBe(env.APP_ORIGIN);
  });
});
