import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowUpRight, BarChart3, ChevronRight, CircleHelp, Clock3, Compass, Database, FileText, LayoutDashboard, ListFilter, Menu, Plus, RefreshCw, Search, Settings2, Sparkles, Star, Wallet, X } from 'lucide-react';
import type { AnalysisJob, Horizon, LedgerKind, Portfolio, Quote, Risk } from '../shared/types';
import { UNIVERSE } from '../shared/types';
import { technicals } from '../shared/indicators';
import { api, post } from './api';
import StockChart from './StockChart';
import AnalysisPanel from './AnalysisPanel';
import PortfolioView from './PortfolioView';
import TransactionModal from './TransactionModal';

const usd=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const pct=(n:number|null)=>n===null?'—':`${n>=0?'+':''}${n.toFixed(2)}%`;
const compact=(n:number)=>Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n);
const sessionNames={pre:'盤前交易',regular:'正常交易',post:'盤後交易',closed:'已休市',unknown:'時段待確認'};
const horizons={short:'短線',swing:'波段',long:'長期'};
type Page='market'|'portfolio'|'reports'|'connection';

export default function App() {
  const [page,setPage]=useState<Page>('market');
  const [selected,setSelected]=useState('AAPL');
  const [range,setRange]=useState('1D');
  const [query,setQuery]=useState('');
  const [searchOpen,setSearchOpen]=useState(false);
  const [listMode,setListMode]=useState<'popular'|'watchlist'|'etf'>('popular');
  const [quotes,setQuotes]=useState<Record<string,Quote>>({});
  const [quoteErrors,setQuoteErrors]=useState<Record<string,string>>({});
  const [chart,setChart]=useState<Quote|null>(null);
  const [portfolio,setPortfolio]=useState<Portfolio|null>(null);
  const [accountChecked,setAccountChecked]=useState(false);
  const [watchlist,setWatchlist]=useState<string[]>([]);
  const [jobs,setJobs]=useState<AnalysisJob[]>([]);
  const [bridge,setBridge]=useState({enabled:false,online:false,lastSeen:null as string|null});
  const [serviceError,setServiceError]=useState('');
  const [analysisError,setAnalysisError]=useState('');
  const [horizon,setHorizon]=useState<Horizon>('swing');
  const [risk,setRisk]=useState<Risk>('balanced');
  const [busy,setBusy]=useState(false);
  const [modal,setModal]=useState<LedgerKind|null>(null);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [clock,setClock]=useState(Date.now());
  const [refresh,setRefresh]=useState(0);

  const displayed=useMemo(()=>listMode==='watchlist'?watchlist:listMode==='etf'?UNIVERSE.filter(x=>x.sector==='ETF').map(x=>x.symbol):UNIVERSE.slice(0,8).map(x=>x.symbol),[listMode,watchlist]);
  const symbols=useMemo(()=>[...new Set([...displayed,selected,'SPY','QQQ','VOO','BND',...(portfolio?.positions??[]).map(p=>p.symbol)])].slice(0,40).join(','),[displayed,selected,portfolio?.positions]);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{
    if(!accountChecked)return;
    let cancelled=false,working=false;
    const controller=new AbortController();
    async function poll(){
      if(working||document.hidden)return;working=true;
      const pending=symbols.split(',');
      await Promise.allSettled(Array.from({length:3},async()=>{while(pending.length){const symbol=pending.shift()!;
        try {const q=await api<Quote>(`/quote?symbol=${encodeURIComponent(symbol)}&range=1D`,{signal:controller.signal});if(!cancelled){setQuotes(old=>({...old,[symbol]:q}));setQuoteErrors(old=>{const next={...old};delete next[symbol];return next})}}
        catch(e){if(!cancelled)setQuoteErrors(old=>({...old,[symbol]:(e as Error).message}))}
      }}));working=false;
    }
    poll();const timer=setInterval(poll,5000);document.addEventListener('visibilitychange',poll);
    return()=>{cancelled=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',poll)};
  },[symbols,refresh,accountChecked]);
  useEffect(()=>{
    if(range==='1D'){setChart(null);return;}
    const controller=new AbortController();
    setChart(null);
    api<Quote>(`/quote?symbol=${selected}&range=${range}`,{signal:controller.signal}).then(setChart).catch(()=>{});
    return()=>controller.abort();
  },[selected,range,refresh]);
  const loadAccount=useCallback(async()=>{
    try{
      const [p,w,j,b]=await Promise.all([api<Portfolio>('/portfolio'),api<string[]>('/watchlist'),api<AnalysisJob[]>('/analysis/jobs'),api<typeof bridge>('/analysis/status')]);
      setPortfolio(p);setWatchlist(w);setJobs(j);setBridge(b);setServiceError('');
    }catch(e){setServiceError((e as Error).message)}finally{setAccountChecked(true)}
  },[]);
  useEffect(()=>{loadAccount();const timer=setInterval(()=>{if(!document.hidden)loadAccount()},10000);return()=>clearInterval(timer)},[loadAccount]);

  const select=(symbol:string)=>{setSelected(symbol);setPage('market');setSearchOpen(false);setQuery('');setMobileMenu(false);setAnalysisError('')};
  const quote=quotes[selected];
  const activeChart=range==='1D'?quote:chart;
  const bars=activeChart?.bars??[];
  const tech=technicals(bars);
  const latest=bars.at(-1);
  const currentJob=jobs.find(j=>j.symbol===selected&&j.horizon===horizon&&j.risk===risk);
  const results=UNIVERSE.filter(x=>`${x.symbol} ${x.name} ${x.sector}`.toLowerCase().includes(query.toLowerCase())).slice(0,7);
  const stale=!!quote && ['pre','regular','post'].includes(quote.session) && clock-quote.timestamp*1000>90_000;
  const complete=!!portfolio&&portfolio.positions.every(p=>quotes[p.symbol]);
  const total=complete?portfolio.cashCents/100+portfolio.positions.reduce((sum,p)=>sum+p.quantity*quotes[p.symbol].price,0):null;

  async function toggleWatch(){
    try{const exists=watchlist.includes(selected);await api('/watchlist',{method:exists?'DELETE':'POST',body:JSON.stringify({symbol:selected})});setWatchlist(old=>exists?old.filter(x=>x!==selected):[...old,selected])}catch(e){setServiceError((e as Error).message)}
  }
  async function analyze(){
    setBusy(true);setAnalysisError('');
    try{const job=await post<AnalysisJob>('/analysis/jobs',{symbol:selected,horizon,risk});setJobs(old=>[job,...old]);await loadAccount()}
    catch(e){setAnalysisError((e as Error).message)}finally{setBusy(false)}
  }
  function searchSubmit(event:React.FormEvent){event.preventDefault();if(results.length)select(results.find(x=>x.symbol===query.toUpperCase())?.symbol??results[0].symbol)}

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'mobile-open':''}`}>
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setPage('market')}}><div className="brand-symbol"><Compass size={25}/></div><div>NORTHSTAR<span>美股研究工作台</span></div></a>
      <span className="nav-label">WORKSPACE</span>
      <nav>{([{id:'market',label:'市場工作台',icon:LayoutDashboard},{id:'portfolio',label:'我的資產',icon:Wallet},{id:'reports',label:'分析紀錄',icon:FileText}] as const).map(item=><button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={()=>{setPage(item.id);setMobileMenu(false)}}><item.icon size={18}/>{item.label}{item.id==='reports'&&jobs.length>0&&<span className="nav-count">{jobs.length}</span>}</button>)}</nav>
      <div className="sidebar-divider"/><div className="nav-label watch-heading">MARKET LIST <ListFilter size={13}/></div>
      <div className="list-tabs">{([['popular','熱門'],['watchlist','自選'],['etf','ETF']] as const).map(([id,label])=><button key={id} className={listMode===id?'active':''} onClick={()=>setListMode(id)}>{label}{id==='watchlist'&&watchlist.length>0&&` ${watchlist.length}`}</button>)}</div>
      <div className="stock-list">{displayed.map(symbol=>{const q=quotes[symbol],stock=UNIVERSE.find(x=>x.symbol===symbol);return <button key={symbol} className={`stock-row ${selected===symbol&&page==='market'?'selected':''}`} onClick={()=>select(symbol)}><div><strong>{symbol}</strong><span>{stock?.name??symbol}</span></div><div><strong>{q?q.price.toFixed(2):'—'}</strong><span className={!q?'muted':q.changePercent!==null&&q.changePercent<0?'down':'up'}>{q?pct(q.changePercent):'待更新'}</span></div></button>})}{!displayed.length&&<p className="sidebar-empty">在個股頁點擊星號，<br/>建立你的自選清單。</p>}</div>
      <div className="sidebar-bottom"><button className={`nav-item ${page==='connection'?'active':''}`} onClick={()=>setPage('connection')}><Settings2 size={17}/>連線與資料狀態</button><div className="profile"><div className="avatar">個</div><div><strong>個人投資工作區</strong><span>USD · 現金帳戶</span></div><span className="status-dot online"/></div></div>
    </aside>
    {mobileMenu&&<button className="mobile-scrim" aria-label="關閉選單" onClick={()=>setMobileMenu(false)}/>}
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu-button" aria-label="開啟選單" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><span>工作區</span><ChevronRight size={13}/><strong>{{market:'市場工作台',portfolio:'我的資產',reports:'分析紀錄',connection:'連線狀態'}[page]}</strong></div>
        <form className="search" onSubmit={searchSubmit}><Search size={16}/><input aria-label="搜尋美股與 ETF" value={query} placeholder="搜尋美股 / ETF" onFocus={()=>setSearchOpen(true)} onBlur={()=>setTimeout(()=>setSearchOpen(false),150)} onChange={e=>{setQuery(e.target.value);setSearchOpen(true)}}/><kbd>↵</kbd>{searchOpen&&query&&<div className="search-results">{results.length?results.map(s=><button type="button" key={s.symbol} onMouseDown={e=>e.preventDefault()} onClick={()=>select(s.symbol)}><strong>{s.symbol}</strong><span>{s.name}</span><small>{s.sector}</small></button>):<p>第一版支援大型美股及常見 ETF</p>}</div>}</form>
        <div className="market-clock"><Clock3 size={14}/><span>{new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false}).format(clock)}<small> NEW YORK</small></span></div><button className="icon-button help-button" aria-label="資料及連線說明" onClick={()=>setPage('connection')}><CircleHelp size={18}/></button>
      </header>
      <div className="workspace">
        {serviceError&&<div className="notice service-notice" role="status"><Database size={16}/><span>雲端帳本連線：{serviceError}</span><button onClick={loadAccount}>重試</button></div>}
        {page==='market'&&<>
          <div className="page-title market-title"><div><span className="eyebrow">MARKET OVERVIEW</span><h1>市場工作台<span className="live-label"><span className={`status-dot ${quote&&!quoteErrors[selected]&&!stale?'online':''}`}/>5 秒刷新</span></h1><p>觀察市場，追蹤機會，讓每個決定都有依據。</p></div><button className="button secondary small" onClick={()=>setModal('deposit')}><Plus size={15}/>記錄資金</button></div>
          <div className="market-cards">{[['SPY','標普 500'],['QQQ','納斯達克 100'],['VOO','美國大型股'],['BND','美國綜合債券']].map(([symbol,label])=>{const q=quotes[symbol];return <button className="market-card" key={symbol} onClick={()=>select(symbol)}><div><span>{label}</span><small>{symbol} · ETF</small></div><div className="market-card-bottom"><strong>{q?q.price.toFixed(2):'—'}</strong><span className={!q?'muted':q.changePercent!==null&&(q.changePercent??0)<0?'down':'up'}>{q?pct(q.changePercent):'等待來源'}<ArrowUpRight size={13}/></span></div><div className={`card-accent ${(q?.changePercent??0)<0?'negative':''}`}/></button>})}</div>
          <div className="market-layout"><div className="research-column"><section className="panel quote-panel">
            <div className="quote-heading"><div className="company-icon">{selected.slice(0,1)}</div><div className="company-name"><div><h2>{selected}</h2><button className={`star-button ${watchlist.includes(selected)?'starred':''}`} onClick={toggleWatch} aria-label={watchlist.includes(selected)?'移除自選':'加入自選'}><Star size={17} fill={watchlist.includes(selected)?'currentColor':'none'}/></button><span className="badge">US</span></div><p>{quote?.name??UNIVERSE.find(x=>x.symbol===selected)?.name??selected}</p></div><div className="quote-market-status"><span className={`status-dot ${quote?.session==='regular'?'online':''}`}/>{quote?sessionNames[quote.session]:'行情連接中'}</div></div>
            <div className="price-heading"><strong>{quote?quote.price.toFixed(2):'—'}<small>USD</small></strong><span className={quote?.changePercent!==null&&(quote?.changePercent??0)<0?'down':'up'}>{quote?.change!==null&&quote?`${quote.change>=0?'+':''}${quote.change.toFixed(2)}`:'—'} <b>{quote?pct(quote.changePercent):''}</b></span><button className="icon-button" aria-label="重新整理行情" onClick={()=>setRefresh(r=>r+1)}><RefreshCw size={14}/></button></div>
            <div className="quote-facts">{[['開盤',latest?.open],['最高',latest?.high],['最低',latest?.low],['前收',quote?.previousClose]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{typeof value==='number'?value.toFixed(2):'—'}</strong></div>)}<div><span>成交量 · 所選 K 線</span><strong>{latest?compact(latest.volume):'—'}</strong></div></div>
            {quoteErrors[selected]&&<div className="quote-error"><Activity size={13}/>{quoteErrors[selected]}{quote&&' 保留先前報價，請留意時間。'}</div>}
            <div className="chart-toolbar"><div className="range-tabs">{['1D','5D','1M','3M','1Y','5Y'].map(r=><button key={r} className={range===r?'active':''} onClick={()=>setRange(r)}>{r}</button>)}</div><div className="chart-tools"><span><i className="legend-dot amber-bg"/>MA20</span><span><i className="legend-dot blue-bg"/>MA50</span><span><BarChart3 size={13}/>K 線</span></div></div>
            <StockChart key={`${selected}-${range}`} bars={bars} symbol={selected}/><div className="chart-footer"><span>MA20 <b className="amber">{tech.ma20?.toFixed(2)??'—'}</b></span><span>MA50 <b className="blue">{tech.ma50?.toFixed(2)??'—'}</b></span><span>RSI(14) <b>{tech.rsi14?.toFixed(1)??'—'}</b></span><span className="chart-source">Yahoo Finance · {quote?new Date(quote.timestamp*1000).toLocaleTimeString('zh-HK',{hour12:false}):'尚無資料'}{stale?' · 報價時間較早':''}</span></div>
          </section>
          <AnalysisPanel symbol={selected} horizon={horizon} risk={risk} setHorizon={setHorizon} setRisk={setRisk} online={bridge.online} enabled={bridge.enabled} job={currentJob} analyze={analyze} busy={busy} error={analysisError} portfolio={portfolio} quotes={quotes}/>
          </div><aside className="context-column"><section className="panel account-summary"><div className="panel-heading"><h2><Wallet size={16}/>我的資產</h2><button className="icon-button" aria-label="資產總覽" onClick={()=>setPage('portfolio')}><ArrowUpRight size={16}/></button></div><div className="summary-value"><span>美元資產估值</span><strong>{total===null?'—':usd(total)}</strong></div><div className="summary-line"><span>可用現金</span><strong>{portfolio?usd(portfolio.cashCents/100):'—'}</strong></div><div className="summary-line"><span>持有股票</span><strong>{portfolio?.positions.length??'—'} <small>隻</small></strong></div><button className="button secondary full" onClick={()=>setModal('deposit')}><ArrowDownToLine size={14}/>記錄美元入金</button></section>
            <section className="panel focus-panel"><div className="panel-heading"><h2>持倉速覽</h2><span className="badge">USD</span></div>{portfolio?.positions.length?portfolio.positions.map(p=><button className="holding-mini" onClick={()=>select(p.symbol)} key={p.symbol}><div><strong>{p.symbol}</strong><span>{p.quantity} 股</span></div><div><strong>{quotes[p.symbol]?usd(p.quantity*quotes[p.symbol].price):'待行情'}</strong><span>成本 {usd(p.averageCost)}</span></div></button>):<div className="mini-empty"><div className="empty-ring"><Wallet size={23}/></div><p>你的投資組合，<br/>從第一筆紀錄開始。</p><button className="text-button" onClick={()=>setModal('opening')}>加入既有持倉<Plus size={13}/></button></div>}</section>
            <section className="research-note"><div><Sparkles size={17}/><span>RESEARCH, WITH CONTEXT</span></div><h3>價格告訴你發生什麼，<br/>研究幫你理解為什麼。</h3><p>分析將結合你的現金與持倉，讓機會與風險放在同一張圖裡。</p><button className="text-button" onClick={()=>setPage('connection')}>設定 Mac 分析端<ArrowUpRight size={13}/></button></section>
          </aside></div>
        </>}
        {page==='portfolio'&&<PortfolioView portfolio={portfolio} quotes={quotes} open={setModal} select={select}/>}
        {page==='reports'&&<><div className="page-title"><div><span className="eyebrow">RESEARCH ARCHIVE</span><h1>分析紀錄</h1><p>保留每一次判斷的時間、依據與風險。</p></div></div><section className="panel"><div className="panel-heading"><h2>最近 30 次分析</h2><span className="muted">按需執行</span></div>{jobs.length?<div className="report-list">{jobs.map(j=><button key={j.id} onClick={()=>{select(j.symbol);setHorizon(j.horizon);setRisk(j.risk)}}><div className="report-list-icon"><FileText size={20}/></div><div><strong>{j.symbol} <span>{horizons[j.horizon]}分析</span></strong><p>{j.result?.summary??j.error??(j.status==='queued'?'等待 Mac 接收工作':'分析進行中')}</p><small>{new Date(j.createdAt).toLocaleString('zh-HK')}</small></div><span className={`job-status ${j.status}`}>{{queued:'排隊中',running:'分析中',completed:'已完成',failed:'未完成'}[j.status]}</span><ChevronRight size={16}/></button>)}</div>:<div className="empty-state"><FileText size={34}/><h3>尚未有分析報告</h3><p>在個股頁選擇投資期間，按「分析」開始建立研究紀錄。</p><button className="button secondary" onClick={()=>setPage('market')}>前往市場工作台</button></div>}</section></>}
        {page==='connection'&&<><div className="page-title"><div><span className="eyebrow">CONNECTIONS</span><h1>連線與資料狀態</h1><p>清楚知道資料從哪裡來，分析在哪裡執行。</p></div></div><div className="connection-grid"><section className="panel connection-card"><Database size={24}/><h2>雲端資金帳本</h2><span className={`connection-label ${portfolio?'up':'amber'}`}>{portfolio?'已連接':'尚未連接'}</span><p>本金、持倉、入金和交易紀錄儲存在雲端。現階段依你的設定，不設登入或存取保護。</p><button className="button secondary" onClick={loadAccount}>重新檢查連線</button></section><section className="panel connection-card"><Sparkles size={24}/><h2>Mac · Codex 分析端</h2><span className={`connection-label ${bridge.online?'up':'amber'}`}>{bridge.online?'已連線':bridge.enabled?'等待 Mac 連線':'尚未設定'}</span><p>需要在你的 Mac 啟動分析連接程式。只有你按下分析後才會執行，不會自動扣用模型額度。</p><p className="muted">桌面程式的登入及訂閱是否適用，需在本機驗證。沒有將你的憑證上傳網站。</p>{bridge.lastSeen&&<small>最後連線：{new Date(bridge.lastSeen).toLocaleString('zh-HK')}</small>}</section><section className="panel connection-card"><Activity size={24}/><h2>Yahoo Finance 公開行情</h2><span className={`connection-label ${quote&&!quoteErrors[selected]?'up':'amber'}`}>{quote&&!quoteErrors[selected]?'已取得來源資料':'等待來源連接'}</span><p>目標每 5 秒刷新，包含來源可提供的盤前和盤後行情。刷新頻率不代表交易所即時授權；請以報價時間及來源延遲為準。</p><p className="muted">來源回報延遲：{quote?.exchangeDelayMinutes!==null&&quote?`${quote.exchangeDelayMinutes} 分鐘`:'未提供'}。未取得資料時不顯示模擬數值。</p></section><section className="panel connection-card"><Settings2 size={24}/><h2>富途香港交易費用</h2><span className="connection-label amber">官方費率待核對</span><p>交易帳本使用你輸入的實際成交費用。佣金、平台費、其他徵費及帳戶優惠，需要核對適用收費版本後才啟用自動估算。</p><a href="https://www.futuhk.com/support" target="_blank" rel="noreferrer" className="text-button">富途官方支援<ArrowUpRight size={14}/></a></section></div></>}
        <footer className="footer"><span><span className="status-dot"/>公開來源 · 保留數據時間</span><span>研究及手動記帳 · 不執行券商交易</span><span>NORTHSTAR <small>v0.1</small></span></footer>
      </div>
    </main>
    {modal&&<TransactionModal initial={modal} close={()=>setModal(null)} saved={setPortfolio}/>}
  </div>;
}
