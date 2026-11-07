import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { UNIVERSE, HORIZONS, type AnalysisHistory, type AnalysisJob, type Horizon } from '../shared/types';
import { RISK_NAMES } from '../shared/risk';
import { api, API_AVAILABLE } from './api';
import ResearchReport from './ResearchReport';

const horizons=HORIZONS;
const status=(job:AnalysisJob)=>job.cancelledAt?'已取消':({queued:'排隊中',running:'分析中',completed:'已完成',failed:'未完成'}[job.status]);
export default function ReportsView({jobs,select,cancel}:
  {jobs:AnalysisJob[];select:(symbol:string)=>void;cancel:(id:string)=>Promise<AnalysisJob>}) {
  const [symbol,setSymbol]=useState(''),[horizon,setHorizon]=useState('');
  const [items,setItems]=useState<AnalysisJob[]>([]),[cursor,setCursor]=useState<string|null>(null);
  const [selected,setSelected]=useState<AnalysisJob|null>(null),[busy,setBusy]=useState(false),[detailBusy,setDetailBusy]=useState(false),[cancelling,setCancelling]=useState(false);
  const [error,setError]=useState('');
  const listRequest=useRef<AbortController|null>(null),detailRequest=useRef<AbortController|null>(null);
  const appendedFocus=useRef<string|null>(null);
  const reportHeading=useRef<HTMLHeadingElement|null>(null),backButton=useRef<HTMLButtonElement|null>(null);
  const load=useCallback(async(before:string|null=null)=>{
    listRequest.current?.abort();const controller=new AbortController();listRequest.current=controller;
    if(!API_AVAILABLE){setItems([]);setCursor(null);return;}
    setBusy(true);setError('');
    if(!before){setItems([]);setCursor(null)}
    const params=new URLSearchParams({limit:'20'});if(symbol)params.set('symbol',symbol);if(horizon)params.set('horizon',horizon);if(before)params.set('before',before);
    try {
      const data=await api<AnalysisHistory>(`/analysis/history?${params}`,{signal:controller.signal});
      if(!controller.signal.aborted){
        appendedFocus.current=before&&data.items.length?`archive-${data.items[0].id}`:null;
        setItems(previous=>before?[...previous,...data.items.filter(item=>!previous.some(old=>old.id===item.id))]:data.items);
        setCursor(data.nextCursor);
      }
    }
    catch(error){if(!controller.signal.aborted)setError((error as Error).message)}finally{if(!controller.signal.aborted)setBusy(false)}
  },[symbol,horizon]);
  useEffect(()=>{load();return()=>listRequest.current?.abort()},[load]);
  useEffect(()=>{
    // Wait for the new rows to commit. A frame scheduled in the fetch callback
    // may run before React renders the appended rows.
    if(appendedFocus.current&&!selected)document.getElementById(appendedFocus.current)?.focus();
    appendedFocus.current=null;
  },[items,selected?.id]);
  useEffect(()=>()=>detailRequest.current?.abort(),[]);
  useEffect(()=>{if(selected)reportHeading.current?.focus({preventScroll:true})},[selected?.id]);
  useEffect(()=>{setSelected(previous=>{
    const current=previous&&jobs.find(job=>job.id===previous.id);
    return current&&(current.updatedAt!==previous?.updatedAt||current.status!==previous?.status||current.cancelledAt!==previous?.cancelledAt)?current:previous;
  })},[jobs]);
  async function open(id:string) {
    detailRequest.current?.abort();const controller=new AbortController();detailRequest.current=controller;
    setDetailBusy(true);setError('');
    try {const job=await api<AnalysisJob>(`/analysis/jobs/${encodeURIComponent(id)}`,{signal:controller.signal});if(!controller.signal.aborted){setSelected(job);window.scrollTo(0,0)}}
    catch(error){if(!controller.signal.aborted)setError((error as Error).message)}finally{if(!controller.signal.aborted)setDetailBusy(false)}
  }
  async function cancelSelected() {
    if(!selected)return;setCancelling(true);setError('');
    try {const job=await cancel(selected.id);setSelected(job);setItems(old=>old.map(item=>item.id===job.id?job:item));requestAnimationFrame(()=>backButton.current?.focus({preventScroll:true}))}catch(error){setError((error as Error).message)}finally{setCancelling(false)}
  }
  const displayed=items.map(item=>jobs.find(job=>job.id===item.id)??item);
  return <div className="reports-view">
    <div className="page-title"><div><h1 ref={reportHeading} tabIndex={-1}>{selected?`${selected.symbol} · ${horizons[selected.horizon]}研究`:'回看每次學到的市場判斷'}</h1><p>{selected?'保留這次分析的時間、依據與風險設定。':'先讀白話結論，再點開因果推理、價位圖與資料來源。'}</p></div><span className="page-context">研究報告</span></div>
    {error&&<div className="notice error" role="alert">{error}</div>}
    {selected?<section className="panel archive-detail">
      <div className="panel-heading"><button ref={backButton} className="text-button" onClick={()=>{const id=selected.id;setSelected(null);setError('');requestAnimationFrame(()=>document.getElementById(`archive-${id}`)?.focus())}}><ArrowLeft size={16}/>返回分析紀錄</button><span className={`job-status ${selected.cancelledAt?'cancelled':selected.status}`}>{status(selected)}</span></div>
      <div className="archive-meta"><span>{RISK_NAMES[selected.risk]}研究 · 建立於 {new Date(selected.createdAt).toLocaleString('zh-HK')}</span><button className="text-button" onClick={()=>select(selected.symbol)}>研究這隻股票<ArrowRight size={15}/></button></div>
      {selected.result&&selected.status==='completed'?<ResearchReport key={selected.id} job={selected} historical/>:<div className="empty-state"><FileText size={30}/><h3>{status(selected)}</h3><p>{selected.error??(selected.status==='queued'?'工作仍在等待你的 Mac 接收，尚未執行分析。':'Mac 正在處理這份報告，完成後會更新。')}</p>{selected.status==='queued'&&<button className="button secondary" disabled={cancelling} onClick={cancelSelected}>{cancelling?'正在取消…':'取消這份排隊分析'}</button>}</div>}
    </section>:<section className="panel">
      <div className="panel-heading"><h2>分析紀錄</h2><button className="text-button" disabled={!API_AVAILABLE||busy||detailBusy} onClick={()=>load()}><RefreshCw size={14}/>重新整理</button></div>
      <div className="report-filters"><label>股票<select aria-label="報告股票篩選" value={symbol} onChange={event=>setSymbol(event.target.value)} disabled={detailBusy}><option value="">全部股票</option>{UNIVERSE.map(stock=><option key={stock.symbol} value={stock.symbol}>{stock.symbol} · {stock.name}</option>)}</select></label><label>分析期間<select aria-label="報告期間篩選" value={horizon} onChange={event=>setHorizon(event.target.value as Horizon|'')} disabled={detailBusy}><option value="">全部期間</option>{Object.entries(horizons).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label><span className="muted" role="status">{busy?'讀取中…':detailBusy?'正在開啟報告…':!API_AVAILABLE?'待連接':`${items.length} 份紀錄`}</span></div>
      {displayed.length?<div className="report-list">{displayed.map(job=><button id={`archive-${job.id}`} key={job.id} disabled={detailBusy} onClick={()=>open(job.id)} aria-label={`${job.symbol} ${horizons[job.horizon]}分析 ${new Date(job.createdAt).toLocaleString('zh-HK')} ${job.result?.summary.slice(0,80)??status(job)}`}><span className="report-list-icon"><FileText size={22}/></span><span className="report-list-content"><strong>{job.symbol}<span>{horizons[job.horizon]} · {RISK_NAMES[job.risk]}</span></strong><span>{job.result?.summary??job.error??(job.status==='queued'?'等待 Mac 接收工作':'分析進行中')}</span><small>{new Date(job.createdAt).toLocaleString('zh-HK')}</small></span><span className={`job-status ${job.cancelledAt?'cancelled':job.status}`}>{status(job)}</span><ChevronRight size={18}/></button>)}</div>:<div className="empty-state"><FileText size={36} strokeWidth={1.5}/><h3>{busy?'正在讀取分析紀錄':symbol||horizon?'沒有符合條件的紀錄':'你的第一份研究，從選股開始。'}</h3><p>{!API_AVAILABLE?'連接資料服務後，這裡會保留你的分析紀錄。':symbol||horizon?'調整股票或期間，查看其他分析。':'選擇一隻股票與投資期間，再按「分析」。完成後可按日期回看每一份報告。'}</p>{!busy&&!symbol&&!horizon&&<button className="button dark" onClick={()=>select('AAPL')}>前往市場研究<ArrowRight size={16}/></button>}</div>}
      {cursor&&<div className="archive-pagination"><button className="button secondary" disabled={busy||detailBusy} onClick={()=>load(cursor)}>{busy?'讀取中…':'載入更多報告'}</button></div>}
    </section>}
  </div>;
}
