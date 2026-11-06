import { describe,it,expect } from 'vitest';
import { parseYahoo } from '../worker/market';
import { rsi,sma } from '../shared/indicators';

const time=1_800_000_000;
function payload(){return {chart:{result:[{meta:{currency:'USD',instrumentType:'EQUITY',regularMarketPrice:101,regularMarketTime:time-100,previousClose:100,shortName:'Example',currentTradingPeriod:{post:{start:time-50,end:time+1000}}},timestamp:[time-100,time],indicators:{quote:[{open:[100,101],high:[102,103],low:[99,100],close:[101,102],volume:[20,30]}]}}]}}}
describe('Yahoo source semantics',()=>{
  it('uses available postmarket bars and preserves their time',()=>{
    const q=parseYahoo('AAPL','1D',payload(),time*1000);
    expect(q.price).toBe(102);expect(q.timestamp).toBe(time);expect(q.session).toBe('post');expect(q.changePercent).toBeCloseTo(2);
  });
  it('does not present the beginning of a long chart as yesterday close',()=>{
    const data=payload();delete (data.chart.result[0].meta as any).previousClose;(data.chart.result[0].meta as any).chartPreviousClose=40;
    expect(parseYahoo('AAPL','1Y',data,time*1000).changePercent).toBeNull();
  });
  it('rejects missing prices instead of filling synthetic values',()=>{
    expect(()=>parseYahoo('AAPL','1D',{chart:{result:null}})).toThrow();
    const data=payload();(data.chart.result[0].meta as any).currency='HKD';expect(()=>parseYahoo('AAPL','1D',data)).toThrow();
  });
  it('omits incomplete candles',()=>{
    const data=payload();(data.chart.result[0].indicators.quote[0].close as any)[0]=null;
    expect(parseYahoo('AAPL','1D',data,time*1000).bars).toHaveLength(1);
  });
  it('marks missing volume rather than presenting it as an observed zero',()=>{
    const data=payload();(data.chart.result[0].indicators.quote[0].volume as any)[0]=null;
    const quote=parseYahoo('AAPL','1D',data,time*1000);
    expect(quote.bars[0].volumeMissing).toBe(true);expect(quote.bars[1].volumeMissing).toBeUndefined();
  });
});
describe('technical indicators',()=>{
  it('requires warmup data and uses Wilder smoothing for RSI',()=>{
    expect(rsi([1,2,3])).toBeNull();expect(rsi(Array(20).fill(1))).toBe(50);
    expect(rsi(Array.from({length:20},(_,i)=>i+1))).toBe(100);
    expect(sma([1,2,3,4],3)).toEqual([null,null,2,3]);
  });
});
