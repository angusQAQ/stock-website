import { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Risk, RiskSettings, RiskSettingsInput } from '../shared/types';
import { initialRiskSettings, parseRiskSettings, RISK_NAMES, RISK_ORDER } from '../shared/risk';
import { fixed } from '../shared/portfolio';
import { API_AVAILABLE } from './api';

type Draft=Record<Risk,{position:string;risk:string}>;
function draftFrom(settings:RiskSettings):Draft {
  return Object.fromEntries(RISK_ORDER.map(key=>[key,{position:String(settings.profiles[key].maxPositionBps/100),risk:String(settings.profiles[key].riskPerTradeBps/100)}])) as Draft;
}
export default function RiskSettingsPanel({settings,save,reload,expanded,toggle}:
  {settings:RiskSettings|null;save:(input:RiskSettingsInput)=>Promise<RiskSettings>;reload:()=>Promise<RiskSettings>;expanded:boolean;toggle:(value:boolean)=>void}) {
  const [draft,setDraft]=useState(()=>draftFrom(settings??initialRiskSettings()));
  const [revision,setRevision]=useState(settings?.revision??0);
  const [dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  useEffect(()=>{if(!dirty&&settings){setDraft(draftFrom(settings));setRevision(settings.revision)}},[settings,dirty]);
  const change=(risk:Risk,field:'position'|'risk',value:string)=>{setDraft(old=>({...old,[risk]:{...old[risk],[field]:value}}));setDirty(true);setMessage('');setError('')};
  async function submit(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setError('');setMessage('');
    try {
      const profiles=Object.fromEntries(RISK_ORDER.map(key=>[key,{maxPositionBps:fixed(draft[key].position,2),riskPerTradeBps:fixed(draft[key].risk,2)}]));
      const value=parseRiskSettings({revision,profiles});
      const saved=await save(value);setDraft(draftFrom(saved));setRevision(saved.revision);setDirty(false);setMessage(`風險設定已儲存，版本 ${saved.revision}。`);
    } catch(error){setError((error as Error).message)}finally{setBusy(false)}
  }
  async function refresh() {
    setBusy(true);setError('');setMessage('');
    try {const value=await reload();setDraft(draftFrom(value));setRevision(value.revision);setDirty(false)}catch(error){setError((error as Error).message)}finally{setBusy(false)}
  }
  return <details className="panel risk-settings" id="risk-settings" open={expanded} onToggle={event=>toggle(event.currentTarget.open)}>
    <summary><span><ShieldCheck size={18}/>投資風險設定</span><span className="settings-summary">{settings?(settings.revision?`版本 ${settings.revision}`:'初始建議'):'待連接'}<ChevronDown size={17}/></span></summary>
    <div className="settings-body">
      <p className="settings-intro">先選保守、平衡或進取，再按你的情況調整限額。每次修改只套用新分析，舊報告保留當時的設定。</p>
      {!settings&&<p className="notice">尚未取得雲端設定，以下顯示初始建議；連接資料服務後才能儲存。</p>}
      {settings?.revision===0&&<p className="settings-note">目前比例為初始建議，尚未由你儲存。可先調整，再儲存自己的設定。</p>}
      {dirty&&settings&&settings.revision!==revision&&<p className="notice">雲端已有較新版本。你的修改仍保留，請重新載入最新設定再編輯。</p>}
      <form onSubmit={submit}>
        <fieldset disabled={!API_AVAILABLE||!settings||busy} className="risk-profile-fields">
          {RISK_ORDER.map(risk=><fieldset className="risk-profile" key={risk}><legend>{RISK_NAMES[risk]}</legend>
            <label>單股倉位上限（%）<input aria-label={`${RISK_NAMES[risk]}單股倉位上限`} inputMode="decimal" value={draft[risk].position} onChange={event=>change(risk,'position',event.target.value)} required/></label>
            <label>每筆風險上限（%）<input aria-label={`${RISK_NAMES[risk]}每筆風險上限`} inputMode="decimal" value={draft[risk].risk} onChange={event=>change(risk,'risk',event.target.value)} required/></label>
          </fieldset>)}
        </fieldset>
        <p className="settings-note">倉位比例以美元總資產計算；每筆風險包含預計費用與參考買入價至止損價的差額。保守、平衡、進取的限額須依序相同或遞增。</p>
        {error&&<p className="notice error" role="alert">{error}</p>}{message&&<p className="settings-saved" role="status">{message}</p>}
        <div className="settings-actions"><button className="button primary" type="submit" disabled={!API_AVAILABLE||!settings||busy||!dirty}>{busy?'正在處理…':'儲存風險設定'}</button>
          <button className="text-button" type="button" disabled={!settings||busy} onClick={()=>{setDraft(draftFrom(initialRiskSettings()));setDirty(true);setError('');setMessage('')}}>恢復建議比例</button>
          <button className="text-button" type="button" disabled={!API_AVAILABLE||busy} onClick={refresh}><RefreshCw size={14}/>重新載入設定</button>
        </div>
      </form>
    </div>
  </details>;
}
