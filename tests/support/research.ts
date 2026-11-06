import type { AnalysisReport, ResearchV2 } from '../../shared/types';
export function researchReport():AnalysisReport {
  return {verdict:'insufficient-data',summary:'測試資料：AAPL 尚缺可驗證財報，暫不評級。',reasons:[],risks:['資料缺漏'],entryPrice:null,targetPrice:null,stopLoss:null,details:'僅供離線驗證。',sources:[],missingData:['當期財報未取得'],research:{
    version:2,rating:null,outlook:'未來30天尚無足夠證據建立立場。',plainLanguage:'缺少近期財報，所以即使線圖變好也不急著買入。先等資料完整，並觀察支撐是否守住。',technicalSummary:'需要日 K 線才可核對技術指標。',newsImpact:[],
    evidence:(['financials','market','flows','insiders','options'] as const).map(kind=>({kind,status:'unavailable',asOf:null,summary:'沒有可核實資料，不以零或推測替代。',sourceIndices:[],metrics:[]})),
    scenarios:(['bull','base','bear'] as const).map(item=>({case:item,condition:'需要進一步證據。',outcome:'目前無法量化。',targetPrice:null})),conflicts:'測試；未核實利益衝突。',
  } satisfies ResearchV2};
}
