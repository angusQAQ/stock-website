import type { AnalysisReport } from '../shared/types';
export default function Citations({indices,report}:{indices?:number[];report:AnalysisReport}){
  return <sup className="citations">{[...new Set(indices??[])].map(index=>{
    const source=report.sources[index];if(!source||!source.url.startsWith('https://'))return null;
    return <a key={index} href={source.url} target="_blank" rel="noreferrer" title={`${source.title} · ${source.asOf}`} aria-label={`註腳 ${index+1}：${source.title}`}>[{index+1}]</a>;
  })}</sup>;
}
