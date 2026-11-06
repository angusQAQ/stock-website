import { useState } from 'react';
import { ArrowUpRight, ChevronDown, CircleAlert, Cpu, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import type { AnalysisJob, Horizon, Portfolio, Quote, Risk } from '../shared/types';
import { positionSizing, RISK_PROFILES } from '../shared/portfolio';
import { API_AVAILABLE } from './api';

const verdicts = { buy:'考慮買入', hold:'持有觀察', reduce:'考慮減倉', avoid:'暫不買入', 'insufficient-data':'資料不足' };
const money = (n:number) => n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
export default function AnalysisPanel({ symbol, horizon, risk, setHorizon, setRisk, online, enabled, job, analyze, busy, error, portfolio, quotes }:
  {symbol:string; horizon:Horizon; risk:Risk; setHorizon:(h:Horizon)=>void; setRisk:(r:Risk)=>void;
   online:boolean; enabled:boolean; job:AnalysisJob|undefined; analyze:()=>void; busy:boolean; error:string;
   portfolio:Portfolio|null; quotes:Record<string,Quote>}) {
  const [fee, setFee] = useState('');
  const report = job?.status === 'completed' ? job.result : null;
  let sizing: ReturnType<typeof positionSizing>|null = null;
  let sizingError = '';
  if (report?.verdict === 'buy' && report.entryPrice && report.stopLoss && portfolio && fee !== '') {
    try {
      if (!portfolio.positions.every(p => !!quotes[p.symbol])) throw new Error('部分持倉尚未取得行情，暫不能計算總資產。');
      const equity = portfolio.cashCents/100 + portfolio.positions.reduce((sum,p)=>sum+p.quantity*quotes[p.symbol].price,0);
      sizing = positionSizing({ cash:portfolio.cashCents/100,equity,
        existingValue:(portfolio.positions.find(p=>p.symbol===symbol)?.quantity??0)*(quotes[symbol]?.price??0),
        entry:report.entryPrice,stopLoss:report.stopLoss,fees:Number(fee),risk });
    } catch (e) { sizingError=(e as Error).message; }
  }
  return <section className="panel analysis-panel">
    <div className="panel-heading"><h2><Sparkles size={17}/> 投資分析</h2><span className="badge research-badge">CODEX RESEARCH</span></div>
    <div className="analysis-controls"><div><span className="field-label">投資期間</span><div className="segmented">{([['short','短線'],['swing','波段'],['long','長期']] as const).map(([id,label])=><button key={id} className={horizon===id?'active':''} aria-pressed={horizon===id} onClick={()=>setHorizon(id)}>{label}</button>)}</div></div>
      <label className="risk-select"><ShieldCheck size={14}/><select aria-label="風險設定" value={risk} onChange={e=>setRisk(e.target.value as Risk)}>{Object.entries(RISK_PROFILES).map(([id,p])=><option value={id} key={id}>{p.label}配置</option>)}</select></label>
      <button className="button primary" onClick={analyze} disabled={!API_AVAILABLE || busy || job?.status==='queued' || job?.status==='running'}><Sparkles size={15}/>{busy?'提交中…':job?.status==='queued'?'等待 Mac 接收':job?.status==='running'?'Codex 分析中…':`分析 ${symbol}`}</button>
    </div>
    <div className="bridge-status"><span className={`status-dot ${online?'online':''}`}/><span>{online?'Mac 分析端已連線':enabled?'Mac 分析端離線，工作將等待接收':'Mac 分析端尚未連接'}</span><span>僅按下分析時執行</span></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {job?.status==='failed' && <div className="notice error">{job.error}</div>}
    {report ? <div className="report">
      <div className="report-lead"><span className={`verdict ${report.verdict}`}>{verdicts[report.verdict]}</span><span className="muted">{new Date(job!.updatedAt).toLocaleString('zh-HK')}</span></div>
      <h3>{report.summary}</h3><div className="report-columns"><div><h4>支持理由</h4>{report.reasons.map((r,i)=><p key={i}><ArrowUpRight size={14} className="up"/>{r}</p>)}</div><div><h4>主要風險</h4>{report.risks.map((r,i)=><p key={i}><CircleAlert size={14} className="amber"/>{r}</p>)}</div></div>
      <div className="price-plan">{[['參考買入',report.entryPrice],['參考目標',report.targetPrice],['止損條件',report.stopLoss]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{typeof value==='number'?money(value):'未提供'}</strong></div>)}</div>
      {report.verdict==='buy' && <div className="sizing-box"><h4>按你的美元資產計算倉位</h4><label>預計總交易費用（USD）<input value={fee} onChange={e=>setFee(e.target.value)} inputMode="decimal" placeholder="填寫已核對的費用後計算"/></label>
        {sizing ? <p>最多參考投入 <strong>{money(sizing.amount)}</strong>（{sizing.shares} 股），配置後占比 <strong>{sizing.positionPercent.toFixed(1)}%</strong>；按止損價估算損失 {money(sizing.riskAmount)}，已含所填費用。</p> : <p className="muted">{sizingError || '需要完整持倉估值、有效止損價及費用，才會顯示投入金額。'}</p>}
        <small>預設上限：單股 {RISK_PROFILES[risk].maxPosition*100}%／每筆風險 {RISK_PROFILES[risk].riskPerTrade*100}%。跳空與滑價可能超出估算。</small></div>}
      {!!report.missingData.length && <div className="notice">資料缺漏：{report.missingData.join('；')}</div>}
      <details><summary>展開完整分析與資料來源 <ChevronDown size={15}/></summary><p className="report-details">{report.details}</p><div className="source-list">{report.sources.map((s,i)=><a href={s.url} target="_blank" rel="noreferrer" key={i}>{s.title}<span>{s.asOf}</span><ExternalLink size={12}/></a>)}</div></details>
    </div> : <div className="analysis-empty"><div className="ai-mark"><Cpu size={25}/></div><div><h3>{job?.status==='running'?'正在整理證據與配置建議':job?.status==='queued'?'已排隊，等待你的 Mac 執行':'從數據出發，形成自己的判斷'}</h3><p>選擇投資期間，讓分析結合行情、持倉與風險設定。<br/>報告會先呈現結論、理由和風險，再展開研究依據。</p></div><ArrowUpRight size={21}/></div>}
  </section>;
}
