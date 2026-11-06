import { technicals } from '../shared/indicators';
import type { Horizon, ResearchSnapshot } from '../shared/types';
import { fetchQuote } from './market';

export async function captureResearch(symbol:string,horizon:Horizon,now=new Date()):Promise<ResearchSnapshot> {
  const days={month:30,short:7,swing:90,long:365}[horizon];
  const window={start:now.toISOString().slice(0,10),end:new Date(now.getTime()+days*86400000).toISOString().slice(0,10)};
  try {
    const chart=await fetchQuote(symbol,'1Y');
    if(!chart.bars.length)throw new Error('來源未提供日 K 線。');
    return {chart,indicators:technicals(chart.bars),window,missingData:chart.bars.length<200?['日 K 線少於 200 根，MA200 不可用。']:[]};
  }catch(error){return {chart:null,indicators:null,window,missingData:[`歷史日 K 線不可用：${(error as Error).message}`]};}
}
