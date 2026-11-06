import { InputError, normalizeLedger, portfolioFromLedger } from '../shared/portfolio';
import type { LedgerInput, LedgerRow, RiskSettings } from '../shared/types';
import { initialRiskSettings, parseRiskSettings } from '../shared/risk';

export async function getRiskSettings(db: D1Database): Promise<RiskSettings> {
  const row = await db.prepare('SELECT profiles,revision,updated_at FROM research_settings WHERE id=1')
    .first<{ profiles: string; revision: number; updated_at: string }>();
  if (!row) return initialRiskSettings();
  const parsed = parseRiskSettings({ revision: row.revision, profiles: JSON.parse(row.profiles) });
  return { ...parsed, updatedAt: row.updated_at };
}
export async function saveRiskSettings(db: D1Database, input: unknown): Promise<RiskSettings | null> {
  const value = parseRiskSettings(input), now = new Date().toISOString();
  // Compare the revision in the atomic write; concurrent browser tabs cannot
  // silently replace each other's investment limits.
  const result = await db.prepare(`INSERT INTO research_settings(id,profiles,revision,updated_at)
    SELECT 1,?,1,? WHERE ?=0 OR EXISTS(SELECT 1 FROM research_settings WHERE id=1 AND revision=?)
    ON CONFLICT(id) DO UPDATE SET profiles=excluded.profiles,revision=research_settings.revision+1,updated_at=excluded.updated_at
    WHERE research_settings.revision=?`)
    .bind(JSON.stringify(value.profiles), now, value.revision, value.revision, value.revision).run();
  return result.meta.changes ? getRiskSettings(db) : null;
}

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
