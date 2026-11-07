import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowRight, BarChart3, ChevronRight, Clock3, Compass, Database, FileText, LayoutDashboard, ListFilter, RefreshCw, Search, Star } from 'lucide-react';
import type { AnalysisJob, Horizon, Quote, Risk, RiskSettings } from '../shared/types';
import { UNIVERSE } from '../shared/types';
import { technicals } from '../shared/indicators';
import { api, post, API_AVAILABLE } from './api';
import StockChart from './StockChart';
import AnalysisPanel from './AnalysisPanel';
import ReportsView from './ReportsView';
import MarketLesson from './MarketLesson';
import { aggregateCandles, CANDLE_PERIODS, historyRange, type CandlePeriod } from '../shared/chart-periods';
import { PublicMarketChart, PublicMarketOverview } from './PublicMarket';

const pct=(n:number|null)=>n===null?'—':`${n>=0?'+':''}${n.toFixed(2)}%`;
const compact=(n:number)=>Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n);
const sessionNames={pre:'盤前交易',regular:'正常交易',post:'盤後交易',closed:'已休市',unknown:'時段待確認'};
type Page='market'|'reports';

export default function App() {
  const [page,setPage]=useState<Page>('market');
  const [selected,setSelected]=useState('AAPL');
  const [candlePeriod,setCandlePeriod]=useState<CandlePeriod>('D');
  const range=historyRange(candlePeriod);
  const [query,setQuery]=useState('');
  const [searchOpen,setSearchOpen]=useState(false);
  const [listMode,setListMode]=useState<'popular'|'watchlist'|'etf'>('popular');
  const [quotes,setQuotes]=useState<Record<string,Quote>>({});
  const [quoteErrors,setQuoteErrors]=useState<Record<string,string>>({});
  const [chart,setChart]=useState<Quote|null>(null);
  const [chartError,setChartError]=useState('');
  const [chartSource,setChartSource]=useState<'public'|'api'>(API_AVAILABLE?'api':'public');
  const publicChart=!API_AVAILABLE||chartSource==='public';
  const [serviceChecked,setServiceChecked]=useState(false);
  const [watchlist,setWatchlist]=useState<string[]>([]);
  const [jobs,setJobs]=useState<AnalysisJob[]>([]);
  const [bridge,setBridge]=useState({enabled:false,online:false,lastSeen:null as string|null});
  const [serviceError,setServiceError]=useState('');
  const [analysisError,setAnalysisError]=useState('');
  const [horizon,setHorizon]=useState<Horizon>('month');
  const [risk,setRisk]=useState<Risk>('balanced');
  const [busy,setBusy]=useState(false);
  const [settings,setSettings]=useState<RiskSettings|null>(null);
  const [cancellingId,setCancellingId]=useState<string|null>(null);
  const [searchIndex,setSearchIndex]=useState(0);
  const [clock,setClock]=useState(Date.now());
  const [refresh,setRefresh]=useState(0);
  const serviceRequest=useRef<AbortController|null>(null);

  useEffect(()=>{window.scrollTo(0,0)},[page]);
  const displayed=useMemo(()=>listMode==='watchlist'?watchlist:listMode==='etf'?UNIVERSE.filter(x=>x.sector==='ETF').map(x=>x.symbol):UNIVERSE.slice(0,8).map(x=>x.symbol),[listMode,watchlist]);
  const symbols=useMemo(()=>[...new Set([selected,...displayed,'SPY','QQQ','VOO','BND'])].slice(0,40).join(','),[displayed,selected]);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{
    if(!serviceChecked||!API_AVAILABLE)return;
    let cancelled=false,working=false;
    const controller=new AbortController();
    async function poll(){
      if(working||document.hidden)return;working=true;
      const pending=symbols.split(',');
      await Promise.allSettled(Array.from({length:3},async()=>{while(pending.length&&!cancelled){const symbol=pending.shift()!;
        try {const q=await api<Quote>(`/quote?symbol=${encodeURIComponent(symbol)}&range=1D`,{signal:controller.signal});if(!cancelled){setQuotes(old=>({...old,[symbol]:q}));setQuoteErrors(old=>{const next={...old};delete next[symbol];return next})}}
        catch(e){if(!cancelled)setQuoteErrors(old=>({...old,[symbol]:(e as Error).message}))}
      }}));working=false;
    }
    poll();const timer=setInterval(poll,5000);document.addEventListener('visibilitychange',poll);
    return()=>{cancelled=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',poll)};
  },[symbols,refresh,serviceChecked]);
  useEffect(()=>{
    setChart(previous=>previous?.symbol===selected&&previous.range===range?previous:null);setChartError('');
    if(range==='1D'||!API_AVAILABLE||publicChart)return;
    const controller=new AbortController();let working=false;
    async function poll(){
      if(working||document.hidden||controller.signal.aborted)return;working=true;
      try {const value=await api<Quote>(`/quote?symbol=${selected}&range=${range}`,{signal:controller.signal});if(!controller.signal.aborted){setChart(value);setChartError('')}}
      catch(error){if(!controller.signal.aborted)setChartError((error as Error).message)}finally{working=false}
    }
    poll();const timer=setInterval(poll,5000);document.addEventListener('visibilitychange',poll);
    return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',poll)};
  },[selected,range,refresh,publicChart]);
  useEffect(()=>{if(quoteErrors[selected]||chartError)setChartSource('public')},[selected,quoteErrors,chartError]);
  const loadResearch=useCallback(async(force=false)=>{
    if(serviceRequest.current&&!force)return;
    serviceRequest.current?.abort();const controller=new AbortController();serviceRequest.current=controller;
    const options={signal:controller.signal};
    const results=await Promise.allSettled([api<string[]>('/watchlist',options),api<AnalysisJob[]>('/analysis/jobs',options),api<typeof bridge>('/analysis/status',options),api<RiskSettings>('/settings/risk',options),api<{version:string;schemaVersion:number;storage:boolean}>('/health',options)]);
    if(controller.signal.aborted)return;
    const [w,j,b,s]=results;
    if(w.status==='fulfilled')setWatchlist(w.value);
    if(j.status==='fulfilled')setJobs(j.value);
    if(b.status==='fulfilled')setBridge(b.value);
    if(s.status==='fulfilled')setSettings(previous=>previous&&previous.revision>s.value.revision?previous:s.value);else setSettings(null);
    const labels=['自選清單','分析紀錄','Mac 分析端','風險設定','服務狀態'];
    const grouped=new Map<string,string[]>();results.forEach((result,index)=>{if(result.status==='rejected'){const message=(result.reason as Error).message;grouped.set(message,[...(grouped.get(message)??[]),labels[index]])}});
    const failures=[...grouped].map(([message,services])=>`${services.join('、')}：${message}`);
    setServiceError(API_AVAILABLE?failures.join('；'):failures.length?'資料服務尚未連接。':'');setServiceChecked(true);
    if(serviceRequest.current===controller)serviceRequest.current=null;
  },[]);
  async function cancelJob(id:string):Promise<AnalysisJob> {
    setCancellingId(id);
    try {const value=await post<AnalysisJob>(`/analysis/jobs/${encodeURIComponent(id)}/cancel`,{});setJobs(old=>old.map(job=>job.id===id?value:job));await loadResearch(true);return value}finally{setCancellingId(null)}
  }
  useEffect(()=>{loadResearch();const timer=setInterval(()=>{if(!document.hidden)loadResearch()},10000);return()=>{clearInterval(timer);serviceRequest.current?.abort();serviceRequest.current=null}},[loadResearch]);

  const select=(symbol:string)=>{setSelected(symbol);setPage('market');setSearchOpen(false);setQuery('');setAnalysisError('');window.scrollTo(0,0)};
  const quote=quotes[selected];
  const activeChart=range==='1D'?quote:chart?.symbol===selected&&chart.range===range?chart:null;
  const rawBars=activeChart?.bars??[];
  const bars=useMemo(()=>aggregateCandles(rawBars,candlePeriod),[rawBars,candlePeriod]);
  const tech=technicals(bars);
  const latest=bars.at(-1);
  const currentJob=jobs.find(j=>j.symbol===selected&&j.horizon===horizon&&j.risk===risk);
  const pendingJob=jobs.find(job=>job.status==='queued'||job.status==='running');
  const results=UNIVERSE.filter(x=>`${x.symbol} ${x.name} ${x.sector}`.toLowerCase().includes(query.toLowerCase())).slice(0,7);
  const stale=!!quote && ['pre','regular','post'].includes(quote.session) && clock-quote.timestamp*1000>90_000;
  async function toggleWatch(){
    try{const exists=watchlist.includes(selected);await api('/watchlist',{method:exists?'DELETE':'POST',body:JSON.stringify({symbol:selected})});setWatchlist(old=>exists?old.filter(x=>x!==selected):[...old,selected])}catch(e){setServiceError((e as Error).message)}
  }
  async function analyze(){
    if(!settings){setAnalysisError('請先取得雲端風險設定。');return;}
    setBusy(true);setAnalysisError('');
    try{const job=await post<AnalysisJob>('/analysis/jobs',{symbol:selected,horizon,risk,settingsRevision:settings.revision});setJobs(old=>[job,...old]);await loadResearch(true)}
    catch(e){setAnalysisError((e as Error).message)}finally{setBusy(false)}
  }
  function searchSubmit(event:React.FormEvent){event.preventDefault();if(results.length)select(results[Math.min(searchIndex,results.length-1)].symbol)}

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">跳至主要內容</a>
    <header className="site-header">
      <div className="topbar">
        <a className="brand" href="#" onClick={event=>{event.preventDefault();setPage('market')}} aria-label="Northstar 首頁">
          <Compass className="brand-symbol" size={34} strokeWidth={2}/>
          <span className="brand-name">Northstar<small>美股學習平台</small></span>
        </a>
        <nav className="primary-nav" aria-label="主要導覽">
          {([{id:'market',label:'看懂市場',icon:LayoutDashboard},{id:'reports',label:'教學報告',icon:FileText}] as const).map(item=>
            <button key={item.id} className={page===item.id?'active':''} aria-current={page===item.id?'page':undefined} onClick={()=>setPage(item.id)}>
              <item.icon size={16}/><span>{item.label}</span>
            </button>)}
        </nav>
        <div className="header-actions">
          <form className="search" onSubmit={searchSubmit} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setSearchOpen(false)}}>
            <Search size={17}/>
            <input role="combobox" aria-label="搜尋美股與 ETF" aria-autocomplete="list" aria-controls="stock-search-results" aria-expanded={searchOpen&&!!query} aria-activedescendant={searchOpen&&query&&results.length?`search-${results[Math.min(searchIndex,results.length-1)].symbol}`:undefined}
              value={query} placeholder="搜尋股票 / ETF" autoComplete="off"
              onFocus={()=>setSearchOpen(true)} onChange={event=>{setQuery(event.target.value);setSearchIndex(0);setSearchOpen(true)}}
              onKeyDown={event=>{
                if(event.key==='Escape'){setSearchOpen(false);return;}
                if(['ArrowDown','ArrowUp'].includes(event.key)&&results.length){event.preventDefault();setSearchOpen(true);setSearchIndex(index=>(index+(event.key==='ArrowDown'?1:-1)+results.length)%results.length);}
              }}/>
            {searchOpen&&query&&<div className="search-results" id="stock-search-results" role="listbox" aria-label="股票搜尋結果">
              {results.length?results.map((stock,index)=><button type="button" role="option" aria-selected={index===searchIndex} id={`search-${stock.symbol}`} tabIndex={-1} key={stock.symbol} onMouseDown={event=>event.preventDefault()} onClick={()=>select(stock.symbol)}>
                <strong>{stock.symbol}</strong><span>{stock.name}</span><small>{stock.sector}</small>
              </button>):<p role="status">未找到股票。請搜尋大型美股或常見 ETF。</p>}
            </div>}
          </form>

        </div>
      </div>
    </header>

    <main className="main-content" id="main-content" tabIndex={-1}>
      <div className="workspace">
        {page==='market'&&<div className="market-status-bar">
          <h1 className="sr-only">看懂市場</h1>
          <div className="market-meta">
            <span className="live-label"><span className={`status-dot ${!publicChart&&quote&&!stale&&!quoteErrors[selected]?'online':''}`}/>{publicChart?'TradingView 公開行情':'每 5 秒檢查行情'}</span>
            <span className="market-clock"><Clock3 size={14}/>{new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false}).format(clock)}<small>紐約時間</small></span>
          </div>
        </div>}
        {serviceError&&<div className="notice service-notice" role="status">
          <Database size={17}/><span>{API_AVAILABLE?`資料服務連線：${serviceError}`:'AI 教學報告尚未啟用；你仍可查看圖表並使用下方互動教學。'}</span>
          <button className="text-button" onClick={()=>loadResearch(true)}>重新檢查<ArrowRight size={14}/></button>
        </div>}

        {page==='market'&&<>
          {publicChart?<PublicMarketOverview/>:<section className="market-cards" aria-label="市場 ETF 概覽">
            {([['SPY','標普 500'],['QQQ','納斯達克 100'],['VOO','美國大型股'],['BND','美國綜合債券']] as const).map(([symbol,label])=>{const q=quotes[symbol];return <button className="market-card" key={symbol} onClick={()=>select(symbol)}>
              <div className="market-card-name"><span>{label}</span><small>{symbol}<ChevronRight size={13}/></small></div>
              <div className="market-card-bottom"><strong>{q?q.price.toFixed(2):'—'}</strong><span className={!q?'muted':q.changePercent!==null&&q.changePercent<0?'down':'up'}>{q?pct(q.changePercent):'等待行情'}</span></div>
            </button>})}
          </section>}
          <div className="market-layout">
            <aside className="market-sidebar panel" aria-label="股票清單">
              <div className="panel-heading"><h2>選擇研究標的</h2><ListFilter size={16} aria-hidden="true"/></div>
              <div className="list-tabs" aria-label="股票清單篩選">
                {([['popular','熱門'],['watchlist','自選'],['etf','ETF']] as const).map(([id,label])=><button key={id} className={listMode===id?'active':''} aria-pressed={listMode===id} onClick={()=>setListMode(id)}>{label}</button>)}
              </div>
              <div className="stock-list">
                {displayed.map(symbol=>{const q=quotes[symbol],stock=UNIVERSE.find(x=>x.symbol===symbol);return <button key={symbol} className={`stock-row ${selected===symbol?'selected':''}`} aria-pressed={selected===symbol} onClick={()=>select(symbol)}>
                  <span className="stock-identity"><strong>{symbol}</strong><span>{stock?.name??symbol}</span></span>
                  <span className="stock-quote"><strong>{q?q.price.toFixed(2):publicChart?'看走勢':'—'}</strong><span className={!q?'muted':q.changePercent!==null&&q.changePercent<0?'down':'up'}>{q?pct(q.changePercent):publicChart?'圖內查看價格':'待更新'}</span></span>
                </button>})}
                {!displayed.length&&<div className="sidebar-empty"><Star size={22}/><p>把關注的股票放在一起。</p><span>{API_AVAILABLE?'在個股頁點擊星號，建立自選清單。':'連接資料服務後，即可儲存自選清單。'}</span></div>}
              </div>
              <div className="list-footnote">大型美股及常見 ETF</div>
            </aside>

            <div className="research-column">
              <section className="panel quote-panel" aria-label={`${selected} 行情與圖表`}>
                <div className="quote-heading">
                  <div className="company-icon" aria-hidden="true">{selected.slice(0,1)}</div>
                  <div className="company-name"><div><h2>{selected}</h2><span className="badge">US</span><button className={`star-button ${watchlist.includes(selected)?'starred':''}`} onClick={toggleWatch} disabled={!API_AVAILABLE} aria-label={watchlist.includes(selected)?'移除自選':'加入自選'} aria-pressed={watchlist.includes(selected)}><Star size={18} fill={watchlist.includes(selected)?'currentColor':'none'}/></button></div><p>{quote?.name??UNIVERSE.find(x=>x.symbol===selected)?.name??selected}</p></div>
                  <div className="quote-market-status"><span className={`status-dot ${!publicChart&&quote?.session==='regular'?'online':''}`}/>{publicChart?'TradingView':quote?sessionNames[quote.session]:'行情連接中'}</div>
                </div>
                <div className="chart-source-control"><label>圖表來源<select aria-label="圖表來源" value={publicChart?'public':'api'} onChange={event=>setChartSource(event.target.value as 'public'|'api')}><option value="public">互動行情圖（TradingView）</option><option value="api" disabled={!API_AVAILABLE}>研究資料圖（Yahoo Finance）</option></select></label></div>
                {!publicChart&&<><div className="price-heading"><strong>{quote?quote.price.toFixed(2):'—'}<small>USD</small></strong><span className={!quote?'muted':quote.changePercent!==null&&quote.changePercent<0?'down':'up'}>{quote?.change!==null&&quote?`${quote.change>=0?'+':''}${quote.change.toFixed(2)}`:'—'} <b>{quote?pct(quote.changePercent):''}</b></span><button className="icon-button" aria-label="重新整理行情" onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={16}/></button></div>
                <div className="quote-facts">{[['開盤',latest?.open],['最高',latest?.high],['最低',latest?.low],['前收',quote?.previousClose]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{typeof value==='number'?value.toFixed(2):'—'}</strong></div>)}<div><span>成交量 · 所選 K 線</span><strong>{latest&&!latest.volumeMissing?compact(latest.volume):'—'}</strong></div></div>
                {quoteErrors[selected]&&<div className="quote-error" role="status"><Activity size={14}/><span>{quoteErrors[selected]}{quote&&' 保留先前報價，請留意時間。'}</span></div>}</>}
                <div className="chart-period-heading">每根 K 線代表多久？</div><div className="chart-toolbar"><div className="range-tabs" aria-label="K線週期">{(['D','5D','W','M'] as const).map(value=><button key={value} className={candlePeriod===value?'active':''} aria-pressed={candlePeriod===value} onClick={()=>setCandlePeriod(value)}>{CANDLE_PERIODS[value]}</button>)}</div><div className="chart-tools">{!publicChart&&<><span><i className="legend-dot amber-bg"/>MA20</span><span><i className="legend-dot blue-bg"/>MA50</span></>}<span><BarChart3 size={14}/>K 線</span></div></div>
                {publicChart?<PublicMarketChart symbol={selected} period={candlePeriod}/>:<>
                {chartError&&<div className="quote-error" role="status">K 線更新失敗：{chartError} {activeChart?'保留上次圖表，請留意資料時間。':'尚無可用圖表。'}</div>}
                <StockChart key={`${selected}-${candlePeriod}`} bars={rawBars} symbol={selected} candlePeriod={candlePeriod}/>
                <div className="chart-footer"><span>MA20 <b className="amber">{tech.ma20?.toFixed(2)??'—'}</b></span><span>MA50 <b className="blue">{tech.ma50?.toFixed(2)??'—'}</b></span><span>RSI(14) <b>{tech.rsi14?.toFixed(1)??'—'}</b></span><span className="chart-source">{activeChart?.source??'Yahoo Finance'} · K 線 {bars.at(-1)?new Date(bars.at(-1)!.time*1000).toLocaleString('zh-HK'):'尚無資料'}</span></div>
                <p className="data-freshness">報價時間 {quote?new Date(quote.timestamp*1000).toLocaleString('zh-HK'):'—'} · 來源延遲 {quote?.exchangeDelayMinutes!==null&&quote?.exchangeDelayMinutes!==undefined?`${quote.exchangeDelayMinutes} 分鐘`:'未提供'}{stale?' · 報價時間較早':''}。每 5 秒檢查更新；盤前／盤後及最新一根 K 線可能未完成，來源不保證交易所即時行情。</p>
                </>}
              </section>
              <MarketLesson symbol={selected}/>
              <AnalysisPanel symbol={selected} horizon={horizon} risk={risk} setHorizon={setHorizon} setRisk={setRisk} online={bridge.online} enabled={bridge.enabled} job={currentJob} analyze={analyze} busy={busy} error={analysisError} settings={settings} reload={()=>loadResearch(true)} pendingJob={pendingJob} cancel={cancelJob} cancellingId={cancellingId}/>
            </div>


          </div>
        </>}

        {page==='reports'&&<ReportsView jobs={jobs} select={select} cancel={cancelJob}/>}
        <footer className="footer"><a className="footer-brand" href="#" onClick={event=>{event.preventDefault();setPage('market')}}><Compass size={20}/>Northstar</a><span>美股教學研究 · 不執行券商交易</span><span>公開資料來源 · 請留意數據時間</span></footer>
      </div>
    </main>
  </div>;
}
