import { InputError, normalizeLedger, portfolioFromLedger } from '../shared/portfolio';
import type { LedgerInput, LedgerRow } from '../shared/types';

export async function getPortfolio(db: D1Database) {
  const { results } = await db.prepare('SELECT * FROM ledger ORDER BY id').all<LedgerRow>();
  return portfolioFromLedger(results);
}
export async function addLedger(db: D1Database, input: LedgerInput) {
  const row = normalizeLedger(input);
  const existing = await db.prepare('SELECT * FROM ledger WHERE request_id=?').bind(row.request_id).first<LedgerRow>();
  if (existing) {
    if (Object.entries(row).some(([key, value]) => existing[key as keyof LedgerRow] !== value))
      throw new InputError('這個交易識別碼已用於不同紀錄。');
    return getPortfolio(db);
  }
  // Cash and available shares are checked in the same atomic INSERT, so two
  // simultaneous requests cannot spend the same cash or sell the same shares.
  const result = await db.prepare(`INSERT OR IGNORE INTO ledger
    (request_id,kind,symbol,quantity_units,price_units,fee_cents,cash_delta_cents,note,created_at)
    SELECT ?,?,?,?,?,?,?,?,?
    WHERE (SELECT COALESCE(SUM(cash_delta_cents),0) FROM ledger) + ? >= 0
    AND (? != 'sell' OR
      (SELECT COALESCE(SUM(CASE WHEN kind IN ('opening','buy') THEN quantity_units WHEN kind='sell' THEN -quantity_units ELSE 0 END),0)
       FROM ledger WHERE symbol=?) >= ?)`)
    .bind(row.request_id, row.kind, row.symbol, row.quantity_units, row.price_units, row.fee_cents,
      row.cash_delta_cents, row.note, new Date().toISOString(), row.cash_delta_cents, row.kind, row.symbol, row.quantity_units).run();
  if (!result.meta.changes) {
    const duplicate = await db.prepare('SELECT * FROM ledger WHERE request_id=?').bind(row.request_id).first<LedgerRow>();
    if (duplicate && Object.entries(row).every(([key,value]) => duplicate[key as keyof LedgerRow] === value)) return getPortfolio(db);
    throw new InputError(duplicate ? '這個交易識別碼已用於不同紀錄。' : '美元現金或持股不足，紀錄未儲存。');
  }
  return getPortfolio(db);
}
