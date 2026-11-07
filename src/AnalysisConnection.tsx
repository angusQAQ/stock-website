import { useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import type { Horizon, Risk } from '../shared/types';
import { learningTask } from '../shared/learning-task';
import { API_AVAILABLE } from './api';

export default function AnalysisConnection({symbol,horizon,risk,enabled,settingsReady,online,reload,close}:{symbol:string;horizon:Horizon;risk:Risk;enabled:boolean;settingsReady:boolean;online:boolean;reload:()=>Promise<void>;close:()=>void}){
  const heading=useRef<HTMLHeadingElement>(null),[message,setMessage]=useState(''),[checking,setChecking]=useState(false);
  const task=learningTask(symbol,horizon,risk);
  useEffect(()=>{heading.current?.focus({preventScroll:true})},[]);
  async function copy(){try{await navigator.clipboard.writeText(task);setMessage('題目已複製。貼到你的 Codex 後才會執行研究。')}catch{setMessage('瀏覽器未允許複製，請展開下方題目後手動複製。')}}
  return <div className="analysis-connection" id="analysis-connection">
    <h3 ref={heading} tabIndex={-1}>開始這隻股票的教學研究</h3>
    <p>網站的 AI 報告服務尚未完成連接。你可以先複製研究題目到 Codex；結果目前不會自動回寫網站。</p>
    <button className="button primary" onClick={copy}><Copy size={15}/>複製 {symbol} 研究題目</button>
    {message&&<p role="status">{message}</p>}
    <details><summary>查看／手動複製題目</summary><textarea aria-label="可複製的教學研究題目" readOnly value={task} onFocus={event=>event.target.select()}/></details>
    <details><summary>如何啟用網站自動報告？</summary><p>網站需要研究服務接收題目，再由你的 Mac 分析程式執行，完成後回傳報告。公開 K 線圖可以獨立使用。</p>
      <ul><li>研究服務：{API_AVAILABLE?'已設定網址':'尚未設定'}</li><li>研究設定：{settingsReady?'已取得':'尚未取得'}</li><li>分析程式：{enabled?(online?'已連線':'已啟用，等待 Mac 連線'):'尚未啟用'}</li></ul>
      <a className="text-button" href="https://github.com/angusQAQ/stock-website/blob/main/docs/deployment.md" target="_blank" rel="noreferrer">查看部署與 Mac 連接說明<ExternalLink size={13}/></a>
      <button className="text-button" disabled={checking} onClick={async()=>{setChecking(true);try{await reload();setMessage('已重新檢查服務狀態。')}finally{setChecking(false)}}}><RefreshCw size={13}/>{checking?'檢查中…':'重新檢查服務'}</button>
    </details>
    <button className="text-button" onClick={close}>收起操作說明</button>
  </div>;
}
