import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, type IChartApi, type LogicalRange, type UTCTimestamp } from 'lightweight-charts';
import { BarChart3, Maximize2 } from 'lucide-react';
import { macdSeries, rsi, sma } from '../shared/indicators';
import type { Bar } from '../shared/types';

export default function StockChart({ bars, symbol, indicators=false }: { bars:Bar[];symbol:string;indicators?:boolean }) {
  const container=useRef<HTMLDivElement>(null),chartRef=useRef<IChartApi|null>(null);
  const update=useRef<((data:Bar[])=>void)|null>(null),visibleRange=useRef<LogicalRange|null>(null);
  const [indicator,setIndicator]=useState<'none'|'rsi'|'macd'>('none');
  const [hovered,setHovered]=useState<number|null>(null);
  const hasBars=bars.length>0;
  const current=bars.find(bar=>bar.time===hovered)??bars.at(-1);
  useEffect(()=>{
    if(!container.current||!hasBars)return;
    const styles=getComputedStyle(container.current),color=(token:string)=>styles.getPropertyValue(token).trim();
    const chart=createChart(container.current,{
      layout:{background:{type:ColorType.Solid,color:color('--panel')},textColor:color('--muted'),fontFamily:styles.fontFamily,fontSize:11},
      grid:{vertLines:{color:color('--chart-grid')},horzLines:{color:color('--chart-grid')}},
      rightPriceScale:{borderColor:color('--border'),scaleMargins:{top:0.12,bottom:0.25}},
      timeScale:{borderColor:color('--border'),timeVisible:true,secondsVisible:false},
      crosshair:{vertLine:{color:color('--muted'),labelBackgroundColor:color('--ink')},horzLine:{color:color('--muted'),labelBackgroundColor:color('--ink')}},autoSize:true,
    });
    chartRef.current=chart;
    const candles=chart.addSeries(CandlestickSeries,{upColor:color('--green'),downColor:color('--red'),borderVisible:false,wickUpColor:color('--green'),wickDownColor:color('--red')});
    const volume=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume'});
    volume.priceScale().applyOptions({scaleMargins:{top:0.83,bottom:0}});
    const averages=([20,50] as const).map(period=>({period,line:chart.addSeries(LineSeries,{color:color(period===20?'--ma20':'--ma50'),lineWidth:1,priceLineVisible:false,lastValueVisible:false})}));
    const oscillator=indicator!=='none'?chart.addSeries(LineSeries,{color:color('--blue'),lineWidth:1,priceLineVisible:false},1):null;
    const signal=indicator==='macd'?chart.addSeries(LineSeries,{color:color('--ma20'),lineWidth:1,priceLineVisible:false},1):null;
    const histogram=indicator==='macd'?chart.addSeries(HistogramSeries,{priceLineVisible:false},1):null;
    if(oscillator)chart.panes()[1].setHeight(110);
    let initialized=false;
    update.current=(data)=>{
      candles.setData(data.map(bar=>({...bar,time:bar.time as UTCTimestamp})));
      volume.setData(data.filter(bar=>!bar.volumeMissing).map(bar=>({time:bar.time as UTCTimestamp,value:bar.volume,color:`${color(bar.close>=bar.open?'--green':'--red')}38`})));
      const closes=data.map(bar=>bar.close);
      for(const {period,line} of averages){const values=sma(closes,period);line.setData(data.flatMap((bar,index)=>values[index]===null?[]:[{time:bar.time as UTCTimestamp,value:values[index]!}]))}
      if(indicator==='rsi'&&oscillator)oscillator.setData(data.flatMap((bar,index)=>{const value=rsi(closes.slice(0,index+1));return value===null?[]:[{time:bar.time as UTCTimestamp,value}]}));
      if(indicator==='macd'&&oscillator&&signal&&histogram){
        const values=macdSeries(closes);
        oscillator.setData(data.flatMap((bar,index)=>values[index].value===null?[]:[{time:bar.time as UTCTimestamp,value:values[index].value!}]));
        signal.setData(data.flatMap((bar,index)=>values[index].signal===null?[]:[{time:bar.time as UTCTimestamp,value:values[index].signal!}]));
        histogram.setData(data.flatMap((bar,index)=>{const item=values[index];if(item.value===null||item.signal===null)return [];const value=item.value-item.signal;return [{time:bar.time as UTCTimestamp,value,color:color(value>=0?'--green':'--red')}]}));
      }
      if(!initialized){if(visibleRange.current)chart.timeScale().setVisibleLogicalRange(visibleRange.current);else chart.timeScale().fitContent();initialized=true;}
    };
    chart.subscribeCrosshairMove(event=>setHovered(typeof event.time==='number'?event.time:null));
    return()=>{visibleRange.current=chart.timeScale().getVisibleLogicalRange();update.current=null;chartRef.current=null;chart.remove()};
  },[hasBars,symbol,indicator]);
  useEffect(()=>{update.current?.(bars)},[bars,indicator,hasBars,symbol]);
  return <div className={`interactive-chart ${indicators?'with-indicators':''}`}>
    {indicators&&<div className="indicator-controls"><label>副圖指標<select aria-label={`${symbol} 副圖指標`} value={indicator} onChange={event=>setIndicator(event.target.value as typeof indicator)}><option value="none">成交量</option><option value="rsi">RSI(14)</option><option value="macd">MACD(12,26,9)</option></select></label><button className="text-button" disabled={!hasBars} onClick={()=>chartRef.current?.timeScale().fitContent()}><Maximize2 size={14}/>顯示全部</button></div>}
    {current&&<output className="candle-readout" aria-live="off"><time>{new Date(current.time*1000).toLocaleString('zh-HK',{timeZone:'America/New_York'})} 紐約</time><span>開 {current.open.toFixed(2)}</span><span>高 {current.high.toFixed(2)}</span><span>低 {current.low.toFixed(2)}</span><span>收 {current.close.toFixed(2)}</span><span>量 {current.volumeMissing?'未提供':current.volume.toLocaleString('en-US')}</span></output>}
    <div className="chart-canvas" ref={container} aria-label={`${symbol} K 線及成交量圖`}>
      {!hasBars&&<div className="chart-empty"><BarChart3 size={40} strokeWidth={1}/><strong>行情接通後，趨勢一目了然。</strong><span>這裡會顯示真實 K 線與成交量，並保留資料時間。</span></div>}
    </div>
  </div>;
}
