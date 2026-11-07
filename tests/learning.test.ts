import { describe, expect, it } from 'vitest';
import { aggregateCandles, historyRange } from '../shared/chart-periods';
import { reportPriceLevels } from '../shared/price-levels';
import { learningTask } from '../shared/learning-task';
import { researchReport } from './support/research';
import type { Bar } from '../shared/types';

const bar=(day:string,index:number):Bar=>({time:Date.parse(day+'T14:30:00Z')/1000,open:100+index,high:105+index,low:95+index,close:102+index,volume:1000+index});
describe('candle duration, distinct from the history window',()=>{
  const days=['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-11-02','2026-11-03'];
  const bars=days.map(bar);
  it('keeps daily bars and aggregates five actual sessions without inserting weekends',()=>{
    expect(aggregateCandles(bars,'D')).toBe(bars);
    expect(aggregateCandles(bars,'5D')).toEqual([
      {...bars[0],high:109,low:95,close:106,volume:5010},
      {...bars[5],high:111,low:100,close:108,volume:2011},
    ]);
    expect(aggregateCandles([],'5D')).toEqual([]);
    expect(historyRange('D')).toBe('1Y');expect(historyRange('5D')).toBe('1Y');
  });
  it('groups calendar months and Monday weeks, keeping the incomplete final group',()=>{
    expect(aggregateCandles(bars,'W')).toEqual(aggregateCandles(bars,'5D'));
    expect(aggregateCandles(bars,'M')).toEqual(aggregateCandles(bars,'5D'));
    const boundary=['2026-12-31','2027-01-04'].map(bar);
    expect(aggregateCandles(boundary,'M')).toHaveLength(2);
    const holiday=['2026-11-23','2026-11-24','2026-11-25','2026-11-27','2026-11-30'].map(bar);
    expect(aggregateCandles(holiday,'W')).toHaveLength(2);
    expect(aggregateCandles(holiday,'5D')).toHaveLength(1);
  });
  it('retains missing volume instead of representing a partial sum as a full total',()=>{
    const input=bars.map((item,index)=>({...item,volumeMissing:index===2}));
    expect(aggregateCandles(input,'M')[0].volumeMissing).toBe(true);
    expect(input[0].high).toBe(105);
  });
});
describe('teaching references do not invent analysis',()=>{
  it('draws only explicit valid prices and never repurposes an old target as take profit',()=>{
    const report=researchReport();report.targetPrice=150;delete report.takeProfitPrice;delete report.sellPrice;
    expect(reportPriceLevels(report)).toEqual([]);
    Object.assign(report,{entryPrice:100,sellPrice:130,stopLoss:90,takeProfitPrice:120});
    const levels=reportPriceLevels(report);
    expect(levels.map(item=>item.key)).toEqual(['entryPrice','sellPrice','stopLoss','takeProfitPrice']);
    expect(new Set(levels.map(item=>item.token)).size).toBe(4);
    report.entryPrice=NaN;expect(reportPriceLevels(report)).toHaveLength(3);
  });
  it('creates a dated manual task with explicit evidence and no personal allocation',()=>{
    const task=learningTask('AAPL','month','balanced',new Date('2026-11-06T20:00:00Z'));
    expect(task).toContain('2026-11-07');expect(task).toContain('未來30個曆日');
    expect(task).toContain('不使用個人本金、持倉或資產配置');
    expect(task).toContain('可點擊的原始來源註腳');expect(task).toContain('不啟用額外付費模型');
  });
});
