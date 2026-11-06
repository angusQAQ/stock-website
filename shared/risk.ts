import { InputError } from './errors';
import type { Risk, RiskLimits, RiskSettings, RiskSettingsInput } from './types';

export const RISK_NAMES: Record<Risk, string> = { conservative: '保守', balanced: '平衡', aggressive: '進取' };
export const RISK_ORDER: Risk[] = ['conservative', 'balanced', 'aggressive'];
// Initial proposals, not a user-approved investment policy. One basis point is 0.01%.
export const DEFAULT_LIMITS: Record<Risk, RiskLimits> = {
  conservative: { maxPositionBps: 1000, riskPerTradeBps: 50 },
  balanced: { maxPositionBps: 1500, riskPerTradeBps: 100 },
  aggressive: { maxPositionBps: 2500, riskPerTradeBps: 200 },
};
export function initialRiskSettings(): RiskSettings {
  return { revision: 0, updatedAt: null, profiles: structuredClone(DEFAULT_LIMITS) };
}
export function validateRiskLimits(input: unknown): RiskLimits {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('風險限額格式無效。');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).sort().join(',') !== 'maxPositionBps,riskPerTradeBps') throw new InputError('風險限額欄位不完整。');
  const { maxPositionBps, riskPerTradeBps } = value;
  if (![maxPositionBps, riskPerTradeBps].every(n => typeof n === 'number' && Number.isSafeInteger(n) && n >= 1 && n <= 10000))
    throw new InputError('倉位與每筆風險須介乎 0.01% 至 100%，最多兩位小數。');
  if ((riskPerTradeBps as number) > (maxPositionBps as number)) throw new InputError('每筆風險上限不可高於單股倉位上限。');
  return { maxPositionBps: maxPositionBps as number, riskPerTradeBps: riskPerTradeBps as number };
}
export function parseRiskSettings(input: unknown): RiskSettingsInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('風險設定格式無效。');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).sort().join(',') !== 'profiles,revision' || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0)
    throw new InputError('風險設定版本或欄位無效，請重新載入。');
  const profiles = value.profiles as Record<string, unknown>;
  if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles) || Object.keys(profiles).sort().join(',') !== 'aggressive,balanced,conservative')
    throw new InputError('請完整提供保守、平衡與進取三組設定。');
  const parsed = Object.fromEntries(RISK_ORDER.map(risk => [risk, validateRiskLimits(profiles[risk])])) as Record<Risk, RiskLimits>;
  for (let index = 1; index < RISK_ORDER.length; index++) {
    const lower = parsed[RISK_ORDER[index-1]], higher = parsed[RISK_ORDER[index]];
    if (lower.maxPositionBps > higher.maxPositionBps || lower.riskPerTradeBps > higher.riskPerTradeBps)
      throw new InputError('保守、平衡、進取的限額須依序相同或遞增。');
  }
  return { revision: value.revision as number, profiles: parsed };
}
export const percent = (bps: number) => `${(bps / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
