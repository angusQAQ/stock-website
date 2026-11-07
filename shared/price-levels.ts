import type { AnalysisReport } from './types';
export const PRICE_LEVELS=[{key:'entryPrice',label:'建議買入',short:'買入',token:'--green'},{key:'sellPrice',label:'建議賣出',short:'賣出',token:'--blue'},
  {key:'stopLoss',label:'止損',short:'止損',token:'--red'},{key:'takeProfitPrice',label:'止盈',short:'止盈',token:'--warning'}] as const;
export function reportPriceLevels(report:AnalysisReport){return PRICE_LEVELS.flatMap(level=>typeof report[level.key]==='number'&&Number.isFinite(report[level.key])&&report[level.key]!>0?[{...level,price:report[level.key]!}]:[]);}
export type PriceLevel=ReturnType<typeof reportPriceLevels>[number];
