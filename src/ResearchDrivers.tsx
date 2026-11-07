import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FACTOR_NAMES, type AnalysisReport, type ResearchDriver } from '../shared/types';
import Citations from './Citations';

const directions={supportive:'偏支持上行',pressure:'偏增加壓力',mixed:'影響有正有反',uncertain:'影響未明'};
export default function ResearchDrivers({report,id}:{report:AnalysisReport;id:string}){
  const [selected,setSelected]=useState<ResearchDriver['kind']>('earnings');
  const drivers=report.research?.drivers;if(!drivers?.length)return null;
  const current=drivers.find(item=>item.kind===selected)??drivers[0];
  const mechanism=current.mechanism;
  const steps=mechanism?[['事件與數據',mechanism.trigger],['如何傳導',mechanism.transmission],['盈利或估值',mechanism.companyEffect],['股價可能反應',mechanism.possiblePriceEffect]]:[];
  return <section id={id} tabIndex={-1} className="research-drivers">
    <h4>四類因素，怎樣影響這隻股票？</h4>
    <p className="driver-intro">選一項查看推理圖，再核對數據、來源及反向因素。</p>
    <div className="driver-picker" aria-label="選擇股票影響因素">{(Object.keys(FACTOR_NAMES) as ResearchDriver['kind'][]).map(kind=>{const item=drivers.find(driver=>driver.kind===kind);return <button key={kind} aria-pressed={current.kind===kind} className={current.kind===kind?'active':''} onClick={()=>setSelected(kind)}><strong>{FACTOR_NAMES[kind]}</strong><span>{item?.status==='available'?directions[item.direction]:'資料不足'}</span></button>})}</div>
    <div className="driver-content" aria-live="polite"><div className="driver-summary"><h5>{FACTOR_NAMES[current.kind]}：{current.status==='available'?directions[current.direction]:'尚未取得可靠資料'}</h5><span>資料日期 {current.asOf??'未取得'}</span></div>
      <p>{current.summary}<Citations indices={current.sourceIndices} report={report}/></p>
      {mechanism?<><ol className="impact-flow" aria-label={`${FACTOR_NAMES[current.kind]}影響股價的推論路徑`}>{steps.map(([label,text],index)=><li key={label}><h6>{label}</h6><p>{text}<Citations indices={current.sourceIndices} report={report}/></p>{index<steps.length-1&&<ArrowRight size={20} className="impact-arrow" aria-hidden="true"/>}</li>)}</ol>
        <p className="driver-counterpoint"><strong>哪些情況會令影響不同？</strong>{mechanism.counterpoint}<Citations indices={current.sourceIndices} report={report}/></p>
        <p className="driver-caution">箭頭連起這份報告的推論；市場預期、發布時間和同日其他事件，也會改變價格反應。</p></>:<p className="driver-caution">先補齊這項資料，才判斷影響方向；資料缺漏不代表沒有影響。</p>}
      {!!current.metrics.length&&<dl className="driver-metrics">{current.metrics.map((metric,index)=><div key={index}><dt>{metric.label}</dt><dd>{metric.value.toLocaleString('en-US',{maximumFractionDigits:2})} <small>{metric.unit}</small></dd><span>{metric.period}<Citations indices={metric.sourceIndices} report={report}/></span></div>)}</dl>}
    </div>
  </section>;
}
