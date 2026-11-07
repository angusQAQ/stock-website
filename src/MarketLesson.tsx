import { useState } from 'react';

const factors=[
  {name:'公司業績',steps:['公司公布營收、盈利、現金流或未來指引。','投資者調整對公司未來賺錢能力的預期。','盈利預期和願意支付的估值可能改變。','股價可能上升，也可能因「不及原先預期」而下跌。'],counter:'好業績不保證股價上漲；還要比較市場原先預期，以及消息是否早已反映。',watch:'看同一財務期間的收入、利潤、現金流及管理層指引，避免把單季與全年數字混在一起。',sources:[['SEC 公司申報','https://www.sec.gov/search-filings']]},
  {name:'利率與非農',steps:['美國公布就業人數、薪資、失業率等資料。','市場重新估計經濟需求與未來利率走向。','較高利率可能壓低遠期盈利的現值；較強需求也可能幫助公司收入。','兩種力量可能互相抵消，不能直接把「就業強」等同「股價跌」。'],counter:'要一起看數據修訂、薪資及失業率，也要看公司對利率和需求的敏感程度。',watch:'比較實際發布值、可靠的市場預期及發布時間；同時觀察債券收益率的反應。',sources:[['BLS 就業報告','https://www.bls.gov/news.release/empsit.nr0.htm'],['聯儲局貨幣政策','https://www.federalreserve.gov/monetarypolicy.htm']]},
  {name:'能源成本',steps:['原油、天然氣或電力價格出現變化。','企業的生產、運輸成本，或能源銷售收入受到影響。','航空、製造與能源生產商的盈利方向可能不同。','股價反應取決於成本能否轉嫁、需求及避險安排。'],counter:'油價上升未必利好所有能源公司，也未必令所有用能企業股價下跌。',watch:'查看公司成本結構、售價能力，以及能源價格變化是否持續。',sources:[['美國能源資訊署','https://www.eia.gov/']]},
  {name:'地緣政治',steps:['關稅、制裁、衝突或航運限制等事件發生。','供應鏈、銷售市場、成本或不確定性可能改變。','公司盈利預期與投資者要求的風險補償受到影響。','股價可能調整，但影響大小須看公司的實際曝險。'],counter:'同一天也可能有財報或利率消息；事件與跌價同時出現，仍不足以證明單一因果。',watch:'先找原始公告，再核對公司的營收地區、供應商與替代方案。',sources:[['SEC 公司風險披露','https://www.sec.gov/search-filings']]},
  {name:'情緒與成交量',steps:['投資者的風險偏好與買賣意願改變。','短期買盤和賣盤的積極程度可能不平衡。','價格與成交量可能先於公司財務數字變動。','放量可能伴隨上漲或下跌，必須連同價格及事件一起觀察。'],counter:'成交量不是機構淨流入；情緒熱度也不保證趨勢會繼續。',watch:'比較相同週期的成交量；不要把未完成交易日與整日成交量直接比較。',sources:[['Investor.gov 股票知識','https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks']]},
  {name:'K線與指標',steps:['先選每根 K 線代表一天、五個交易日、一週或一個月。','每根 K 線濃縮該段時間的開盤、最高、最低與收盤價。','均線、RSI、MACD 把價格資料整理成不同觀察角度。','它們幫助描述走勢，仍須用新聞、財報與反證檢查解釋。'],counter:'技術指標常由同一組價格計算，幾個指標同向不一定等於多份獨立證據。',watch:'均線看平均與方向，RSI 看近期漲跌力度，MACD 看兩條均線的相對變化；都會落後或失準。',sources:[['Investor.gov 投資基礎','https://www.investor.gov/introduction-investing/investing-basics']]},
];
export default function MarketLesson({symbol}:{symbol:string}){
  const [selected,setSelected]=useState(0),factor=factors[selected];
  return <section className="panel market-lesson" aria-label="互動市場教學">
    <div className="panel-heading"><h2>股價為甚麼會變？</h2></div>
    <div className="lesson-body"><p className="lesson-caption">用 {symbol} 練習思考。以下是通用機制示意，並非這隻股票的最新事件。</p>
      <div className="lesson-tabs" aria-label="選擇市場因素">{factors.map((item,index)=><button key={item.name} aria-pressed={selected===index} className={selected===index?'active':''} onClick={()=>setSelected(index)}>{item.name}</button>)}</div>
      <div className="lesson-explanation" aria-live="polite"><h3>{factor.name}如何傳到股價？</h3><ol className="causal-chain">{factor.steps.map((step,index)=><li key={index}><small>{['先發生甚麼','如何傳導','影響甚麼','價格可能反應'][index]}</small><p>{step}</p></li>)}</ol>
        <p><strong>也可能有不同走法：</strong>{factor.counter}</p><p><strong>下一步看甚麼：</strong>{factor.watch}</p>
        <div className="lesson-sources">延伸閱讀：{factor.sources.map(([title,url],index)=><a key={url} href={url} target="_blank" rel="noreferrer">[{index+1}] {title}</a>)}</div>
      </div>
    </div>
  </section>;
}
