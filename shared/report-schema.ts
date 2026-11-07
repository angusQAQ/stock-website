import { z } from 'zod';

const text=z.string().min(1).max(4000);
const citations=z.array(z.number().int().min(0).max(39)).max(12);
const date=z.iso.date();
const metric=z.object({label:z.string().min(1).max(120),value:z.number().finite(),unit:z.string().max(80),period:z.string().min(1).max(120),sourceIndices:citations.min(1)}).strict();
export const referenceSchema=z.object({summary:citations,plainLanguage:citations,outlook:citations,technicalSummary:citations,
  reasons:z.array(citations).max(12),risks:z.array(citations).max(12),details:z.array(citations).max(100),scenarios:z.array(citations).length(3),
  entryPrice:citations,sellPrice:citations,stopLoss:citations,takeProfitPrice:citations,targetPrice:citations}).strict();
const mechanismSchema=z.object({trigger:z.string().min(1).max(1000),transmission:z.string().min(1).max(1000),companyEffect:z.string().min(1).max(1000),possiblePriceEffect:z.string().min(1).max(1000),counterpoint:z.string().min(1).max(1000)}).strict();
const newsSchema=z.object({date,title:z.string().min(1).max(500),impact:text,sourceIndices:citations.min(1),mechanism:mechanismSchema.optional()}).strict();
export const researchSchema=z.object({
  version:z.literal(2),rating:z.enum(['strong-buy','moderate-buy','hold','moderate-sell','strong-sell']).nullable(),
  outlook:text,plainLanguage:text,technicalSummary:text,
  newsImpact:z.array(newsSchema).max(12),
  evidence:z.array(z.object({kind:z.enum(['financials','market','flows','insiders','options']),status:z.enum(['available','unavailable','not-applicable']),asOf:date.nullable(),summary:text,sourceIndices:citations,metrics:z.array(metric).max(12)}).strict()).length(5),
  scenarios:z.array(z.object({case:z.enum(['bull','base','bear']),condition:text,outcome:text,targetPrice:z.number().positive().nullable()}).strict()).length(3),
  conflicts:text,
  references:referenceSchema.optional(),
}).strict();
export const reportSchema=z.object({
  verdict:z.enum(['buy','hold','reduce','avoid','insufficient-data']),summary:z.string().min(1).max(2000),
  reasons:z.array(z.string().max(2000)).max(12),risks:z.array(z.string().max(2000)).max(12),
  entryPrice:z.number().positive().nullable(),targetPrice:z.number().positive().nullable(),stopLoss:z.number().positive().nullable(),
  sellPrice:z.number().positive().nullable().optional(),takeProfitPrice:z.number().positive().nullable().optional(),
  details:z.string().max(30000),sources:z.array(z.object({title:z.string().min(1).max(500),url:z.url().startsWith('https://'),asOf:z.string().min(1).max(100)}).strict()).max(40),
  missingData:z.array(z.string().max(1000)).max(30),research:researchSchema.optional(),
}).strict();
export const modelReportSchema=reportSchema.required().extend({research:researchSchema.extend({references:referenceSchema,newsImpact:z.array(newsSchema.required()).max(12)})});

// Cross-field checks run when ingesting a result, not merely in the model prompt.
export function validateResearchReport(report:z.infer<typeof reportSchema>,now=new Date()):string|null {
  const research=report.research;if(!research)return null;
  const today=now.toISOString().slice(0,10);
  const refs=[...research.newsImpact.flatMap(item=>item.sourceIndices),...research.evidence.flatMap(item=>[...item.sourceIndices,...item.metrics.flatMap(metric=>metric.sourceIndices)])];
  const references=research.references;
  if(references){
    for(const value of Object.values(references))for(const indices of value){if(Array.isArray(indices))refs.push(...indices);else refs.push(indices);}
    if(references.reasons.length!==report.reasons.length||references.risks.length!==report.risks.length||references.details.length!==report.details.split(/\n\s*\n/).filter(text=>text.trim()).length)return '逐段註腳與報告段落數目不一致。';
  }
  if(refs.some(index=>index>=report.sources.length))return '報告引用了不存在的資料來源。';
  if(new Set(research.evidence.map(item=>item.kind)).size!==5||new Set(research.scenarios.map(item=>item.case)).size!==3)return '報告缺少完整的證據分類或三種情境。';
  if(research.newsImpact.some(item=>item.date>today)||research.evidence.some(item=>item.asOf&&item.asOf>today))return '報告包含未來日期的已發生事件或資料。';
  if(research.evidence.some(item=>item.status==='available'&&(!item.sourceIndices.length||!item.asOf)))return '可用證據必須附資料日期及來源。';
  if(research.evidence.some(item=>item.status!=='available'&&item.metrics.length))return '缺漏或不適用的證據不可附上看似真實的數值。';
  const expected=research.rating===null?'insufficient-data':research.rating.includes('buy')?'buy':research.rating==='hold'?'hold':'reduce';
  if(report.verdict!==expected)return '評級與研究結論不一致。';
  if(research.rating===null&&(!report.missingData.length||report.entryPrice!==null||report.targetPrice!==null||report.stopLoss!==null||report.sellPrice!=null||report.takeProfitPrice!=null||research.scenarios.some(item=>item.targetPrice!==null)))return '資料不足時須列明缺漏，並保留參考價格為空。';
  if(references){
    for(const field of ['entryPrice','sellPrice','stopLoss','takeProfitPrice','targetPrice'] as const)if(report[field]!=null&&!references[field].length)return '每個建議價位都需要依據註腳。';
    if(research.rating!==null&&[references.summary,references.plainLanguage,references.outlook,references.technicalSummary,...references.reasons,...references.risks,...references.details,...references.scenarios].some(indices=>!indices.length))return '研究段落需要可點擊的來源註腳。';
  }
  return null;
}
