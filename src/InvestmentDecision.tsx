import { ChevronDown } from 'lucide-react';
import type { AnalysisJob } from '../shared/types';
import Citations from './Citations';

const actions={'consider-now':'可考慮入手',wait:'先等條件確認',avoid:'暫不考慮入手','insufficient-data':'資料不足，暫不判斷'};
export default function InvestmentDecision({job,id}:{job:AnalysisJob;id:string}){
  const report=job.result,decision=report?.research?.decision;if(!report||!decision)return null;
  const cite=<Citations indices={decision.sourceIndices} report={report}/>;
  return <section id={id} tabIndex={-1} className="investment-decision">
    <div className="decision-heading"><h4>綜合入場判斷</h4><span className={`decision-action ${decision.action}`}>{actions[decision.action]}</span></div>
    <p className="decision-basis">評級描述所選期間的研究立場；入場判斷會再考慮目前價位和確認條件。</p>
    <p className="decision-basis">以 {new Date(job.updatedAt).toLocaleString('zh-HK',{timeZone:'Asia/Hong_Kong'})} 香港時間的報告資料為準。</p>
    <div className="decision-overview"><div><h5>現在應否入手？</h5><p>{decision.nowExplanation}{cite}</p></div><div><h5>預期股價怎樣走？</h5><p>{decision.expectedPath}{cite}</p></div></div>
    <h5>需要等甚麼，再考慮入手？</h5>{decision.waitFor.length?<ul className="decision-conditions">{decision.waitFor.map((condition,index)=><li key={index}>{condition}{cite}</li>)}</ul>:<p>沒有另列等待條件；仍要核對下方確認及失效條件。{cite}</p>}
    <h5>哪些關鍵點出現，才重新評估入場？</h5>{decision.entryTriggers.length?<div className="entry-triggers">{decision.entryTriggers.map((trigger,index)=><details key={index}><summary><span>{trigger.condition}<Citations indices={trigger.sourceIndices} report={report}/><small className={`trigger-state ${trigger.status}`}>{trigger.status==='confirmed'?'報告時已確認':'待確認'}</small></span><ChevronDown size={16} className="disclosure-icon" aria-hidden="true"/></summary><p><strong>怎樣確認：</strong>{trigger.confirmation}<Citations indices={trigger.sourceIndices} report={report}/></p><p><strong>何時失效：</strong>{trigger.invalidation}<Citations indices={trigger.sourceIndices} report={report}/></p></details>)}</div>:<p>尚無足夠依據設定入場觸發點。</p>}
    {!!decision.invalidateWhen.length&&<><h5>甚麼會推翻這次建議？</h5><ul className="decision-conditions">{decision.invalidateWhen.map((condition,index)=><li key={index}>{condition}{cite}</li>)}</ul></>}
    <p className="decision-review"><strong>何時再檢查：</strong>{decision.reviewWhen}{cite}</p>
    <p className="decision-basis">觸發條件是核對研究立場的依據；條件出現時仍要重新檢查風險及資料時間。</p>
  </section>;
}
