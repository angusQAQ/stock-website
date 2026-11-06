import { ArrowLeftRight, BriefcaseBusiness, Building2, ChartNoAxesCombined, ChevronDown, Newspaper, Scale } from 'lucide-react';
import type { AnalysisJob, AnalysisReport } from '../shared/types';
import StockChart from './StockChart';

const categories={financials:{name:'財務報表',icon:Building2},market:{name:'市場動態',icon:ChartNoAxesCombined},flows:{name:'資金與價量',icon:ArrowLeftRight},insiders:{name:'高管交易',icon:BriefcaseBusiness},options:{name:'Call／Put 市場情緒',icon:Scale}};
const states={available:'附來源資料',unavailable:'資料不足','not-applicable':'不適用'};
const value=(n:number|null|undefined)=>typeof n==='number'?n.toLocaleString('en-US',{maximumFractionDigits:2}):'樣本不足';
function Sources({indices,report}:{indices:number[];report:AnalysisReport}){
  return <span className="inline-sources">{[...new Set(indices)].map(index=>report.sources[index]?<a key={index} href={report.sources[index].url} target="_blank" rel="noreferrer">來源 {index+1}</a>:null)}</span>;
}
export default function ResearchEvidence({job}:{job:AnalysisJob}){
  const report=job.result,research=report?.research,snapshot=job.researchSnapshot;
  if(!report||!research)return null;
  const tech=snapshot?.indicators;
  return <div className="research-evidence">
    <section className="plain-language"><h4>用簡單的話說</h4><p>{research.plainLanguage}</p></section>
    <section className="outlook-section"><h4>{job.horizon==='month'?'未來一個月展望':'所選期間展望'}</h4>{snapshot&&<p className="muted">{snapshot.window.start} 至 {snapshot.window.end}{job.horizon==='month'?' · 未來 30 個曆日':''}</p>}<p>{research.outlook}</p>
      <div className="scenario-list">{research.scenarios.map(item=><div key={item.case}><strong>{{bull:'上行情境',base:'基準情境',bear:'下行情境'}[item.case]}</strong><p>{item.condition}</p><p>{item.outcome}{item.targetPrice!==null?` · 條件目標 US$${value(item.targetPrice)}`:''}</p></div>)}</div>
    </section>
    <section className="report-chart"><h4>用 K 線核對研究立場</h4><p className="muted">分析當時的日 K 線快照 · 可縮放、拖曳及移動十字線 · MA20／MA50 與成交量</p>
      {snapshot?.chart?.bars.length?<><StockChart key={job.id} symbol={job.symbol} bars={snapshot.chart.bars} indicators/><p className="chart-evidence-source">{snapshot.chart.source} · 擷取 {new Date(snapshot.chart.fetchedAt).toLocaleString('zh-HK')} · 最新 K 線 {new Date(snapshot.chart.bars.at(-1)!.time*1000).toLocaleDateString('zh-HK')}<br/>{snapshot.chart.priceBasis??'價格復權方式未提供'}；最新 K 線可能尚未完成。<a href={snapshot.chart.sourceUrl??`https://finance.yahoo.com/quote/${encodeURIComponent(job.symbol)}/history/`} target="_blank" rel="noreferrer">核對來源</a></p></>:<p className="notice">未取得可驗證的日 K 線，暫不顯示技術圖表。</p>}
      <p>{research.technicalSummary}</p>
      {tech&&<details className="technical-data"><summary>展開程式計算的技術與價量指標</summary><dl className="technical-metrics">{[
        ['MA20',tech.ma20],['MA50',tech.ma50],['MA200',tech.ma200],['RSI14',tech.rsi14],['MACD',tech.macd],['MACD 訊號',tech.macdSignal],['MACD 柱',tech.macdHistogram],['布林上軌',tech.bollingerUpper],['布林下軌',tech.bollingerLower],['ATR14',tech.atr14],['近20日支撐',tech.support20],['近20日阻力',tech.resistance20],['相對量能（倍）',tech.relativeVolume20],['CMF20',tech.cmf20],['OBV（股）',tech.obv],
      ].map(([label,n])=><div key={String(label)}><dt>{label}</dt><dd>{value(n as number|null)}</dd></div>)}</dl><p className="muted">MA、MACD、布林、ATR 與支撐阻力以 USD 計；RSI 介乎 0–100。CMF／OBV 是價量代理，並非機構淨流入；盤中量能與完整交易日不可直接比較。</p></details>}
    </section>
    <section className="news-impact"><h4><Newspaper size={16}/>新聞如何影響股價</h4>{research.newsImpact.length?research.newsImpact.map((news,index)=><article key={index}><time>{news.date}</time><h5>{news.title}</h5><p>{news.impact}</p><Sources indices={news.sourceIndices} report={report}/></article>):<p className="muted">未取得可核實的近期新聞；資料缺漏列於下方，沒有據此推定期間沒有事件。</p>}</section>
    <section className="evidence-sections"><h4>展開量化證據</h4>{research.evidence.map(item=>{const category=categories[item.kind],Icon=category.icon;return <details key={item.kind}><summary><Icon size={16}/><span>{category.name}</span><small>{states[item.status]}</small><ChevronDown size={14} className="evidence-chevron"/></summary><div className="evidence-body"><p>{item.summary}</p><p className="evidence-asof">資料日期 {item.asOf??'未取得'} <Sources indices={item.sourceIndices} report={report}/></p>{!!item.metrics.length&&<div className="evidence-table-wrap"><table><caption>{category.name}量化資料；各項保留自己的單位與期間</caption><thead><tr><th>項目</th><th>數值／單位</th><th>期間／來源</th></tr></thead><tbody>{item.metrics.map((metric,index)=><tr key={index}><th scope="row">{metric.label}</th><td>{value(metric.value)} <small>{metric.unit}</small></td><td>{metric.period}<Sources indices={metric.sourceIndices} report={report}/></td></tr>)}</tbody></table></div>}</div></details>})}</section>
    <p className="research-disclosure">研究用途，不執行交易；情境與評級不保證回報。Call／Put 資料只供觀察，沒有期權或做空建議。利益衝突：{research.conflicts}</p>
  </div>;
}
