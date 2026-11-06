import type { Bar, Quote } from '../shared/types';

export class MarketError extends Error { constructor(message: string, public status = 502) { super(message); } }
const RANGES: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '1m' }, '5D': { range: '5d', interval: '5m' },
  '1M': { range: '1mo', interval: '1d' }, '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' }, '5Y': { range: '5y', interval: '1wk' },
  'MAX': { range: 'max', interval: '1mo' },
};
const number = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function parseYahoo(symbol: string, range: string, data: any, now = Date.now()): Quote {
  const result = data?.chart?.result?.[0];
  if (!result?.meta) throw new MarketError('來源未提供這隻股票的有效行情。', 404);
  const meta = result.meta;
  if (meta.currency !== 'USD' || !['EQUITY', 'ETF'].includes(meta.instrumentType))
    throw new MarketError('目前只支援以美元報價的美股及 ETF。', 400);
  const q = result.indicators?.quote?.[0];
  const bars: Bar[] = (result.timestamp ?? []).flatMap((time: unknown, i: number) => {
    const values = [q?.open?.[i], q?.high?.[i], q?.low?.[i], q?.close?.[i]];
    if (!number(time) || !values.every(number)) return [];
    const [open, high, low, close] = values as number[];
    if (low <= 0 || high < Math.max(open, close) || low > Math.min(open, close)) return [];
    const volumeMissing=!number(q?.volume?.[i])||q.volume[i]<0;
    return [{ time, open, high, low, close, volume:volumeMissing?0:q.volume[i],...(volumeMissing?{volumeMissing:true}:{}) }];
  }).sort((a: Bar, b: Bar) => a.time - b.time);
  const unique = bars.filter((bar, i) => i === 0 || bar.time !== bars[i - 1].time);
  let session: Quote['session'] = 'closed';
  const periods = meta.currentTradingPeriod;
  if (!periods) session = 'unknown';
  else for (const [key, value] of Object.entries(periods) as [string, any][]) {
    if (now / 1000 >= value.start && now / 1000 < value.end && ['pre','regular','post'].includes(key)) session = key as Quote['session'];
  }
  const last = unique.at(-1);
  const extended = ['pre', 'post'].includes(session) && range === '1D' && last && last.time > meta.regularMarketTime;
  const price = extended ? last.close : meta.regularMarketPrice;
  const timestamp = extended ? last.time : meta.regularMarketTime;
  if (!number(price) || price <= 0 || !number(timestamp)) throw new MarketError('來源缺少有效價格或報價時間。');
  const previous = number(meta.previousClose) ? meta.previousClose : range === '1D' && number(meta.chartPreviousClose) ? meta.chartPreviousClose : null;
  return { symbol, name: meta.longName ?? meta.shortName ?? symbol, currency: 'USD', price,
    previousClose: previous, change: previous ? price - previous : null,
    changePercent: previous ? (price / previous - 1) * 100 : null,
    timestamp, session, source: 'Yahoo Finance', fetchedAt: new Date(now).toISOString(),
    exchangeDelayMinutes: number(meta.exchangeDataDelayedBy) ? meta.exchangeDataDelayedBy : null,
    bars: unique, range, marketCap: number(meta.marketCap) ? meta.marketCap : null,
    interval:RANGES[range]?.interval,priceBasis:'未復權 OHLC；跨拆股比較須另行核對',
    sourceUrl:`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history/` };
}

export async function fetchQuote(symbol: string, range = '1D'): Promise<Quote> {
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) throw new MarketError('股票代碼無效。', 400);
  const config = RANGES[range];
  if (!config) throw new MarketError('圖表期間無效。', 400);
  let lastError: unknown;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const url = new URL(`https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}`);
      url.search = new URLSearchParams({ ...config, includePrePost: 'true' }).toString();
      const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'NorthstarPersonalResearch/0.3' }, signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        if (response.status === 404) throw new MarketError('查不到這隻美股，請確認代碼。', 404);
        throw new MarketError(response.status === 429 ? 'Yahoo Finance 暫時限流，請稍後重試。' : `行情來源暫不可用（HTTP ${response.status}）。`);
      }
      return parseYahoo(symbol, range, await response.json());
    } catch (error) {
      if (error instanceof MarketError && error.status < 500) throw error;
      lastError = error;
    }
  }
  throw lastError instanceof MarketError ? lastError : new MarketError('無法連接公開行情來源，稍後會自動重試。');
}
