import { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, type UTCTimestamp } from 'lightweight-charts';
import { BarChart3 } from 'lucide-react';
import { sma } from '../shared/indicators';
import type { Bar } from '../shared/types';

export default function StockChart({ bars, symbol }: { bars: Bar[]; symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current || !bars.length) return;
    const styles = getComputedStyle(container.current);
    const color = (token: string) => styles.getPropertyValue(token).trim();
    const chart = createChart(container.current, {
      layout: { background: { type: ColorType.Solid, color: color('--panel') }, textColor: color('--muted'), fontFamily: styles.fontFamily, fontSize: 11 },
      grid: { vertLines: { color: color('--chart-grid') }, horzLines: { color: color('--chart-grid') } },
      rightPriceScale: { borderColor: color('--border'), scaleMargins: { top: 0.12, bottom: 0.25 } },
      timeScale: { borderColor: color('--border'), timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: '#8c929a', labelBackgroundColor: color('--ink') }, horzLine: { color: '#8c929a', labelBackgroundColor: color('--ink') } },
      autoSize: true,
    });
    const candles = chart.addSeries(CandlestickSeries, { upColor: color('--green'), downColor: color('--red'), borderVisible: false, wickUpColor: color('--green'), wickDownColor: color('--red') });
    candles.setData(bars.map(b => ({ ...b, time: b.time as UTCTimestamp })));
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.83, bottom: 0 } });
    volume.setData(bars.map(b => ({ time: b.time as UTCTimestamp, value: b.volume, color: b.close >= b.open ? `${color('--green')}38` : `${color('--red')}38` })));
    for (const [period, lineColor] of [[20, color('--ma20')], [50, color('--ma50')]] as const) {
      const line = chart.addSeries(LineSeries, { color: lineColor, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      const values = sma(bars.map(b => b.close), period);
      line.setData(bars.flatMap((b, i) => values[i] === null ? [] : [{ time: b.time as UTCTimestamp, value: values[i]! }]));
    }
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [bars]);
  return <div className="chart-canvas" ref={container} aria-label={`${symbol} K 線及成交量圖`}>
    {!bars.length && <div className="chart-empty"><BarChart3 size={40} strokeWidth={1} /><strong>行情接通後，趨勢一目了然。</strong><span>這裡會顯示真實 K 線與成交量，並保留資料時間。</span></div>}
  </div>;
}
