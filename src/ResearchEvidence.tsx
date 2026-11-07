import { ArrowLeftRight, BriefcaseBusiness, Building2, ChartNoAxesCombined, ChevronDown, Newspaper, Scale } from 'lucide-react';
import type { AnalysisJob, AnalysisReport } from '../shared/types';
import StockChart from './StockChart';
import Citations from './Citations';
import { reportPriceLevels } from '../shared/price-levels';

const categories={financials:{name:'財務報表',icon:Building2},market:{name:'市場動態',icon:ChartNoAxesCombined},flows:{name:'資金與價量',icon:ArrowLeftRight},insiders:{name:'高管交易',icon:BriefcaseBusiness},options:{name:'Call／Put 市場情緒',icon:Scale}};
const states={available:'附來源資料',unavailable:'資料不足','not-applicable':'不適用'};
const value=(n:number|null|undefined)=>typeof n==='number'?n.toLocaleString('en-US',{maximumFractionDigits:2}):'樣本不足';
const Sources=({indices,report}:{indices:number[];report:AnalysisReport})=><Citations indices={indices} report={report}/>;
export default function ResearchEvidence({job}:{job:AnalysisJob}){
  const report=job.result,research=report?.research,snapshot=job.researchSnapshot;
  if(!report||!research)return null;
  const tech=snapshot?.indicators;
  const refs=research.references,levels=reportPriceLevels(report);
  return <div className="research-evidence">
    <section className="outlook-section"><h4>{job.horizon==='month'?'未來一個月，要觀察甚麼？':'這段期間，要觀察甚麼？'}</h4>{snapshot&&<p className="muted">{snapshot.window.start} 至 {snapshot.window.end}{job.horizon==='month'?' · 未來 30 個曆日':''}</p>}<p>{research.outlook}<Citations indices={refs?.outlook} report={report}/></p>
      <div className="scenario-list">{research.scenarios.map((item,index)=><div key={item.case}><strong>{{bull:'較好情況',base:'中間情況',bear:'較差情況'}[item.case]}</strong><p>{item.condition}<Citations indices={refs?.scenarios[index]} report={report}/></p><p>{item.outcome}{item.targetPrice!==null?` · 條件目標 US$${value(item.targetPrice)}`:''}<Citations indices={refs?.scenarios[index]} report={report}/></p></div>)}</div>
    </section>
    <section id={`report-price-${job.id}`} tabIndex={-1} className="report-chart"><h4>把參考價位放到 K 線上看</h4><p className="muted">保留研究當時的資料，可縮放與拖曳。價位與均線的小字放在右側價格軸，與陰陽燭分開。</p>
      <ul className="price-line-legend">{levels.map(level=><li key={level.key} className={`price-level ${level.key}`}><i aria-hidden="true"/><span>{level.label} {value(level.price)} USD<Citations indices={refs?.[level.key]} report={report}/></span></li>)}</ul>
      {snapshot?.chart?.bars.length?<><StockChart key={job.id} symbol={job.symbol} bars={snapshot.chart.bars} priceLevels={levels} indicators/><p className="chart-evidence-source">{snapshot.chart.source} · 擷取 {new Date(snapshot.chart.fetchedAt).toLocaleString('zh-HK')} · 最新 K 線 {new Date(snapshot.chart.bars.at(-1)!.time*1000).toLocaleDateString('zh-HK')}<br/>{snapshot.chart.priceBasis??'價格復權方式未提供'}；最新 K 線可能尚未完成。<sup><a href={snapshot.chart.sourceUrl??`https://finance.yahoo.com/quote/${encodeURIComponent(job.symbol)}/history/`} target="_blank" rel="noreferrer">[K線資料]</a></sup></p></>:<p className="notice">未取得可驗證的日 K 線，暫不顯示技術圖表。</p>}
      <p>{research.technicalSummary}<Citations indices={refs?.technicalSummary} report={report}/></p>
      <details className="indicator-help"><summary>均線、RSI、MACD 是在看甚麼？<ChevronDown size={16} className="disclosure-icon" aria-hidden="true"/></summary><p>均線是過去若干根 K 線收盤價的平均，幫助觀察方向。RSI 整理近期漲跌力度；MACD 比較兩條均線的變化。它們會落後或失準，不能單靠其中一個預測未來。</p><p>圖中的 MA20／MA50 依所選 K 線週期計算；下方原始數據固定採當時的日K，方便核對報告依據。</p></details>
      {tech&&<details className="technical-data"><summary>展開程式計算的技術與價量指標<ChevronDown size={16} className="disclosure-icon" aria-hidden="true"/></summary><dl className="technical-metrics">{[
        ['MA20',tech.ma20],['MA50',tech.ma50],['MA200',tech.ma200],['RSI14',tech.rsi14],['MACD',tech.macd],['MACD 訊號',tech.macdSignal],['MACD 柱',tech.macdHistogram],['布林上軌',tech.bollingerUpper],['布林下軌',tech.bollingerLower],['ATR14',tech.atr14],['近20日支撐',tech.support20],['近20日阻力',tech.resistance20],['相對量能（倍）',tech.relativeVolume20],['CMF20',tech.cmf20],['OBV（股）',tech.obv],
      ].map(([label,n])=><div key={String(label)}><dt>{label}</dt><dd>{value(n as number|null)}</dd></div>)}</dl><p className="muted">MA、MACD、布林、ATR 與支撐阻力以 USD 計；RSI 介乎 0–100。CMF／OBV 是價量代理，並非機構淨流入；盤中量能與完整交易日不可直接比較。</p></details>}
    </section>
    <section className="news-impact"><h4><Newspaper size={16}/>新聞怎樣傳到股價？</h4>{research.newsImpact.length?research.newsImpact.map((news,index)=><article key={index}><time>{news.date}</time><h5>{news.title}</h5><p>{news.impact}<Sources indices={news.sourceIndices} report={report}/></p>{news.mechanism&&<details className="causal-explanation"><summary>一步步看可能的因果關係<ChevronDown size={16} className="disclosure-icon" aria-hidden="true"/></summary><ol className="causal-chain">{[['先發生甚麼',news.mechanism.trigger],['如何傳導',news.mechanism.transmission],['對公司有甚麼影響',news.mechanism.companyEffect],['價格可能怎樣反應',news.mechanism.possiblePriceEffect]].map(([label,text])=><li key={label}><small>{label}</small><p>{text}<Sources indices={news.sourceIndices} report={report}/></p></li>)}</ol><p><strong>反向因素與其他解釋：</strong>{news.mechanism.counterpoint}<Sources indices={news.sourceIndices} report={report}/></p></details>}</article>):<p className="muted">未取得可核實的近期新聞；資料缺漏列於下方，沒有據此推定期間沒有事件。</p>}</section>
    <section className="evidence-sections"><h4>展開量化證據</h4>{research.evidence.map(item=>{const category=categories[item.kind],Icon=category.icon;return <details key={item.kind}><summary><Icon size={16}/><span>{category.name}</span><small>{states[item.status]}</small><ChevronDown size={14} className="evidence-chevron"/></summary><div className="evidence-body"><p>{item.summary}</p><p className="evidence-asof">資料日期 {item.asOf??'未取得'} <Sources indices={item.sourceIndices} report={report}/></p>{!!item.metrics.length&&<div className="evidence-table-wrap"><table><caption>{category.name}量化資料；各項保留自己的單位與期間</caption><thead><tr><th>項目</th><th>數值／單位</th><th>期間／來源</th></tr></thead><tbody>{item.metrics.map((metric,index)=><tr key={index}><th scope="row">{metric.label}</th><td>{value(metric.value)} <small>{metric.unit}</small></td><td>{metric.period}<Sources indices={metric.sourceIndices} report={report}/></td></tr>)}</tbody></table></div>}</div></details>})}</section>
    <p className="research-disclosure">研究用途，不執行交易；情境與評級不保證回報。Call／Put 資料只供觀察，沒有期權或做空建議。利益衝突：{research.conflicts}</p>
  </div>;
}
