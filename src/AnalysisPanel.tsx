import { useRef, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import type { AnalysisJob, Horizon, Risk, RiskSettings } from '../shared/types';
import { HORIZONS } from '../shared/types';
import { RISK_NAMES, RISK_ORDER } from '../shared/risk';
import { API_AVAILABLE } from './api';
import ResearchReport from './ResearchReport';
import AnalysisConnection from './AnalysisConnection';

export default function AnalysisPanel({symbol,horizon,risk,setHorizon,setRisk,online,enabled,job,pendingJob,analyze,busy,error,settings,reload,cancel,cancellingId}:
  {symbol:string;horizon:Horizon;risk:Risk;setHorizon:(value:Horizon)=>void;setRisk:(value:Risk)=>void;online:boolean;enabled:boolean;
   job:AnalysisJob|undefined;pendingJob:AnalysisJob|undefined;analyze:()=>void;busy:boolean;error:string;
   settings:RiskSettings|null;reload:()=>Promise<void>;cancel:(id:string)=>Promise<AnalysisJob>;cancellingId:string|null}) {
  const [queueError,setQueueError]=useState('');
  const [queueMessage,setQueueMessage]=useState('');
  const riskSelect=useRef<HTMLSelectElement|null>(null);
  const [setupOpen,setSetupOpen]=useState(false);
  const analyzeButton=useRef<HTMLButtonElement>(null);
  async function cancelPending() {
    if(!pendingJob)return;setQueueError('');setQueueMessage('');
    try {await cancel(pendingJob.id);setQueueMessage(`已取消 ${pendingJob.symbol} 的排隊分析。`);riskSelect.current?.focus({preventScroll:true})}catch(error){setQueueError((error as Error).message)}
  }
  return <section className="panel analysis-panel">
    <div className="panel-heading"><h2><Sparkles size={17}/>教學分析</h2></div>
    <div className="analysis-controls"><div><span className="field-label">投資期間 · 一個月為未來 30 天</span><div className="segmented">{(Object.entries(HORIZONS) as [Horizon,string][]).map(([key,label])=><button key={key} className={horizon===key?'active':''} aria-pressed={horizon===key} onClick={()=>setHorizon(key)}>{label}</button>)}</div></div>
      <label className="risk-select"><ShieldCheck size={14}/><select ref={riskSelect} aria-label="研究風險偏好" value={risk} onChange={event=>setRisk(event.target.value as Risk)}>{RISK_ORDER.map(key=><option value={key} key={key}>{RISK_NAMES[key]}</option>)}</select></label>
      <button ref={analyzeButton} className="button primary" aria-label={`分析 ${symbol}`} onClick={()=>{if(!API_AVAILABLE||!settings||!enabled)setSetupOpen(true);else{setSetupOpen(false);analyze()}}} disabled={busy||!!pendingJob}><Sparkles size={15}/>{busy?'提交中…':pendingJob?pendingJob.id===job?.id?(pendingJob.status==='queued'?'等待分析程式接收':'正在整理教學報告…'):'等待其他分析完成':`分析 ${symbol}`}</button>
    </div>
    <div className="analysis-limits"><span>{risk==='conservative'?'保守：先看下跌風險與證據缺漏。':risk==='balanced'?'平衡：同時比較支持與反對理由。':'進取：也研究較高波動的條件與風險。'}</span></div>
    <div className="bridge-status"><span className={`status-dot ${online?'online':''}`}/><span>{online?'Mac 分析端已連線':enabled?'Mac 分析端離線，工作將等待接收':'Mac 分析端尚未連接'}</span><span>僅按下分析時執行</span></div>
    {setupOpen&&<AnalysisConnection symbol={symbol} horizon={horizon} risk={risk} enabled={enabled} settingsReady={!!settings} online={online} reload={reload} close={()=>{setSetupOpen(false);analyzeButton.current?.focus({preventScroll:true})}}/>}
    {pendingJob&&<div className="queue-controls" role="status"><span>{pendingJob.symbol} · {pendingJob.status==='queued'?'等待 Mac 接收，尚未執行分析。':'Mac 正在執行分析。'}</span>{pendingJob.status==='queued'&&<button className="text-button" onClick={cancelPending} disabled={cancellingId===pendingJob.id}>{cancellingId===pendingJob.id?'正在取消…':'取消排隊'}</button>}</div>}
    {queueMessage&&<div className="notice" role="status">{queueMessage}</div>}
    {(error||queueError)&&<div className="notice error" role="alert">{error||queueError}</div>}
    {job?.status==='failed'&&<div className={`notice ${job.cancelledAt?'':'error'}`}>{job.error}</div>}
    {job?.status==='completed'&&job.result&&<ResearchReport key={job.id} job={job}/>}
  </section>;
}
