import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UNIVERSE } from '../shared/types';
import { publicChartLink, publicChartOptions, publicSymbol } from '../src/public-market';

afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers()});
describe('public market connection',()=>{
  it('resolves every supported stock and ETF with its exchange and special symbol',()=>{
    for(const stock of UNIVERSE)expect(publicSymbol(stock.symbol)).toMatch(/^(NASDAQ|NYSE|AMEX):/);
    expect(publicSymbol('BRK-B')).toBe('NYSE:BRK.B');expect(publicSymbol('SPY')).toBe('AMEX:SPY');expect(publicSymbol('BND')).toBe('NASDAQ:BND');
    expect(()=>publicSymbol('UNMAPPED')).toThrow('尚未設定');
    expect(publicChartLink('BRK-B')).toBe('https://www.tradingview.com/chart/?symbol=NYSE%3ABRK.B');
  });
  it('maps each Northstar period to a supported public chart period',()=>{
    for(const [range,expected] of Object.entries({'1D':'1D','5D':'5D','1M':'1M','3M':'3M','1Y':'12M','5Y':'60M',MAX:'ALL'})){
      const options=publicChartOptions('AAPL',range,'chart-id');expect(options.range).toBe(expected);expect(options.style).toBe('1');expect(options.timezone).toBe('Asia/Hong_Kong');
    }
    expect(()=>publicChartOptions('AAPL','INVALID','chart-id')).toThrow();
  });
});

describe('official script loading',()=>{
  let scripts:any[];
  beforeEach(()=>{
    vi.resetModules();vi.useFakeTimers();scripts=[];
    vi.stubGlobal('window',{});
    vi.stubGlobal('document',{createElement:()=>({remove:vi.fn()}),head:{appendChild:(script:unknown)=>scripts.push(script)}});
  });
  it('shares a single load across mounts and reuses a loaded API',async()=>{
    const {loadPublicChart}=await import('../src/public-market');
    const first=loadPublicChart(),second=loadPublicChart();expect(first).toBe(second);expect(scripts).toHaveLength(1);
    const api={widget:vi.fn()};window.TradingView=api as any;scripts[0].onload();
    expect(await first).toBe(api);expect(await loadPublicChart()).toBe(api);expect(scripts).toHaveLength(1);
  });
  it('retries after a denied script instead of caching a rejected promise',async()=>{
    const {loadPublicChart}=await import('../src/public-market');
    const failed=loadPublicChart().catch(error=>error);scripts[0].onerror();expect(await failed).toBeInstanceOf(Error);expect(scripts[0].remove).toHaveBeenCalled();
    const retry=loadPublicChart().catch(error=>error);expect(scripts).toHaveLength(2);scripts[1].onerror();await retry;
  });
  it('bounds a stalled load and lets a subsequent attempt recover',async()=>{
    const {loadPublicChart}=await import('../src/public-market');
    const failed=loadPublicChart().catch(error=>error);await vi.advanceTimersByTimeAsync(20_000);expect(await failed).toBeInstanceOf(Error);
    const retry=loadPublicChart();window.TradingView={widget:vi.fn()} as any;scripts[1].onload();await expect(retry).resolves.toBe(window.TradingView);
  });
});
