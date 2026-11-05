import { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, type UTCTimestamp } from 'lightweight-charts';
import { BarChart3 } from 'lucide-react';
import { sma } from '../shared/indicators';
import type { Bar } from '../shared/types';

export default function StockChart({ bars, symbol }: { bars: Bar[]; symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current || !bars.length) return;
    const chart = createChart(container.current, {
      layout: { background: { type: ColorType.Solid, color: '#101620' }, textColor: '#75849b', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11 },
      grid: { vertLines: { color: '#192230' }, horzLines: { color: '#192230' } },
      rightPriceScale: { borderColor: '#243041', scaleMargins: { top: 0.12, bottom: 0.25 } },
      timeScale: { borderColor: '#243041', timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: '#6a7a92', labelBackgroundColor: '#334155' }, horzLine: { color: '#6a7a92', labelBackgroundColor: '#334155' } },
      autoSize: true,
    });
    const candles = chart.addSeries(CandlestickSeries, { upColor: '#23c69a', downColor: '#ef6473', borderVisible: false, wickUpColor: '#23c69a', wickDownColor: '#ef6473' });
    candles.setData(bars.map(b => ({ ...b, time: b.time as UTCTimestamp })));
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.83, bottom: 0 } });
    volume.setData(bars.map(b => ({ time: b.time as UTCTimestamp, value: b.volume, color: b.close >= b.open ? '#23c69a38' : '#ef647338' })));
    for (const [period, color] of [[20, '#eab96d'], [50, '#6899f2']] as const) {
      const line = chart.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const values = sma(bars.map(b => b.close), period);
      line.setData(bars.flatMap((b, i) => values[i] === null ? [] : [{ time: b.time as UTCTimestamp, value: values[i]! }]));
    }
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [bars]);
  return <div className="chart-canvas" ref={container} aria-label={`${symbol} K 線及成交量圖`}>
    {!bars.length && <div className="chart-empty"><BarChart3 size={40} strokeWidth={1} /><strong>等待行情資料</strong><span>連接來源後顯示真實 K 線與成交量</span></div>}
  </div>;
}
