import type { Bar, TechnicalEvidence } from './types';

export function sma(values: number[], period: number): (number | null)[] {
  let sum = 0;
  return values.map((value, i) => {
    sum += value;
    if (i >= period) sum -= values[i - period];
    return i + 1 >= period ? sum / period : null;
  });
}
export function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1]; gain += Math.max(d, 0); loss += Math.max(-d, 0);
  }
  gain /= period; loss /= period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  return gain === 0 && loss === 0 ? 50 : loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}
export function ema(values:number[],period:number):(number|null)[] {
  let previous:number|null=null;
  return values.map((value,index)=>{
    if(index<period-1)return null;
    previous=previous===null?values.slice(0,period).reduce((sum,n)=>sum+n,0)/period:value*2/(period+1)+previous*(1-2/(period+1));
    return previous;
  });
}
export function macdSeries(values:number[]) {
  const fast=ema(values,12),slow=ema(values,26);
  const line=values.map((_,i)=>fast[i]!==null&&slow[i]!==null?fast[i]!-slow[i]!:null);
  const signal=ema(line.filter((n):n is number=>n!==null),9);
  return line.map((value,i)=>({value,signal:i>=25?signal[i-25]??null:null}));
}
export function technicals(bars: Bar[]):TechnicalEvidence {
  const closes = bars.map(b => b.close);
  const average=sma(closes,20).at(-1)??null,tail=bars.slice(-20);
  const deviation=average===null?null:Math.sqrt(tail.reduce((sum,b)=>sum+(b.close-average)**2,0)/20);
  const macd=macdSeries(closes).at(-1);
  let atr:number|null=null;
  const ranges=bars.slice(1).map((bar,i)=>Math.max(bar.high-bar.low,Math.abs(bar.high-bars[i].close),Math.abs(bar.low-bars[i].close)));
  if(ranges.length>=14){atr=ranges.slice(0,14).reduce((sum,n)=>sum+n,0)/14;for(const value of ranges.slice(14))atr=(atr*13+value)/14;}
  const volume=tail.reduce((sum,b)=>sum+b.volume,0);
  const volumeMean=bars.length>=21&&!bars.slice(-21).some(b=>b.volumeMissing)?bars.slice(-21,-1).reduce((sum,b)=>sum+b.volume,0)/20:null;
  return { ma20: sma(closes, 20).at(-1) ?? null, ma50: sma(closes, 50).at(-1) ?? null,
    ma200: sma(closes, 200).at(-1) ?? null, rsi14: rsi(closes),
    macd:macd?.value??null,macdSignal:macd?.signal??null,macdHistogram:macd?.value!==null&&macd?.signal!==null&&macd?macd.value-macd.signal:null,
    bollingerUpper:average!==null&&deviation!==null?average+2*deviation:null,bollingerLower:average!==null&&deviation!==null?average-2*deviation:null,
    atr14:atr,support20:bars.length>=20?Math.min(...tail.map(b=>b.low)):null,resistance20:bars.length>=20?Math.max(...tail.map(b=>b.high)):null,
    relativeVolume20:volumeMean&&bars.at(-1)?bars.at(-1)!.volume/volumeMean:null,
    cmf20:bars.length>=20&&volume>0&&!tail.some(b=>b.volumeMissing)?tail.reduce((sum,b)=>sum+(b.high===b.low?0:(2*b.close-b.high-b.low)/(b.high-b.low))*b.volume,0)/volume:null,
    obv:bars.length>=2&&!bars.some(b=>b.volumeMissing)?bars.slice(1).reduce((sum,b,i)=>sum+Math.sign(b.close-bars[i].close)*b.volume,0):null };
}
