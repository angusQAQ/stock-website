export type Horizon = 'month' | 'short' | 'swing' | 'long';
export const HORIZONS: Record<Horizon,string> = {month:'一個月',short:'短線',swing:'波段',long:'長期'};
export type Risk = 'conservative' | 'balanced' | 'aggressive';
export interface RiskLimits { maxPositionBps: number; riskPerTradeBps: number }
export interface RiskSettings {
  revision: number;
  updatedAt: string | null;
  profiles: Record<Risk, RiskLimits>;
}
export interface RiskSettingsInput { revision: number; profiles: Record<Risk, RiskLimits> }
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
export interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number; volumeMissing?:boolean }
export interface Quote {
  symbol: string; name: string; currency: string; price: number; previousClose: number | null;
  change: number | null; changePercent: number | null; timestamp: number;
  session: 'pre' | 'regular' | 'post' | 'closed' | 'unknown';
  source: string; fetchedAt: string; exchangeDelayMinutes: number | null;
  bars: Bar[]; range: string; marketCap: number | null;
  interval?: string; sourceUrl?: string; priceBasis?: string;
}
export type Rating = 'strong-buy' | 'moderate-buy' | 'hold' | 'moderate-sell' | 'strong-sell';
export const RATINGS: Record<Rating,string> = {'strong-buy':'強烈買入','moderate-buy':'適度買入',hold:'持有','moderate-sell':'適度賣出','strong-sell':'強烈賣出'};
export interface ResearchEvidence {
  kind:'financials'|'market'|'flows'|'insiders'|'options';
  status:'available'|'unavailable'|'not-applicable'; asOf:string|null; summary:string; sourceIndices:number[];
  metrics:{label:string;value:number;unit:string;period:string;sourceIndices:number[]}[];
}
export interface PriceMechanism {trigger:string;transmission:string;companyEffect:string;possiblePriceEffect:string;counterpoint:string}
export const FACTOR_NAMES={earnings:'公司業績','rates-jobs':'利率／非農',energy:'能源',geopolitics:'地緣政治'} as const;
export interface ResearchDriver {
  kind:keyof typeof FACTOR_NAMES;status:'available'|'unavailable';asOf:string|null;
  direction:'supportive'|'pressure'|'mixed'|'uncertain';summary:string;mechanism:PriceMechanism|null;
  sourceIndices:number[];metrics:ResearchEvidence['metrics'];
}
export interface InvestmentDecision {
  action:'consider-now'|'wait'|'avoid'|'insufficient-data';nowExplanation:string;expectedPath:string;
  waitFor:string[];entryTriggers:{condition:string;status:'pending'|'confirmed';confirmation:string;invalidation:string;sourceIndices:number[]}[];
  invalidateWhen:string[];reviewWhen:string;sourceIndices:number[];
}
export interface ResearchV2 {
  version:2; rating:Rating|null; outlook:string; plainLanguage:string; technicalSummary:string;
  newsImpact:{date:string;title:string;impact:string;sourceIndices:number[];mechanism?:{trigger:string;transmission:string;companyEffect:string;possiblePriceEffect:string;counterpoint:string}}[];
  evidence:ResearchEvidence[];
  scenarios:{case:'bull'|'base'|'bear';condition:string;outcome:string;targetPrice:number|null}[];
  conflicts:string;
  references?:ReportReferences;
  drivers?:ResearchDriver[];
  decision?:InvestmentDecision;
}
export interface ReportReferences {
  summary:number[];plainLanguage:number[];outlook:number[];technicalSummary:number[];
  reasons:number[][];risks:number[][];details:number[][];scenarios:number[][];
  entryPrice:number[];sellPrice:number[];stopLoss:number[];takeProfitPrice:number[];targetPrice:number[];
}
export interface TechnicalEvidence {
  ma20:number|null;ma50:number|null;ma200:number|null;rsi14:number|null;
  macd:number|null;macdSignal:number|null;macdHistogram:number|null;
  bollingerUpper:number|null;bollingerLower:number|null;atr14:number|null;
  support20:number|null;resistance20:number|null;relativeVolume20:number|null;cmf20:number|null;obv:number|null;
}
export interface ResearchSnapshot { chart:Quote|null; indicators:TechnicalEvidence|null; window:{start:string;end:string}; missingData:string[] }
export interface AnalysisReport {
  verdict: 'buy' | 'hold' | 'reduce' | 'avoid' | 'insufficient-data';
  summary: string; reasons: string[]; risks: string[];
  entryPrice: number | null; targetPrice: number | null; stopLoss: number | null;
  sellPrice?:number|null;takeProfitPrice?:number|null;
  details: string;
  sources: { title: string; url: string; asOf: string }[];
  missingData: string[];
  research?:ResearchV2;
}
export interface AnalysisJob {
  id: string; symbol: string; horizon: Horizon; risk: Risk;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result: AnalysisReport | null; error: string | null;
  createdAt: string; updatedAt: string;
  riskLimits?: RiskLimits | null;
  settingsRevision?: number | null;
  capturedAt?: string | null;
  quoteTimestamp?: number | null;
  cancelledAt?: string | null;
  researchSnapshot?:ResearchSnapshot|null;
}
export interface AnalysisHistory { items: AnalysisJob[]; nextCursor: string | null }
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
