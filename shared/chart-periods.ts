import type { Bar } from './types';
export const CANDLE_PERIODS={'1':'1分K','5':'5分K','60':'1時K',D:'日K','5D':'5日K',W:'週K',M:'月K'} as const;
export type CandlePeriod=keyof typeof CANDLE_PERIODS;
export const historyRange=(period:CandlePeriod)=>period==='M'?'MAX':period==='1'?'1D':['5','60'].includes(period)?'5D':'1Y';
const tradingDate=(time:number)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time*1000));
export function aggregateCandles(bars:Bar[],period:CandlePeriod):Bar[]{
  if(period==='D')return bars;
  const groups:Bar[][]=[];let previous='';
  bars.forEach((bar,index)=>{
    const day=tradingDate(bar.time);let key:string;
    if(period==='M')key=day.slice(0,7);
    else if(period==='W'){const date=new Date(day+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);key=date.toISOString().slice(0,10);}
    else if(period==='5D')key=String(Math.floor(index/5));
    else key=String(Math.floor(bar.time/(Number(period)*60)));
    if(key!==previous){groups.push([]);previous=key;}groups.at(-1)!.push(bar);
  });
  return groups.map(group=>({time:group[0].time,open:group[0].open,high:Math.max(...group.map(b=>b.high)),low:Math.min(...group.map(b=>b.low)),close:group.at(-1)!.close,
    volume:group.reduce((sum,b)=>sum+b.volume,0),...(group.some(b=>b.volumeMissing)?{volumeMissing:true}:{})}));
}
