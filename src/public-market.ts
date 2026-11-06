import { UNIVERSE } from '../shared/types';

// Resolve each supported ticker explicitly: BRK-B is BRK.B on TradingView.
const symbols:Record<string,string>={AAPL:'NASDAQ:AAPL',MSFT:'NASDAQ:MSFT',NVDA:'NASDAQ:NVDA',GOOGL:'NASDAQ:GOOGL',AMZN:'NASDAQ:AMZN',META:'NASDAQ:META',TSLA:'NASDAQ:TSLA','BRK-B':'NYSE:BRK.B',JPM:'NYSE:JPM',V:'NYSE:V',LLY:'NYSE:LLY',COST:'NASDAQ:COST',VOO:'AMEX:VOO',SPY:'AMEX:SPY',QQQ:'NASDAQ:QQQ',VTI:'AMEX:VTI',SCHD:'AMEX:SCHD',BND:'NASDAQ:BND'};
export const PUBLIC_CHART_SCRIPT='https://s3.tradingview.com/tv.js';
export const PUBLIC_OVERVIEW_SCRIPT='https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
export function publicSymbol(symbol:string):string {
  if(!UNIVERSE.some(stock=>stock.symbol===symbol)||!symbols[symbol])throw new Error('這隻股票尚未設定公開圖表來源。');
  return symbols[symbol];
}
export function publicChartLink(symbol:string){return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(publicSymbol(symbol))}`;}
export function publicChartOptions(symbol:string,range:string,containerId:string){
  const ranges:Record<string,string>={'1D':'1D','5D':'5D','1M':'1M','3M':'3M','1Y':'12M','5Y':'60M',MAX:'ALL'};
  if(!ranges[range])throw new Error('圖表期間無效。');
  return {autosize:true,symbol:publicSymbol(symbol),range:ranges[range],timezone:'Asia/Hong_Kong',theme:'light',style:'1',locale:'zh_TW',
    enable_publishing:false,allow_symbol_change:false,withdateranges:true,hide_side_toolbar:false,save_image:false,details:true,container_id:containerId};
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
