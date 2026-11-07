import { afterEach, describe, expect, it, vi } from 'vitest';
import { macdSeries, technicals } from '../shared/indicators';
import { modelReportSchema, reportSchema, validateResearchReport } from '../shared/report-schema';
import { captureResearch } from '../worker/research';
import { researchReport } from './support/research';
import { readFileSync } from 'node:fs';
import { z } from 'zod';

afterEach(()=>vi.unstubAllGlobals());
describe('deterministic daily technical evidence',()=>{
  const bars=Array.from({length:252},(_,i)=>({time:1700000000+i*86400,open:100+i/2,high:101+i/2,low:99+i/2,close:100+i/2,volume:1000}));
  it('calculates reference indicators with their actual warmups and units',()=>{
    const t=technicals(bars);
    expect(t.ma20).toBeCloseTo(220.75);expect(t.ma50).toBeCloseTo(213.25);expect(t.ma200).toBeCloseTo(175.75);
    expect(t.rsi14).toBe(100);expect(t.macd).toBeCloseTo(3.5);expect(t.macdSignal).toBeCloseTo(3.5);expect(t.macdHistogram).toBeCloseTo(0);
    expect(t.atr14).toBe(2);expect(t.bollingerUpper).toBeCloseTo(220.75+2*Math.sqrt(8.3125));expect(t.bollingerLower).toBeCloseTo(220.75-2*Math.sqrt(8.3125));
    expect(t.support20).toBe(215);expect(t.resistance20).toBe(226.5);expect(t.relativeVolume20).toBe(1);expect(t.cmf20).toBe(0);expect(t.obv).toBe(251000);
  });
  it('does not turn insufficient samples or unknown volume into a bullish signal',()=>{
    const t=technicals(bars.slice(0,5));expect(t.ma20).toBeNull();expect(t.atr14).toBeNull();expect(t.macd).toBeNull();expect(t.cmf20).toBeNull();
    expect(macdSeries(bars.slice(0,33).map(b=>b.close)).at(-1)?.signal).toBeNull();
    const flat=technicals(bars.map(b=>({...b,volume:0})));expect(flat.relativeVolume20).toBeNull();expect(flat.cmf20).toBeNull();
    const missing=technicals(bars.map((b,i)=>({...b,volumeMissing:i===250})));expect(missing.obv).toBeNull();expect(missing.cmf20).toBeNull();expect(missing.relativeVolume20).toBeNull();
  });
  it('keeps a precise 30-day window and an explicit history failure',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:503})));
    const snapshot=await captureResearch('AAPL','month',new Date('2026-11-06T12:00:00Z'));
    expect(snapshot.window).toEqual({start:'2026-11-06',end:'2026-12-06'});expect(snapshot.chart).toBeNull();expect(snapshot.indicators).toBeNull();expect(snapshot.missingData[0]).toContain('不可用');
  });
});
describe('structured research quality gates',()=>{
  const now=new Date('2026-11-06T12:00:00Z');
  it('keeps the Mac output schema aligned with the Worker validator',()=>{
    const schema=JSON.parse(readFileSync(new URL('../config/analysis-report.schema.json',import.meta.url),'utf8'));
    expect(schema).toEqual(z.toJSONSchema(modelReportSchema,{target:'draft-7'}));
  });
  it('accepts complete explicit data gaps without inventing a rating',()=>{
    const report=reportSchema.parse(researchReport());expect(validateResearchReport(report,now)).toBeNull();
  });
  it('rejects source indices without a matching source',()=>{
    const report=researchReport();report.research!.newsImpact=[{date:'2026-11-05',title:'測試事件',impact:'影響尚未核實',sourceIndices:[0]}];
    expect(validateResearchReport(report,now)).toContain('不存在');
  });
  it('rejects future events and unreferenced available facts',()=>{
    const report=researchReport();report.sources=[{title:'測試來源',url:'https://example.com/filing',asOf:'2026-11-06'}];
    report.research!.newsImpact=[{date:'2026-11-07',title:'尚未發生的事件',impact:'不可列為新聞',sourceIndices:[0]}];
    expect(validateResearchReport(report,now)).toContain('未來日期');
    report.research!.newsImpact=[];report.research!.evidence[0].status='available';
    expect(validateResearchReport(report,now)).toContain('資料日期及來源');
  });
  it('rejects duplicate categories, incompatible ratings and made-up missing values',()=>{
    let report=researchReport();report.research!.evidence[4].kind='financials';expect(validateResearchReport(report,now)).toContain('分類');
    report=researchReport();report.research!.rating='strong-buy';expect(validateResearchReport(report,now)).toContain('不一致');
    report=researchReport();report.research!.evidence[0].metrics=[{label:'Revenue',value:0,unit:'USD',period:'Q3',sourceIndices:[0]}];report.sources=[{title:'Test',url:'https://example.com',asOf:'2026-11-06'}];
    expect(validateResearchReport(report,now)).toContain('不可附上');
  });
  it('requires null prices and listed gaps when withholding a rating',()=>{
    const report=researchReport();report.entryPrice=100;expect(validateResearchReport(report,now)).toContain('價格為空');
    report.entryPrice=null;report.research!.scenarios[0].targetPrice=120;expect(validateResearchReport(report,now)).toContain('價格為空');
  });
  it('continues to parse genuine legacy results without retrofitting new claims',()=>{
    const report=researchReport();delete report.research;expect(reportSchema.parse(report).research).toBeUndefined();expect(validateResearchReport(report,now)).toBeNull();
  });
  it('requires source references for each displayed price and matching paragraph counts',()=>{
    const report=researchReport();report.verdict='hold';report.research!.rating='hold';
    report.sources=[{title:'Fixture',url:'https://example.com/filing',asOf:'2026-11-06'}];
    const refs=report.research!.references!;refs.summary=refs.plainLanguage=refs.outlook=refs.technicalSummary=[0];refs.risks=[[0]];refs.details=[[0]];refs.scenarios=[[0],[0],[0]];
    report.sellPrice=120;expect(validateResearchReport(report,now)).toContain('價位');
    refs.sellPrice=[0];expect(validateResearchReport(report,now)).toBeNull();
    refs.details=[];expect(validateResearchReport(report,now)).toContain('段落數目');
    refs.details=[[1]];expect(validateResearchReport(report,now)).toContain('不存在');
  });
});
