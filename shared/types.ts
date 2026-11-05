export type Horizon = 'short' | 'swing' | 'long';
export type Risk = 'conservative' | 'balanced' | 'aggressive';
export type LedgerKind = 'deposit' | 'withdrawal' | 'opening' | 'buy' | 'sell';
export interface LedgerInput {
  requestId: string; kind: LedgerKind; symbol?: string;
  quantity?: string; price?: string; amount?: string; fees?: string; note?: string;
}
export interface LedgerRow {
  id: number; request_id: string; kind: LedgerKind; symbol: string | null;
  quantity_units: number; price_units: number; fee_cents: number;
  cash_delta_cents: number; note: string; created_at: string;
}
export interface Position { symbol: string; quantity: number; costCents: number; averageCost: number; realizedCents: number }
export interface Portfolio { cashCents: number; positions: Position[]; realizedCents: number; depositsCents: number; ledger: LedgerRow[] }
export interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }
export interface Quote {
  symbol: string; name: string; currency: string; price: number; previousClose: number | null;
  change: number | null; changePercent: number | null; timestamp: number;
  session: 'pre' | 'regular' | 'post' | 'closed' | 'unknown';
  source: string; fetchedAt: string; exchangeDelayMinutes: number | null;
  bars: Bar[]; range: string; marketCap: number | null;
}
export interface AnalysisReport {
  verdict: 'buy' | 'hold' | 'reduce' | 'avoid' | 'insufficient-data';
  summary: string; reasons: string[]; risks: string[];
  entryPrice: number | null; targetPrice: number | null; stopLoss: number | null;
  details: string;
  sources: { title: string; url: string; asOf: string }[];
  missingData: string[];
}
export interface AnalysisJob {
  id: string; symbol: string; horizon: Horizon; risk: Risk;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result: AnalysisReport | null; error: string | null;
  createdAt: string; updatedAt: string;
}
export const UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple', sector: '科技' }, { symbol: 'MSFT', name: 'Microsoft', sector: '科技' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: '半導體' }, { symbol: 'GOOGL', name: 'Alphabet', sector: '通訊' },
  { symbol: 'AMZN', name: 'Amazon', sector: '消費' }, { symbol: 'META', name: 'Meta Platforms', sector: '通訊' },
  { symbol: 'TSLA', name: 'Tesla', sector: '汽車' }, { symbol: 'BRK-B', name: 'Berkshire Hathaway', sector: '金融' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: '金融' }, { symbol: 'V', name: 'Visa', sector: '金融' },
  { symbol: 'LLY', name: 'Eli Lilly', sector: '醫療' }, { symbol: 'COST', name: 'Costco', sector: '消費' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'ETF' }, { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF' }, { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'ETF' },
  { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', sector: 'ETF' }, { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', sector: 'ETF' },
] as const;
