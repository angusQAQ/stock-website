import type { LedgerInput, LedgerRow, Portfolio, Risk } from './types';

export class InputError extends Error {}
const SCALE = 1_000_000n;

export function fixed(value: string, decimals: number): number {
  if (typeof value !== 'string' || !new RegExp(`^\\d{1,10}(?:\\.\\d{1,${decimals}})?$`).test(value))
    throw new InputError(`請輸入有效數字，最多 ${decimals} 位小數。`);
  const [whole, fraction = ''] = value.split('.');
  return safe(BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0')));
}
function safe(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < -BigInt(Number.MAX_SAFE_INTEGER))
    throw new InputError('金額或股數超出可處理範圍。');
  return Number(value);
}
function rounded(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}
export function notionalCents(quantityUnits: number, priceUnits: number): number {
  return safe(rounded(BigInt(quantityUnits) * BigInt(priceUnits), 10_000_000_000n));
}
export type NewLedgerRow = Omit<LedgerRow, 'id' | 'created_at'>;

export function normalizeLedger(input: LedgerInput): NewLedgerRow {
  if (!input || typeof input !== 'object' || typeof input.requestId !== 'string') throw new InputError('交易資料不完整。');
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(input.requestId)) throw new InputError('交易識別碼無效。');
  if (!['deposit', 'withdrawal', 'opening', 'buy', 'sell'].includes(input.kind)) throw new InputError('交易類型無效。');
  const row: NewLedgerRow = {
    request_id: input.requestId, kind: input.kind, symbol: null, quantity_units: 0,
    price_units: 0, fee_cents: 0, cash_delta_cents: 0, note: typeof input.note === 'string' ? input.note.trim() : '',
  };
  if (row.note.length > 200) throw new InputError('備註最多 200 字。');
  if (input.kind === 'deposit' || input.kind === 'withdrawal') {
    const amount = fixed(input.amount ?? '', 2);
    if (amount <= 0) throw new InputError('入金／出金金額須大於零。');
    row.cash_delta_cents = input.kind === 'deposit' ? amount : -amount;
    return row;
  }
  const symbol = typeof input.symbol === 'string' ? input.symbol.trim().toUpperCase() : '';
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) throw new InputError('請輸入有效美股代碼。');
  row.symbol = symbol;
  row.quantity_units = fixed(input.quantity ?? '', 6);
  row.price_units = fixed(input.price ?? '', 6);
  if (row.quantity_units <= 0 || row.price_units <= 0) throw new InputError('股數與價格須大於零。');
  row.fee_cents = fixed(input.fees ?? '0', 2);
  const total = notionalCents(row.quantity_units, row.price_units);
  if (total <= 0) throw new InputError('交易金額須至少 US$0.01。');
  if (input.kind === 'opening') {
    if (row.fee_cents !== 0) throw new InputError('既有持倉以已含費用的平均成本記錄，不另扣費。');
  } else {
    row.cash_delta_cents = input.kind === 'buy' ? -total - row.fee_cents : total - row.fee_cents;
    if (input.kind === 'sell' && row.cash_delta_cents < 0) throw new InputError('賣出費用不可超過成交金額。');
  }
  return row;
}

export function portfolioFromLedger(ledger: LedgerRow[]): Portfolio {
  let cash = 0n;
  let realized = 0n;
  let deposits = 0n;
  const positions = new Map<string, { quantity: bigint; cost: bigint; realized: bigint }>();
  for (const row of ledger) {
    cash += BigInt(row.cash_delta_cents);
    if (cash < 0n) throw new InputError('美元現金不足，不能使用借貸完成交易。');
    if (row.kind === 'deposit' || row.kind === 'withdrawal') {
      deposits += BigInt(row.cash_delta_cents);
      continue;
    }
    const symbol = row.symbol!;
    const p = positions.get(symbol) ?? { quantity: 0n, cost: 0n, realized: 0n };
    const quantity = BigInt(row.quantity_units);
    if (row.kind === 'sell') {
      if (quantity > p.quantity) throw new InputError(`${symbol} 持股不足，不能做空。`);
      const cost = quantity === p.quantity ? p.cost : rounded(p.cost * quantity, p.quantity);
      const gain = BigInt(row.cash_delta_cents) - cost;
      p.quantity -= quantity; p.cost -= cost; p.realized += gain; realized += gain;
    } else {
      p.quantity += quantity;
      p.cost += BigInt(notionalCents(row.quantity_units, row.price_units) + row.fee_cents);
    }
    positions.set(symbol, p);
  }
  return {
    cashCents: safe(cash), realizedCents: safe(realized), depositsCents: safe(deposits), ledger,
    positions: [...positions].filter(([, p]) => p.quantity > 0n).map(([symbol, p]) => ({
      symbol, quantity: Number(p.quantity) / Number(SCALE), costCents: safe(p.cost),
      averageCost: Number(p.cost * SCALE) / Number(p.quantity) / 100, realizedCents: safe(p.realized),
    })),
  };
}

export const RISK_PROFILES: Record<Risk, { label: string; maxPosition: number; riskPerTrade: number }> = {
  conservative: { label: '保守', maxPosition: 0.10, riskPerTrade: 0.005 },
  balanced: { label: '平衡', maxPosition: 0.15, riskPerTrade: 0.01 },
  aggressive: { label: '進取', maxPosition: 0.25, riskPerTrade: 0.02 },
};

export function positionSizing(input: { cash: number; equity: number; existingValue: number;
  entry: number; stopLoss: number; fees: number; risk: Risk }) {
  const { cash, equity, existingValue, entry, stopLoss, fees, risk } = input;
  if (![cash, equity, existingValue, entry, stopLoss, fees].every(Number.isFinite) || cash < 0 || equity <= 0 ||
      existingValue < 0 || entry <= 0 || stopLoss <= 0 || stopLoss >= entry || fees < 0)
    throw new InputError('完整資產估值、有效買入價及低於買入價的止損價，才能計算倉位。');
  const profile = RISK_PROFILES[risk];
  const budget = Math.max(0, Math.min(cash - fees, equity * profile.maxPosition - existingValue));
  const riskBudget = Math.max(0, equity * profile.riskPerTrade - fees);
  const shares = Math.max(0, Math.floor(Math.min(budget / entry, riskBudget / (entry - stopLoss))));
  return { shares, amount: shares * entry, fees, riskAmount: shares * (entry - stopLoss) + fees,
    positionPercent: (existingValue + shares * entry) / equity * 100,
    maxPositionPercent: profile.maxPosition * 100, riskPercent: profile.riskPerTrade * 100 };
}
