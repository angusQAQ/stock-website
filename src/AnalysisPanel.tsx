import { useRef, useState } from 'react';
import { ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import type { AnalysisJob, Horizon, Portfolio, Quote, Risk, RiskSettings } from '../shared/types';
import { HORIZONS } from '../shared/types';
import { RISK_NAMES, RISK_ORDER, percent } from '../shared/risk';
import { API_AVAILABLE } from './api';
import ResearchReport from './ResearchReport';

export default function AnalysisPanel({symbol,horizon,risk,setHorizon,setRisk,online,enabled,job,pendingJob,analyze,busy,error,portfolio,quotes,settings,editSettings,cancel,cancellingId}:
  {symbol:string;horizon:Horizon;risk:Risk;setHorizon:(value:Horizon)=>void;setRisk:(value:Risk)=>void;online:boolean;enabled:boolean;
   job:AnalysisJob|undefined;pendingJob:AnalysisJob|undefined;analyze:()=>void;busy:boolean;error:string;portfolio:Portfolio|null;quotes:Record<string,Quote>;
   settings:RiskSettings|null;editSettings:()=>void;cancel:(id:string)=>Promise<AnalysisJob>;cancellingId:string|null}) {
  const [queueError,setQueueError]=useState('');
  const [queueMessage,setQueueMessage]=useState('');
  const riskSelect=useRef<HTMLSelectElement|null>(null);
  const limits=settings?.profiles[risk];
  async function cancelPending() {
    if(!pendingJob)return;setQueueError('');setQueueMessage('');
    try {await cancel(pendingJob.id);setQueueMessage(`已取消 ${pendingJob.symbol} 的排隊分析。`);riskSelect.current?.focus({preventScroll:true})}catch(error){setQueueError((error as Error).message)}
  }
  return <section className="panel analysis-panel">
    <div className="panel-heading"><h2><Sparkles size={17}/>投資分析</h2><span className="badge research-badge">CODEX RESEARCH</span></div>
    <div className="analysis-controls"><div><span className="field-label">投資期間 · 一個月為未來 30 天</span><div className="segmented">{(Object.entries(HORIZONS) as [Horizon,string][]).map(([key,label])=><button key={key} className={horizon===key?'active':''} aria-pressed={horizon===key} onClick={()=>setHorizon(key)}>{label}</button>)}</div></div>
      <label className="risk-select"><ShieldCheck size={14}/><select ref={riskSelect} aria-label="風險設定" value={risk} onChange={event=>setRisk(event.target.value as Risk)}>{RISK_ORDER.map(key=><option value={key} key={key}>{RISK_NAMES[key]}配置</option>)}</select></label>
      <button className="button primary" onClick={analyze} disabled={!API_AVAILABLE||!settings||!enabled||busy||!!pendingJob}><Sparkles size={15}/>{busy?'提交中…':pendingJob?pendingJob.id===job?.id?(pendingJob.status==='queued'?'等待 Mac 接收':'Codex 分析中…'):'等待其他分析完成':`分析 ${symbol}`}</button>
    </div>
    <div className="analysis-limits"><span>{limits?`${settings!.revision===0?'初始建議':'已儲存設定'} · 單股 ${percent(limits.maxPositionBps)} / 每筆風險 ${percent(limits.riskPerTradeBps)}`:'取得雲端風險設定後可進行分析'}</span><button className="text-button" onClick={editSettings}>調整限額<ArrowUpRight size={13}/></button></div>
    <div className="bridge-status"><span className={`status-dot ${online?'online':''}`}/><span>{online?'Mac 分析端已連線':enabled?'Mac 分析端離線，工作將等待接收':'Mac 分析端尚未連接'}</span><span>僅按下分析時執行</span></div>
    {pendingJob&&<div className="queue-controls" role="status"><span>{pendingJob.symbol} · {pendingJob.status==='queued'?'等待 Mac 接收，尚未執行分析。':'Mac 正在執行分析。'}</span>{pendingJob.status==='queued'&&<button className="text-button" onClick={cancelPending} disabled={cancellingId===pendingJob.id}>{cancellingId===pendingJob.id?'正在取消…':'取消排隊'}</button>}</div>}
    {queueMessage&&<div className="notice" role="status">{queueMessage}</div>}
    {(error||queueError)&&<div className="notice error" role="alert">{error||queueError}</div>}
    {job?.status==='failed'&&<div className={`notice ${job.cancelledAt?'':'error'}`}>{job.error}</div>}
    {job?.status==='completed'&&job.result&&<ResearchReport key={job.id} job={job} portfolio={portfolio} quotes={quotes}/>}
  </section>;
}
