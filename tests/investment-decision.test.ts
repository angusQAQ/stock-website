import { describe, expect, it } from 'vitest';
import { reportSchema, validateResearchReport } from '../shared/report-schema';
import { researchReport } from './support/research';
const now=new Date('2026-11-07T12:00:00Z');
const mechanism={trigger:'本機測試事件',transmission:'成本可能增加。',companyEffect:'盈利可能受壓。',possiblePriceEffect:'市場可能調整估值。',counterpoint:'需求或售價也會改變結果。'};
function rated(){const report=researchReport();report.verdict='buy';report.research!.rating='moderate-buy';report.sources=[{title:'Fixture only',url:'https://example.com/test',asOf:'2026-11-06'}];
  const refs=report.research!.references!;refs.summary=refs.plainLanguage=refs.outlook=refs.technicalSummary=[0];refs.risks=[[0]];refs.details=[[0]];refs.scenarios=[[0],[0],[0]];
  const decision=report.research!.decision!;decision.action='wait';decision.sourceIndices=[0];return report;}
describe('factor diagrams and entry decisions',()=>{
  it('accepts explicit missing data without fictional directions or entry triggers',()=>{const report=reportSchema.parse(researchReport());expect(validateResearchReport(report,now)).toBeNull()});
  it('requires four different factors',()=>{const report=researchReport();report.research!.drivers![3].kind='earnings';expect(validateResearchReport(report,now)).toContain('四類影響因素')});
  it('requires date, sources and a mechanism for available factors',()=>{const report=researchReport(),driver=report.research!.drivers![0];driver.status='available';expect(validateResearchReport(report,now)).toContain('日期、來源與因果');
    report.sources=[{title:'Fixture',url:'https://example.com/test',asOf:'2026-11-06'}];Object.assign(driver,{asOf:'2026-11-06',sourceIndices:[0],mechanism});expect(validateResearchReport(report,now)).toBeNull();
    driver.asOf='2026-11-08';expect(validateResearchReport(report,now)).toContain('未來日期');});
  it('does not permit unsupported numeric data or directional claims for missing factors',()=>{const report=researchReport(),driver=report.research!.drivers![0];driver.direction='supportive';expect(validateResearchReport(report,now)).toContain('因素資料不足');
    driver.direction='uncertain';driver.mechanism=mechanism;expect(validateResearchReport(report,now)).toContain('因素資料不足');});
  it('checks source indices in factor metrics and entry triggers',()=>{let report=rated();report.research!.drivers![0].sourceIndices=[1];expect(validateResearchReport(report,now)).toContain('不存在');
    report=rated();report.research!.decision!.entryTriggers=[{condition:'收盤確認條件',status:'pending',confirmation:'再核對量能',invalidation:'跌回原區間',sourceIndices:[1]}];expect(validateResearchReport(report,now)).toContain('不存在');});
  it('requires observable waiting conditions and cited decisions',()=>{const report=rated();report.research!.decision!.waitFor=[];expect(validateResearchReport(report,now)).toContain('可觀察條件');
    report.research!.decision!.waitFor=['等到原始財報發布後核對盈利。'];report.research!.decision!.sourceIndices=[];expect(validateResearchReport(report,now)).toContain('入場判斷需要來源');});
  it('requires coherent prices and confirmation before considering entry now',()=>{const report=rated(),decision=report.research!.decision!;decision.action='consider-now';expect(validateResearchReport(report,now)).toContain('當下入手建議');
    report.entryPrice=100;report.stopLoss=90;report.research!.references!.entryPrice=[0];report.research!.references!.stopLoss=[0];decision.entryTriggers=[{condition:'價格及業績符合已引述條件。',status:'confirmed',confirmation:'重新核對日K收盤與發布值。',invalidation:'跌破止損研究參考。',sourceIndices:[0]}];expect(validateResearchReport(report,now)).toBeNull();decision.entryTriggers[0].status='pending';expect(validateResearchReport(report,now)).toContain('已確認條件');});
  it('does not allow entry triggers when timing data or the rating is insufficient',()=>{const report=researchReport();report.research!.decision!.action='consider-now';expect(validateResearchReport(report,now)).toContain('暫不評級');
    const other=rated();other.research!.decision!.action='insufficient-data';other.research!.decision!.entryTriggers=[{condition:'Test',status:'pending',confirmation:'Test',invalidation:'Test',sourceIndices:[0]}];expect(validateResearchReport(other,now)).toContain('入場資料不足');});
});
