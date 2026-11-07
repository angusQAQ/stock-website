import { HORIZONS, UNIVERSE, type Horizon, type Risk } from './types';
import { RISK_NAMES } from './risk';
export function learningTask(symbol:string,horizon:Horizon,risk:Risk,now=new Date()):string {
  const company=UNIVERSE.find(item=>item.symbol===symbol)?.name??symbol;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  return `請為投資新手撰寫 ${symbol}（${company}）的繁體中文教學研究報告。\n研究日期：${today}（香港日期）；期間：${HORIZONS[horizon]}${horizon==='month'?'，未來30個曆日':''}；風險偏好：${RISK_NAMES[risk]}。\n先實際搜尋並核對公開行情、近期公司／世界新聞、最新財報、利率與非農等資訊，逐項保存發布日期及來源網址。資料不足就明說，不編造數字、新聞或實時報價。\n先以一段白話解釋研究立場，再說明「事件→需求、成本或利率→公司盈利／估值→股價可能反應」，列出反向因素與其他可能解釋，不把相關性當成確定因果。\n有證據才給五級研究評級；資料不足不評級。有依據才列建議買入、建議賣出、止損、止盈四個不同用途的參考價位及理由，沒有依據填未提供。\n技術指標要解釋它觀察甚麼、限制是甚麼。每段數據及新聞分析末附可點擊的原始來源註腳。使用簡單直接的文字，原始數據放在後面。\n可參考 OpenBB 的資料整合、TradingAgents 的多空與風險檢查，以及 Daily Stock Analysis 的新聞／技術流程；不要假設工具安裝代表資料源或模型已連接。\n僅作教學研究，不下單、不發送通知、不啟用額外付費模型。不使用個人本金、持倉或資產配置，也不建議孖展、做空或期權交易。`;
}
