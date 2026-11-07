import { UNIVERSE } from '../shared/types';
import { CANDLE_PERIODS, type CandlePeriod } from '../shared/chart-periods';

// Resolve each supported ticker explicitly: BRK-B is BRK.B on TradingView.
const symbols:Record<string,string>={AAPL:'NASDAQ:AAPL',MSFT:'NASDAQ:MSFT',NVDA:'NASDAQ:NVDA',GOOGL:'NASDAQ:GOOGL',AMZN:'NASDAQ:AMZN',META:'NASDAQ:META',TSLA:'NASDAQ:TSLA','BRK-B':'NYSE:BRK.B',JPM:'NYSE:JPM',V:'NYSE:V',LLY:'NYSE:LLY',COST:'NASDAQ:COST',VOO:'AMEX:VOO',SPY:'AMEX:SPY',QQQ:'NASDAQ:QQQ',VTI:'AMEX:VTI',SCHD:'AMEX:SCHD',BND:'NASDAQ:BND'};
export const PUBLIC_CHART_SCRIPT='https://s3.tradingview.com/tv.js';
export const PUBLIC_OVERVIEW_SCRIPT='https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
export const PUBLIC_QUOTE_SCRIPT='https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
export function publicQuoteOptions(symbol:string){return {symbol:publicSymbol(symbol),width:'100%',colorTheme:'light',isTransparent:true,locale:'zh_TW'} as const;}
export function publicSymbol(symbol:string):string {
  if(!UNIVERSE.some(stock=>stock.symbol===symbol)||!symbols[symbol])throw new Error('這隻股票尚未設定公開圖表來源。');
  return symbols[symbol];
}
export function publicChartLink(symbol:string){return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(publicSymbol(symbol))}`;}
export function publicChartOptions(symbol:string,period:CandlePeriod,containerId:string){
  if(!(period in CANDLE_PERIODS))throw new Error('K線週期無效。');
  // `range` is a lookback window and lets the widget choose an intraday
  // resolution. Explicit `interval` controls the duration of each candle.
  return {autosize:true,symbol:publicSymbol(symbol),interval:period,timezone:'Asia/Hong_Kong',theme:'light',style:'1',locale:'zh_TW',
    enable_publishing:false,allow_symbol_change:false,withdateranges:false,hide_side_toolbar:false,save_image:false,details:true,container_id:containerId};
}
export const publicOverviewOptions={colorTheme:'light',locale:'zh_TW',isTransparent:true,showSymbolLogo:true,displayMode:'adaptive',
  symbols:[{proName:'AMEX:SPY',title:'標普 500 · SPY'},{proName:'NASDAQ:QQQ',title:'納斯達克 100 · QQQ'},{proName:'AMEX:VOO',title:'美國大型股 · VOO'},{proName:'NASDAQ:BND',title:'美國綜合債券 · BND'}]};

type ChartWidget={remove?:()=>void};
export interface PublicChartAPI { widget:new(options:Record<string,unknown>)=>ChartWidget }
declare global {interface Window {TradingView?:PublicChartAPI}}
let loading:Promise<PublicChartAPI>|null=null;
export function loadPublicChart():Promise<PublicChartAPI>{
  if(window.TradingView?.widget)return Promise.resolve(window.TradingView);
  if(loading)return loading;
  loading=new Promise<PublicChartAPI>((resolve,reject)=>{
    const script=document.createElement('script');script.src=PUBLIC_CHART_SCRIPT;script.async=true;
    let settled=false;
    const fail=()=>{if(settled)return;settled=true;clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();loading=null;reject(new Error('TradingView 圖表程式未能載入。'))};
    const timer=setTimeout(fail,20_000);
    script.onerror=fail;
    script.onload=()=>{if(settled)return;if(!window.TradingView?.widget){fail();return}settled=true;clearTimeout(timer);script.onload=null;script.onerror=null;resolve(window.TradingView)};
    document.head.appendChild(script);
  });
  return loading;
}
