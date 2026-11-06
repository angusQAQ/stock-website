import { InputError } from '../shared/errors';
import { UNIVERSE, type AnalysisHistory, type AnalysisJob } from '../shared/types';
import { validateRiskLimits } from '../shared/risk';

export function publicJob(row: any): AnalysisJob {
  const snapshot = row.snapshot ? JSON.parse(row.snapshot) : {};
  return {
    id: row.id, symbol: row.symbol, horizon: row.horizon, risk: row.risk, status: row.status,
    result: row.result ? JSON.parse(row.result) : null, error: row.error,
    createdAt: row.created_at, updatedAt: row.updated_at, cancelledAt: row.cancelled_at ?? null,
    riskLimits: snapshot.riskLimits ? validateRiskLimits(snapshot.riskLimits) : null,
    settingsRevision: Number.isSafeInteger(snapshot.settingsRevision) ? snapshot.settingsRevision : null,
    capturedAt: typeof snapshot.capturedAt === 'string' ? snapshot.capturedAt : null,
    quoteTimestamp: typeof snapshot.quote?.timestamp === 'number' ? snapshot.quote.timestamp : null,
  };
}

export async function getAnalysisHistory(db: D1Database, params: URLSearchParams): Promise<AnalysisHistory> {
  const limitValue = params.get('limit') ?? '20';
  if (!/^[1-9]\d?$/.test(limitValue) || Number(limitValue) > 50) throw new InputError('每頁筆數須介乎 1 至 50。');
  const limit = Number(limitValue), clauses: string[] = [], values: (string | number)[] = [];
  const symbol = params.get('symbol')?.trim().toUpperCase(), horizon = params.get('horizon');
  if (symbol) {
    if (!UNIVERSE.some(stock => stock.symbol === symbol)) throw new InputError('請選擇支援的美股或 ETF。');
    clauses.push('symbol=?'); values.push(symbol);
  }
  if (horizon) {
    if (!['short','swing','long'].includes(horizon)) throw new InputError('投資期間無效。');
    clauses.push('horizon=?'); values.push(horizon);
  }
  const cursor = params.get('before');
  if (cursor) {
    let parsed: any;
    try { parsed = JSON.parse(atob(cursor)); } catch { throw new InputError('報告分頁識別碼無效，請重新載入。'); }
    if (!parsed || typeof parsed.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(parsed.createdAt) || !Number.isFinite(Date.parse(parsed.createdAt)) ||
        typeof parsed.id !== 'string' || !/^[0-9a-f-]{36}$/.test(parsed.id)) throw new InputError('報告分頁識別碼無效，請重新載入。');
    clauses.push('(created_at < ? OR (created_at = ? AND id < ?))'); values.push(parsed.createdAt, parsed.createdAt, parsed.id);
  }
  const { results } = await db.prepare(`SELECT * FROM analysis_jobs${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY created_at DESC,id DESC LIMIT ?`)
    .bind(...values, limit + 1).all<any>();
  const rows = results.slice(0, limit), last = rows.at(-1);
  return { items: rows.map(publicJob), nextCursor: results.length > limit && last ? btoa(JSON.stringify({ createdAt: last.created_at, id: last.id })) : null };
}
