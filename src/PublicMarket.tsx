import { memo, useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { loadPublicChart, publicChartLink, publicChartOptions, PUBLIC_OVERVIEW_SCRIPT, publicOverviewOptions } from './public-market';
import type { CandlePeriod } from '../shared/chart-periods';

const errorText='公開行情未能載入。請重試，或在 TradingView 開啟圖表。';

export const PublicMarketChart=memo(function PublicMarketChart({symbol,period}:{symbol:string;period:CandlePeriod}){
  const id=`market-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`,host=useRef<HTMLDivElement>(null);
  const sourceRetry=useRef<HTMLButtonElement>(null);
  const [retry,setRetry]=useState(0),[state,setState]=useState<'loading'|'embedded'|'error'>('loading');
  const reload=()=>{setRetry(value=>value+1);sourceRetry.current?.focus({preventScroll:true})};
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let disposed=false,widget:{remove?:()=>void}|undefined;
    setState('loading');container.replaceChildren();
    const observer=new MutationObserver(()=>{
      const frame=container.querySelector('iframe');
      if(frame&&!disposed){frame.title=`${symbol} TradingView 互動 K 線`;setState('embedded');clearTimeout(timer)}
    });
    observer.observe(container,{childList:true,subtree:true});
    const timer=setTimeout(()=>{if(!disposed)setState('error')},25_000);
    loadPublicChart().then(api=>{
      if(disposed)return;
      try {widget=new api.widget(publicChartOptions(symbol,period,id))}catch{setState('error');clearTimeout(timer)}
    }).catch(()=>{if(!disposed){setState('error');clearTimeout(timer)}});
    return()=>{disposed=true;clearTimeout(timer);observer.disconnect();widget?.remove?.();container.replaceChildren()};
  },[id,symbol,period,retry]);
  let link='https://www.tradingview.com/markets/stocks-usa/';
  try{link=publicChartLink(symbol)}catch{/* unsupported manual holdings retain an honest source link */}
  return <div className="public-chart">
    <div className="public-chart-host" ref={host} id={id}/>
    {state==='loading'&&<p className="public-chart-status" role="status">正在向 TradingView 載入 {symbol} K 線…</p>}
    {state==='error'&&<div className="public-chart-status public-chart-error" role="alert"><p>{errorText}</p><button className="button secondary" onClick={reload}><RefreshCw size={14}/>重新載入圖表</button></div>}
    <div className="public-chart-source"><a href={link} target="_blank" rel="noreferrer">{symbol} 圖表由 TradingView 提供<ExternalLink size={13}/></a><button ref={sourceRetry} className="text-button" onClick={reload}><RefreshCw size={13}/>重新載入</button></div>
    <p className="public-source-note">一根日K代表一個交易日，月K代表一個月。價格會隨來源更新；請查看圖內的延遲與交易時段。圖內指標可自行切換，研究報告另保留當時的資料快照。</p>
  </div>;
});

export const PublicMarketOverview=memo(function PublicMarketOverview(){
  const host=useRef<HTMLDivElement>(null),[retry,setRetry]=useState(0),[state,setState]=useState<'loading'|'embedded'|'error'>('loading');
  const sourceLink=useRef<HTMLAnchorElement>(null);
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let disposed=false;setState('loading');container.replaceChildren();
    const script=document.createElement('script');script.src=PUBLIC_OVERVIEW_SCRIPT;script.async=true;script.textContent=JSON.stringify(publicOverviewOptions);
    const timer=setTimeout(()=>{if(!disposed&&!container.querySelector('iframe'))setState('error')},25_000);
    script.onerror=()=>{if(!disposed){setState('error');clearTimeout(timer)}};
    const observer=new MutationObserver(()=>{const frame=container.querySelector('iframe');if(frame&&!disposed){frame.title='TradingView 美國 ETF 行情';setState('embedded');clearTimeout(timer)}});
    observer.observe(container,{childList:true,subtree:true});container.appendChild(script);
    return()=>{disposed=true;clearTimeout(timer);observer.disconnect();container.replaceChildren()};
  },[retry]);
  return <section className="panel public-overview" aria-label="公開市場 ETF 行情">
    <div className="public-overview-host" ref={host}/>
    {state!=='embedded'&&<div className="public-overview-error" role="status"><p>{state==='error'?'ETF 行情未能載入。':'正在載入美國 ETF 行情…'}</p>{state==='error'&&<button className="text-button" onClick={()=>{setRetry(value=>value+1);sourceLink.current?.focus({preventScroll:true})}}>重新載入</button>}</div>}
    <div className="public-overview-source"><a ref={sourceLink} href="https://www.tradingview.com/markets/" target="_blank" rel="noreferrer">市場行情由 TradingView 提供<ExternalLink size={12}/></a></div>
  </section>;
});
