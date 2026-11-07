import { memo, useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { PUBLIC_QUOTE_SCRIPT, publicChartLink, publicQuoteOptions } from './public-market';

// Leave prices inside the provider's supported embed. Do not scrape iframe
// data or place credentials/CORS relays in this static Pages application.
export default memo(function PublicStockQuote({symbol}:{symbol:string}){
  const host=useRef<HTMLDivElement>(null),sourceLink=useRef<HTMLAnchorElement>(null);
  const [retry,setRetry]=useState(0),[state,setState]=useState<'loading'|'embedded'|'error'>('loading');
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let disposed=false;setState('loading');container.replaceChildren();
    const script=document.createElement('script');script.src=PUBLIC_QUOTE_SCRIPT;script.async=true;script.textContent=JSON.stringify(publicQuoteOptions(symbol));
    const timer=setTimeout(()=>{if(!disposed&&!container.querySelector('iframe'))setState('error')},25_000);
    script.onerror=()=>{if(!disposed){setState('error');clearTimeout(timer)}};
    const observer=new MutationObserver(()=>{const frame=container.querySelector('iframe');if(frame&&!disposed){frame.title=`${symbol} TradingView 現價與升跌幅`;setState('embedded');clearTimeout(timer)}});
    observer.observe(container,{childList:true,subtree:true});container.appendChild(script);
    return()=>{disposed=true;clearTimeout(timer);observer.disconnect();container.replaceChildren()};
  },[symbol,retry]);
  return <div className="public-stock-quote">
    <div className="public-stock-quote-host" ref={host}/>
    {state==='loading'&&<p className="sidebar-quote-status" role="status">正在載入現價…</p>}
    {state==='error'&&<div className="sidebar-quote-status" role="status"><span>現價未能載入</span><button className="text-button" aria-label={`重新載入 ${symbol} 現價`} onClick={()=>{setRetry(value=>value+1);sourceLink.current?.focus({preventScroll:true})}}><RefreshCw size={12}/>重試</button></div>}
    <a ref={sourceLink} className="sidebar-quote-source" href={publicChartLink(symbol)} target="_blank" rel="noreferrer">{symbol} 報價由 TradingView 提供<ExternalLink size={11}/></a>
  </div>;
});
