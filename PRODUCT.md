# Northstar 美股研究平台

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

供使用者本人研究大型美股及常見一般 ETF。主要語言為繁體中文，使用 macOS，並需能在手機查閱。

## Product Purpose

在同一個網站查看行情、研究個股、記錄美元資金與持倉，取得與自己的本金及風險設定相關的分析。報告先呈現結論、理由與風險，再按需要展開數據。

## Positioning

個人研究工作台：使用者手動記錄美元帳本，選擇投資期間與風險設定，再明確按下「分析」。配置建議應結合現金與既有持倉；行情刷新不觸發模型分析。

## Operating Context

- 固定網站網址：https://angusqaq.github.io/stock-website/ 。後續更新沿用此網址，每次內容更新需 Git commit。
- GitHub 專案設為 Private；目前依使用者選擇不設網站登入。Private 原始碼不代表網站具有存取保護。
- 富途牛牛是使用者的交易工具；Northstar 記錄資產與提供研究，不代為下單。
- 使用者希望以 Mac 上的 Codex 桌面程式及既有訂閱執行分析。現有 CLI bridge 的本機登入、訂閱適用性及正式連線尚未驗證。

## Capabilities and Constraints

- 手動輸入可用美元、既有持倉、後續入金及交易；港元不計入美股配置現金。
- 保守／平衡／進取三組可調設定；具體限額尚未由使用者定案。
- 分析前選擇短線、波段或長期；報告提供配置金額與倉位比例的依據。
- Yahoo Finance 等公開行情為優先來源，目標每 1–5 秒刷新，包含來源可提供的盤前與盤後行情。必須顯示資料時間、時段、延遲及不可用狀態。
- 富途香港官方費率與帳戶優惠仍待核對；目前使用手動輸入的實際費用，不宣稱已自動套用官方收費。
- 不使用孖展、做空、期權、槓桿或反向 ETF，不自動執行交易。
- GitHub Pages 目前只部署前端。正式雲端 API、資金儲存、行情及 Mac 分析連線仍待部署與驗證；未接通時須清楚顯示狀態，停用不可執行的金融寫入及分析。
- 不以模擬報價、持倉、績效或報告冒充真實資料。

## Brand Commitments

- 名稱：Northstar，美股研究平台。
- 使用者於 2026-11-06 明確要求高度仿照 Longbridge 指定網站的字詞、色彩及排版，先深度分析參考，再制定藝術風格與實作。
- 綁定參考：https://longbridge.com/hk/en?channel=OWNN00060 。此要求授權替換原有視覺風格；維持證券網站的資訊密度與易讀的分析報告。
- Longbridge 目前尚未成功讀取，不能將推測的顏色、字體或版型記為已觀察事實。參考分析狀態見 `docs/northstar-redesign-brief.zh-Hant.md`。

## Evidence on Hand

- 使用者已完成的多輪需求回答，整理於 `docs/product-requirements.md`。
- 現有 React 介面、圖表、美元帳本、Worker API 與 Mac bridge 原始碼；部署及驗證限制見 `docs/deployment.md`、`docs/validation.md`。
- 已安裝 Impeccable；安裝來源與版本見 `config/impeccable-install.json`。
- 尚無可核對的 Longbridge 頁面擷取或使用者提供的參考截圖；沒有可用作宣傳的真實研究績效、用戶數或券商資格證據。

## Product Principles

1. 研究結論與風險能一起被看見，詳細證據可追溯。
2. 配置以實際美元資金與持倉為基礎，不推定借貸或自動換匯。
3. 模型工作只在使用者明確操作後執行。
4. 資料、連線與功能狀態如實呈現。
5. 視覺參考須經實際觀察；改版保留既有功能與產品限制。
