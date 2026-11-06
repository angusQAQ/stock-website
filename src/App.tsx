import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, ChevronRight, Clock3, Compass, Database, FileText, LayoutDashboard, ListFilter, Plus, RefreshCw, Search, Settings2, Sparkles, Star, Wallet } from 'lucide-react';
import type { AnalysisJob, Horizon, LedgerKind, Portfolio, Quote, Risk } from '../shared/types';
import { UNIVERSE } from '../shared/types';
import { technicals } from '../shared/indicators';
import { api, post, API_AVAILABLE } from './api';
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
  const [searchIndex,setSearchIndex]=useState(0);
  const [clock,setClock]=useState(Date.now());
  const [refresh,setRefresh]=useState(0);

  useEffect(()=>{window.scrollTo(0,0)},[page]);
  const displayed=useMemo(()=>listMode==='watchlist'?watchlist:listMode==='etf'?UNIVERSE.filter(x=>x.sector==='ETF').map(x=>x.symbol):UNIVERSE.slice(0,8).map(x=>x.symbol),[listMode,watchlist]);
  const symbols=useMemo(()=>[...new Set([...displayed,selected,'SPY','QQQ','VOO','BND',...(portfolio?.positions??[]).map(p=>p.symbol)])].slice(0,40).join(','),[displayed,selected,portfolio?.positions]);
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{
    if(!accountChecked||!API_AVAILABLE)return;
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

  const select=(symbol:string)=>{setSelected(symbol);setPage('market');setSearchOpen(false);setQuery('');setAnalysisError('');window.scrollTo(0,0)};
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
  function searchSubmit(event:React.FormEvent){event.preventDefault();if(results.length)select(results[Math.min(searchIndex,results.length-1)].symbol)}

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">跳至主要內容</a>
    <header className="site-header">
      <div className="topbar">
        <a className="brand" href="#" onClick={event=>{event.preventDefault();setPage('market')}} aria-label="Northstar 首頁">
          <Compass className="brand-symbol" size={34} strokeWidth={2}/>
          <span className="brand-name">Northstar<small>美股研究平台</small></span>
        </a>
        <nav className="primary-nav" aria-label="主要導覽">
          {([{id:'market',label:'市場研究',icon:LayoutDashboard},{id:'portfolio',label:'我的資產',icon:Wallet},{id:'reports',label:'研究報告',icon:FileText},{id:'connection',label:'資料連線',icon:Settings2}] as const).map(item=>
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
          <button className="button primary header-deposit" aria-label="記錄美元資金" onClick={()=>setModal('deposit')}><Plus size={18}/><span>記錄資金</span></button>
        </div>
      </div>
    </header>

    <main className="main-content" id="main-content" tabIndex={-1}>
      <div className="workspace">
        {page==='market'&&<div className="page-title market-title">
          <div><h1><span>美股研究，</span><span>心中有數。</span></h1><p>看懂行情、衡量風險，讓每個投資決定都有依據。</p></div>
          <div className="market-meta">
            <span className="live-label"><span className={`status-dot ${quote&&!stale&&!quoteErrors[selected]?'online':''}`}/>{API_AVAILABLE?'每 5 秒檢查行情':'資料服務待連接'}</span>
            <span className="market-clock"><Clock3 size={14}/>{new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false}).format(clock)}<small>紐約時間</small></span>
          </div>
        </div>}
        {serviceError&&<div className="notice service-notice" role="status">
          <Database size={17}/><span>{API_AVAILABLE?`資料服務連線：${serviceError}`:'資料服務尚未連接。行情、資金記錄及分析將在連線後開放。'}</span>
          <button className="text-button" onClick={()=>API_AVAILABLE?loadAccount():setPage('connection')}>{API_AVAILABLE?'重新連線':'查看連線'}<ArrowRight size={14}/></button>
        </div>}

        {page==='market'&&<>
          <section className="market-cards" aria-label="市場 ETF 概覽">
            {([['SPY','標普 500'],['QQQ','納斯達克 100'],['VOO','美國大型股'],['BND','美國綜合債券']] as const).map(([symbol,label])=>{const q=quotes[symbol];return <button className="market-card" key={symbol} onClick={()=>select(symbol)}>
              <div className="market-card-name"><span>{label}</span><small>{symbol}<ChevronRight size={13}/></small></div>
              <div className="market-card-bottom"><strong>{q?q.price.toFixed(2):'—'}</strong><span className={!q?'muted':q.changePercent!==null&&q.changePercent<0?'down':'up'}>{q?pct(q.changePercent):'等待行情'}</span></div>
            </button>})}
          </section>
          <div className="market-layout">
            <aside className="market-sidebar panel" aria-label="股票清單">
              <div className="panel-heading"><h2>市場清單</h2><ListFilter size={16} aria-hidden="true"/></div>
              <div className="list-tabs" aria-label="股票清單篩選">
                {([['popular','熱門'],['watchlist','自選'],['etf','ETF']] as const).map(([id,label])=><button key={id} className={listMode===id?'active':''} aria-pressed={listMode===id} onClick={()=>setListMode(id)}>{label}</button>)}
              </div>
              <div className="stock-list">
                {displayed.map(symbol=>{const q=quotes[symbol],stock=UNIVERSE.find(x=>x.symbol===symbol);return <button key={symbol} className={`stock-row ${selected===symbol?'selected':''}`} aria-pressed={selected===symbol} onClick={()=>select(symbol)}>
                  <span className="stock-identity"><strong>{symbol}</strong><span>{stock?.name??symbol}</span></span>
                  <span className="stock-quote"><strong>{q?q.price.toFixed(2):'—'}</strong><span className={!q?'muted':q.changePercent!==null&&q.changePercent<0?'down':'up'}>{q?pct(q.changePercent):'待更新'}</span></span>
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
                  <div className="quote-market-status"><span className={`status-dot ${quote?.session==='regular'?'online':''}`}/>{quote?sessionNames[quote.session]:API_AVAILABLE?'行情連接中':'待連接行情'}</div>
                </div>
                <div className="price-heading"><strong>{quote?quote.price.toFixed(2):'—'}<small>USD</small></strong><span className={!quote?'muted':quote.changePercent!==null&&quote.changePercent<0?'down':'up'}>{quote?.change!==null&&quote?`${quote.change>=0?'+':''}${quote.change.toFixed(2)}`:'—'} <b>{quote?pct(quote.changePercent):''}</b></span><button className="icon-button" aria-label="重新整理行情" onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={16}/></button></div>
                <div className="quote-facts">{[['開盤',latest?.open],['最高',latest?.high],['最低',latest?.low],['前收',quote?.previousClose]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{typeof value==='number'?value.toFixed(2):'—'}</strong></div>)}<div><span>成交量 · 所選 K 線</span><strong>{latest?compact(latest.volume):'—'}</strong></div></div>
                {quoteErrors[selected]&&<div className="quote-error" role="status"><Activity size={14}/><span>{quoteErrors[selected]}{quote&&' 保留先前報價，請留意時間。'}</span></div>}
                <div className="chart-toolbar"><div className="range-tabs" aria-label="圖表期間">{['1D','5D','1M','3M','1Y','5Y'].map(value=><button key={value} className={range===value?'active':''} aria-pressed={range===value} onClick={()=>setRange(value)}>{value}</button>)}</div><div className="chart-tools"><span><i className="legend-dot amber-bg"/>MA20</span><span><i className="legend-dot blue-bg"/>MA50</span><span><BarChart3 size={14}/>K 線</span></div></div>
                <StockChart key={`${selected}-${range}`} bars={bars} symbol={selected}/>
                <div className="chart-footer"><span>MA20 <b className="amber">{tech.ma20?.toFixed(2)??'—'}</b></span><span>MA50 <b className="blue">{tech.ma50?.toFixed(2)??'—'}</b></span><span>RSI(14) <b>{tech.rsi14?.toFixed(1)??'—'}</b></span><span className="chart-source">Yahoo Finance · {quote?new Date(quote.timestamp*1000).toLocaleTimeString('zh-HK',{hour12:false}):'尚無資料'}{stale?' · 報價時間較早':''}</span></div>
              </section>
              <AnalysisPanel symbol={selected} horizon={horizon} risk={risk} setHorizon={setHorizon} setRisk={setRisk} online={bridge.online} enabled={bridge.enabled} job={currentJob} analyze={analyze} busy={busy} error={analysisError} portfolio={portfolio} quotes={quotes}/>
            </div>

            <aside className="context-column" aria-label="資產與研究資訊">
              <section className="panel account-summary">
                <div className="panel-heading"><h2>我的美元資產</h2><button className="icon-button" aria-label="資產總覽" onClick={()=>setPage('portfolio')}><ArrowUpRight size={18}/></button></div>
                <div className="summary-value"><span>總資產估值 · USD</span><strong>{total===null?'—':usd(total)}</strong></div>
                <div className="summary-line"><span>可用現金</span><strong>{portfolio?usd(portfolio.cashCents/100):'—'}</strong></div>
                <div className="summary-line"><span>持有股票</span><strong>{portfolio?.positions.length??'—'} <small>隻</small></strong></div>
                <button className="button dark full" onClick={()=>setModal('deposit')}><ArrowDownToLine size={15}/>記錄美元入金</button>
              </section>
              <section className="panel focus-panel">
                <div className="panel-heading"><h2>持倉速覽</h2><span className="badge">USD</span></div>
                {portfolio?.positions.length?portfolio.positions.map(position=><button className="holding-mini" onClick={()=>select(position.symbol)} key={position.symbol}><span><strong>{position.symbol}</strong><small>{position.quantity} 股</small></span><span><strong>{quotes[position.symbol]?usd(position.quantity*quotes[position.symbol].price):'待行情'}</strong><small>成本 {usd(position.averageCost)}</small></span></button>):<div className="mini-empty"><Wallet size={28} strokeWidth={1.5}/><p>先記錄持倉，<br/>再看整體配置。</p><button className="text-button" onClick={()=>setModal('opening')}>加入既有持倉<Plus size={14}/></button></div>}
              </section>
              <section className="research-note"><Sparkles size={22}/><h3>機會與風險，<br/>一起看清楚。</h3><p>讓研究結合你的現金與持倉，從結論看到背後的依據。</p><button className="text-button" onClick={()=>setPage('connection')}>設定分析連線<ArrowUpRight size={15}/></button></section>
            </aside>
          </div>
        </>}

        {page==='portfolio'&&<PortfolioView portfolio={portfolio} quotes={quotes} open={setModal} select={select}/>}
        {page==='reports'&&<>
          <div className="page-title"><div><h1>每次研究，都有跡可循。</h1><p>回看分析結論、判斷依據與當時的風險。</p></div><span className="page-context">研究報告</span></div>
          <section className="panel"><div className="panel-heading"><h2>分析紀錄</h2><span className="muted">最近 30 次 · 按需執行</span></div>
            {jobs.length?<div className="report-list">{jobs.map(job=><button key={job.id} onClick={()=>{select(job.symbol);setHorizon(job.horizon);setRisk(job.risk)}}><span className="report-list-icon"><FileText size={22}/></span><span className="report-list-content"><strong>{job.symbol} <span>{horizons[job.horizon]}分析</span></strong><span>{job.result?.summary??job.error??(job.status==='queued'?'等待 Mac 接收工作':'分析進行中')}</span><small>{new Date(job.createdAt).toLocaleString('zh-HK')}</small></span><span className={`job-status ${job.status}`}>{{queued:'排隊中',running:'分析中',completed:'已完成',failed:'未完成'}[job.status]}</span><ChevronRight size={18}/></button>)}</div>:<div className="empty-state"><FileText size={36} strokeWidth={1.5}/><h3>你的第一份研究，從選股開始。</h3><p>選擇一隻股票與投資期間，再按「分析」。完成後的結論與依據會保留在這裡。</p><button className="button dark" onClick={()=>setPage('market')}>前往市場研究<ArrowRight size={16}/></button></div>}
          </section>
        </>}
        {page==='connection'&&<>
          <div className="page-title"><div><h1>知道來源，研究更踏實。</h1><p>查看行情、資金帳本及分析端的連線狀態。</p></div><span className="page-context">資料連線</span></div>
          <div className="connection-grid">
            <section className="panel connection-card"><div className="connection-heading"><Database size={23}/><span className={`connection-label ${portfolio?'up':'amber'}`}>{portfolio?'已連接':'尚未連接'}</span></div><h2>美元資金帳本</h2><p>連接雲端帳本後，儲存本金、持倉、入金與交易紀錄。目前依你的設定，不設登入或存取保護。</p><button className="button secondary" onClick={loadAccount}>重新檢查連線<RefreshCw size={15}/></button></section>
            <section className="panel connection-card"><div className="connection-heading"><Sparkles size={23}/><span className={`connection-label ${bridge.online?'up':'amber'}`}>{bridge.online?'已連線':bridge.enabled?'等待 Mac 連線':'尚未設定'}</span></div><h2>Mac · Codex 分析端</h2><p>在你的 Mac 啟動分析連接程式後，只有你按下「分析」才會執行。桌面登入及訂閱適用性需要在本機驗證。</p><p className="muted">網站不儲存桌面程式的登入憑證。</p>{bridge.lastSeen&&<small>最後連線：{new Date(bridge.lastSeen).toLocaleString('zh-HK')}</small>}</section>
            <section className="panel connection-card"><div className="connection-heading"><Activity size={23}/><span className={`connection-label ${quote&&!quoteErrors[selected]?'up':'amber'}`}>{quote&&!quoteErrors[selected]?'已取得來源資料':'等待來源連接'}</span></div><h2>Yahoo Finance 公開行情</h2><p>目標每 5 秒刷新，包含來源可提供的盤前與盤後行情。請以報價時間及來源延遲為準；刷新頻率不代表交易所即時授權。</p><p className="muted">來源回報延遲：{quote?.exchangeDelayMinutes!==null&&quote?`${quote.exchangeDelayMinutes} 分鐘`:'未提供'}。未取得資料時不顯示模擬數值。</p></section>
            <section className="panel connection-card"><div className="connection-heading"><Settings2 size={23}/><span className="connection-label amber">官方費率待核對</span></div><h2>富途香港交易費用</h2><p>帳本使用你輸入的實際成交費用。佣金、平台費、其他徵費與帳戶優惠，待核對適用的官方版本後才啟用自動估算。</p><a href="https://www.futuhk.com/support" target="_blank" rel="noreferrer" className="text-button">查看富途官方支援<ArrowUpRight size={15}/></a></section>
          </div>
        </>}
        <footer className="footer"><a className="footer-brand" href="#" onClick={event=>{event.preventDefault();setPage('market')}}><Compass size={20}/>Northstar</a><span>研究及手動記帳 · 不執行券商交易</span><span>公開資料來源 · 請留意數據時間</span></footer>
      </div>
    </main>
    {modal&&<TransactionModal initial={modal} close={()=>setModal(null)} saved={setPortfolio}/>}
  </div>;
}
