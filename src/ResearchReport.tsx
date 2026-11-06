import { useState } from 'react';
import { ArrowUpRight, ChevronDown, CircleAlert, ExternalLink } from 'lucide-react';
import type { AnalysisJob, Portfolio, Quote } from '../shared/types';
import { fixed, positionSizing } from '../shared/portfolio';
import { percent, RISK_NAMES } from '../shared/risk';
import { RATINGS } from '../shared/types';
import ResearchEvidence from './ResearchEvidence';

const verdicts = { buy:'考慮買入', hold:'持有觀察', reduce:'考慮減倉', avoid:'暫不買入', 'insufficient-data':'資料不足' };
const money = (value:number) => value.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const date = (value:string) => new Date(value).toLocaleString('zh-HK');

export default function ResearchReport({ job, portfolio, quotes, historical=false }:
  { job:AnalysisJob; portfolio:Portfolio|null; quotes:Record<string,Quote>; historical?:boolean }) {
  const [fee,setFee] = useState('');
  const report = job.result;
  if (!report) return null;
  let sizing: ReturnType<typeof positionSizing>|null = null, sizingError = '';
  if (!historical && report.verdict==='buy' && job.riskLimits && portfolio && fee!=='') {
    try {
      if (!portfolio.positions.every(position => {
        const quote=quotes[position.symbol];
        return quote && Number.isFinite(Date.parse(quote.fetchedAt)) && Date.now()-Date.parse(quote.fetchedAt)<90_000;
      })) throw new Error('部分持倉未取得近期來源資料，請更新行情後再計算。');
      const equity=portfolio.cashCents/100+portfolio.positions.reduce((sum,p)=>sum+p.quantity*quotes[p.symbol].price,0);
      sizing=positionSizing({cash:portfolio.cashCents/100,equity,
        existingValue:(portfolio.positions.find(p=>p.symbol===job.symbol)?.quantity??0)*(quotes[job.symbol]?.price??0),
        entry:report.entryPrice??NaN,stopLoss:report.stopLoss??NaN,fees:fixed(fee,2)/100,risk:job.risk,limits:job.riskLimits});
    } catch(error) { sizingError=(error as Error).message; }
  }
  return <div className="report">
    <div className="report-lead"><strong>{job.symbol}</strong><span className={`verdict ${report.verdict}`}>{report.research?(report.research.rating?RATINGS[report.research.rating]:'資料不足，暫不評級'):verdicts[report.verdict]}</span><span className="muted">{date(job.updatedAt)}</span></div>
    <h3>{report.summary}</h3>
    <div className="report-context">
      <span>{RISK_NAMES[job.risk]}配置{job.settingsRevision!==null&&job.settingsRevision!==undefined?` · 設定版本 ${job.settingsRevision}`:''}</span>
      {job.capturedAt&&<span>分析基準 {date(job.capturedAt)}</span>}
      {job.quoteTimestamp&&<span>行情時間 {date(new Date(job.quoteTimestamp*1000).toISOString())}</span>}
      {job.riskLimits&&<span>單股上限 {percent(job.riskLimits.maxPositionBps)} · 每筆風險 {percent(job.riskLimits.riskPerTradeBps)}</span>}
      {!job.riskLimits&&<span>這份舊報告未保存具體風險限額。</span>}
    </div>
    <div className="report-columns">
      <div><h4>支持理由</h4>{report.reasons.length?report.reasons.map((reason,index)=><p key={index}><ArrowUpRight size={14} className="up"/>{reason}</p>):<p className="muted">這份報告未提供支持理由。</p>}</div>
      <div><h4>主要風險</h4>{report.risks.length?report.risks.map((reason,index)=><p key={index}><CircleAlert size={14} className="amber"/>{reason}</p>):<p className="muted">這份報告未提供風險說明。</p>}</div>
    </div>
    <div className="price-plan">{[['參考買入',report.entryPrice],['參考目標',report.targetPrice],['止損條件',report.stopLoss]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{typeof value==='number'?money(value):'未提供'}</strong></div>)}</div>
    <ResearchEvidence job={job}/>
    {historical?<p className="report-history-note">這是當時的報告，保留原有價格與風險設定。需要目前的投入建議，請回到個股頁重新分析。</p>:report.verdict==='buy'&&<div className="sizing-box">
      <h4>按這份報告與目前帳本估算倉位</h4>
      {job.riskLimits?<>
        <label>預計總交易費用（USD）<input value={fee} onChange={event=>setFee(event.target.value)} inputMode="decimal" placeholder="填寫已核對的費用後計算"/></label>
        {sizing&&sizing.shares>0?<p>最多參考投入 <strong>{money(sizing.amount)}</strong>（{sizing.shares} 股），連費用所需現金 <strong>{money(sizing.cashRequired)}</strong>，配置後占比 <strong>{sizing.positionPercent.toFixed(2)}%</strong>；按止損價估算損失 {money(sizing.riskAmount)}，已含所填費用。</p>:<p className="muted">{sizing?.shares===0?'目前現金、集中度或風險額度不足，暫不新增倉位。':sizingError||'需要完整持倉估值、有效止損價及費用，才會顯示投入金額。'}</p>}
        <small>使用本報告的風險設定與參考價格，費率仍需核對。跳空與滑價可能超出估算。</small>
      </>:<p className="muted">舊報告未保存風險限額，暫不計算投入金額。重新分析後可保留完整設定。</p>}
    </div>}
    {!!report.missingData.length&&<div className="notice">資料缺漏：{report.missingData.join('；')}</div>}
    <details><summary>展開完整分析與資料來源<ChevronDown size={15}/></summary><p className="report-details">{report.details||'這份報告沒有額外分析內容。'}</p><div className="source-list">{report.sources.map((source,index)=><a href={source.url} target="_blank" rel="noreferrer" key={index}>{source.title}<span>{source.asOf}</span><ExternalLink size={12}/></a>)}</div>{!report.sources.length&&<p className="report-history-note">這份報告未附資料來源。</p>}</details>
  </div>;
}
