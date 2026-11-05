import type { Bar } from './types';

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
export function technicals(bars: Bar[]) {
  const closes = bars.map(b => b.close);
  return { ma20: sma(closes, 20).at(-1) ?? null, ma50: sma(closes, 50).at(-1) ?? null,
    ma200: sma(closes, 200).at(-1) ?? null, rsi14: rsi(closes) };
}
