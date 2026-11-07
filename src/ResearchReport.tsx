import { ArrowUpRight, ChevronDown, CircleAlert } from 'lucide-react';
import type { AnalysisJob } from '../shared/types';
import { RATINGS } from '../shared/types';
import { RISK_NAMES } from '../shared/risk';
import { PRICE_LEVELS } from '../shared/price-levels';
import ResearchEvidence from './ResearchEvidence';
import Citations from './Citations';
import ResearchDrivers from './ResearchDrivers';
import InvestmentDecision from './InvestmentDecision';

const verdicts={buy:'考慮買入',hold:'持有觀察',reduce:'考慮減倉',avoid:'暫不買入','insufficient-data':'資料不足'};
const money=(value:number)=>value.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const date=(value:string)=>new Date(value).toLocaleString('zh-HK');
export default function ResearchReport({job,historical=false}:{job:AnalysisJob;historical?:boolean}){
  const report=job.result;if(!report)return null;
  const refs=report.research?.references;
  return <div className="report">
    <div className="report-lead"><strong>{job.symbol}</strong><span className={`verdict ${report.verdict}`}>{report.research?(report.research.rating?RATINGS[report.research.rating]:'資料不足，暫不評級'):verdicts[report.verdict]}</span><span className="muted">{date(job.updatedAt)}</span></div>
    <h3>{report.summary}<Citations indices={refs?.summary} report={report}/></h3>
    {report.research?.drivers&&report.research.decision&&<nav className="report-reading-nav" aria-label="這份股票分析的閱讀順序"><a href={`#report-drivers-${job.id}`}>因素影響圖</a><a href={`#report-price-${job.id}`}>K線與價位</a><a href={`#report-decision-${job.id}`}>綜合入場判斷</a></nav>}
    {report.research&&<section className="plain-language"><h4>用簡單的話說</h4><p>{report.research.plainLanguage}<Citations indices={refs?.plainLanguage} report={report}/></p></section>}
    <p className="report-learning-note">評級用來整理目前的證據。價位是研究推論，實際結果仍可能受新事件影響。</p>
    <ResearchDrivers report={report} id={`report-drivers-${job.id}`}/>
    <div className="report-columns"><div><h4>支持這個判斷的理由</h4>{report.reasons.length?report.reasons.map((reason,index)=><p key={index}><ArrowUpRight size={14} className="up"/><span>{reason}<Citations indices={refs?.reasons[index]} report={report}/></span></p>):<p className="muted">這份報告沒有足夠支持理由。</p>}</div>
      <div><h4>哪些事情可能推翻判斷</h4>{report.risks.length?report.risks.map((reason,index)=><p key={index}><CircleAlert size={14} className="amber"/><span>{reason}<Citations indices={refs?.risks[index]} report={report}/></span></p>):<p className="muted">這份報告未提供風險說明。</p>}</div></div>
    <h4 className="price-plan-heading">學習用參考價位</h4><div className="price-plan">{PRICE_LEVELS.map(level=><div key={level.key} className={`price-level ${level.key}`}><span>{level.label}</span><strong>{typeof report[level.key]==='number'?money(report[level.key]!):'未提供'}<Citations indices={refs?.[level.key]} report={report}/></strong></div>)}</div>
    <details className="price-help"><summary>四種價位分別用來想甚麼？<ChevronDown size={16} className="disclosure-icon" aria-hidden="true"/></summary><p>買入價是考慮進場的條件；賣出價是評估退出或減少曝險的條件。止損用來限制判斷失誤時願意承受的下跌，止盈用來規劃如何保留已有的上漲成果。用途不同，數值可能相同；都不是保證會到達或能成交的價格。</p></details>
    {report.takeProfitPrice===undefined&&report.targetPrice!==null&&<p className="report-learning-note">此舊報告原有的「參考目標」為 {money(report.targetPrice)}，沒有另行定義止盈價。</p>}
    <ResearchEvidence job={job}/>
    {!!report.missingData.length&&<div className="notice">還缺哪些資料：{report.missingData.join('；')}</div>}
    {historical&&<p className="report-history-note">這份報告保留產生當時的資料與價位。想了解新情況，請回市場頁重新分析。</p>}
    <details><summary>查看資料時間與完整推理<ChevronDown size={15}/></summary><div className="report-context"><span>{RISK_NAMES[job.risk]}研究</span>{job.capturedAt&&<span>研究基準 {date(job.capturedAt)}</span>}{job.quoteTimestamp&&<span>原始報價 {date(new Date(job.quoteTimestamp*1000).toISOString())}</span>}</div>
      {report.details.split(/\n\s*\n/).filter(text=>text.trim()).map((paragraph,index)=><p className="report-details" key={index}>{paragraph}<Citations indices={refs?.details[index]} report={report}/></p>)}
    </details>
    <InvestmentDecision job={job} id={`report-decision-${job.id}`}/>
    {report.research&&(!report.research.drivers||!report.research.decision)&&<p className="report-history-note">這份舊報告未保存四因素影響圖或入場條件；重新分析後可取得新版內容。</p>}
    <section className="report-footnotes"><h4>資料與新聞註腳</h4>{!refs&&<p className="report-learning-note">這份舊報告未保存逐段引用，以下保留原有來源，不推補各段註腳。</p>}
      {report.sources.length?<ol>{report.sources.map((source,index)=><li key={index}><a href={source.url} target="_blank" rel="noreferrer">[{index+1}] {source.title}</a><span>資料日期：{source.asOf}</span></li>)}</ol>:<p className="report-history-note">這份報告未附可核實的來源。</p>}
      {job.researchSnapshot?.chart&&<p className="chart-source-footnote"><a href={job.researchSnapshot.chart.sourceUrl??`https://finance.yahoo.com/quote/${encodeURIComponent(job.symbol)}/history/`} target="_blank" rel="noreferrer">[K線資料] {job.symbol} 原始價格與成交量；用於圖表及技術指標計算</a><span>擷取：{date(job.researchSnapshot.chart.fetchedAt)}</span></p>}
    </section>
  </div>;
}
