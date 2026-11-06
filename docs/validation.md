# 驗證紀錄

2026-11-06 Northstar 0.3：按使用者確認直接修改網站，加入持續更新的多期間 K 線、預設 30 天研究、五級評級、新聞影響與白話解說、互動報告圖表及可追溯量化證據。詳細來源與限制見 [研究說明](research-data.md)。

- 56 項 Vitest 與 6 項 Python 標準庫測試通過。真實 SQLite 工作流程驗證新月報、不可變日線快照、新舊報告相容及不足證據不得評級；另驗證技術指標參考算式／暖身期、引用與日期／評級一致性、CLI schema 與後端一致，以及財報單季／累計／未來申報、Form 4 代碼、期權覆蓋、來源拒絕、新聞日期與 SEC 聯絡設定。
- TypeScript、一般及 GitHub Pages 子路徑正式建置、Mac bridge／資料擷取 Python 編譯、最終 Worker deploy dry run 通過。新增 Python 測試亦納入 GitHub Actions；沒有執行遠端資源建立或正式模型分析。
- Chromium 1440／768／390／320px 通過多期間更新、MAX、同一 canvas 保留、RSI／MACD 切換與顯示全部、技術及財務證據展開、歷史閱讀、資料不足及來源失敗保留圖表；沒有整頁橫向溢出、未處理 JavaScript 錯誤、金融寫入或模型請求。3M 已實際等待下一輪 5 秒更新，不是只測手動刷新。
- Pages 子路徑四種尺寸均沒有 API 請求；風險儲存、帳本寫入及分析維持停用，三入口與之前刪除項目保持一致。截圖共 10 張：四種主要尺寸、桌面／手機歷史報告、手機完整缺漏、320px 來源失敗及桌面／手機 Pages 無 API。明示測試標籤與合成行情／報告只存在本機瀏覽器攔截器，沒有加入出貨資產或正式帳本。
- 本輪 Impeccable detector 執行一次，2 warnings（繼承字型及 Helvetica Neue 宣告比對提示）與 107 advisories（5 色彩／96 字級／6 圓角）。保留使用者接受的世界及局部 token 範圍，不稱零發現；既有側車過期與展示頁 buildPath 未設定提示已記錄，未藉功能工作重寫設計系統。
- 獨立 finish reviewer 確認 10 張 required captures 有效，五段合約完整，disposition 為 ship、無 material fixes；範圍是本地功能延伸及提供狀態，不涵蓋正式行情、資料授權或法律合規認證。

實際讀取 yfinance 官方 README，並核對固定版本 OpenBB SEC provider；Investing.com 實際讀取仍被代理 CONNECT 403 拒絕。正式 API、真實 Yahoo／SEC／期權／新聞擷取及 Mac 訂閱分析仍待連接與驗證，沒有宣稱網站已接通交易所即時行情。驗證程式、截圖及 detector 結果位於被忽略的 `.local/research-v03/`、`.impeccable/review/research-v03/`；Git 推送與 Actions／Pages 線上發布結果分開判讀。

2026-11-06 Northstar 0.2 功能延伸：保留已接受的視覺方向，移除「機會與風險，一起看清楚。」區塊與「資料連線」入口／頁面，改為市場研究、我的資產、研究報告三個主要入口。新增可保存的三組風險設定、固定歷史快照、精確報告閱讀與分頁、排隊取消；詳見 [架構說明](architecture.md)。

- 42 項網站測試通過，涵蓋真實 SQLite 遷移保留舊帳本／報告、設定版本衝突、分析快照不可變、同時建立時間的穩定分頁、精確報告 ID、取消與領取競爭，以及扣費後倉位上限。TypeScript、Worker 與 GitHub Pages 子路徑建置、Worker 部署 dry run、Mac bridge Python 編譯均通過。
- 在獨立本機 Worker／D1 經 UI 驗證記帳、儲存後重整、跨視窗 409 衝突保留草稿、36 份歷史紀錄與篩選、讀取舊報告及取消尚未領取的工作。健康檢查實際回報 `version: 0.2.0`、`schemaVersion: 2`，不是以綁定存在代替 schema 驗證。
- Chromium 1440／768／390／320px 檢查通過，無整頁橫向溢出或未處理 JavaScript 錯誤。320px 的資產卡改為單欄，金額維持完整一行。Pages 未配置 API 的四種尺寸均無 API 請求、資金／設定寫入及分析維持停用，已刪區塊沒有出現。
- 鍵盤實測通過：取消後返回風險選單、調整限額開啟設定、歷史閱讀聚焦標題、返回聚焦原報告，以及載入最後一頁後聚焦第一筆新增報告，下一個 Tab 可繼續到下一筆。
- 本輪僅執行一次 Impeccable detector：2 項 warning（既有 Helvetica 常見度及對已宣告 Helvetica Neue 的字型比對提示）與 103 項 advisory（局部 token 涵蓋的色彩、字級及圓角）。保留已接受的字型與風格；不把掃描結果描述為零項發現。
- 獨立完成審查檢視所提供的 13 張有效畫面，提出最後一頁載入後焦點及兩份設計文件過期導覽描述兩項修正。兩項均完成，scoring-only 最終複核為 resolved、disposition 為 ship；該 verdict 僅涵蓋原兩項修正。

本輪本機行情來自明示的瀏覽器測試攔截，歷史報告是獨立測試資料庫的預置紀錄，模型呼叫為 0。截圖、程式及結果留在被忽略的 `.impeccable/review/workflow-v02/` 與 `.local/workflow-validation-v02/`；沒有把測試資金、報告或憑證加入部署資產。正式 API、Yahoo／富途與 Mac 訂閱分析仍未連接驗證；GitHub 推送、本機建置與線上 Actions／Pages 成功須分開判讀。

2026-11-06 Northstar 視覺改版：以白色／淺灰表面、近黑色文字、橙色操作與頂部導覽替換原有深色固定側欄；涵蓋市場、資產、報告、連線、搜尋與記帳表單。設計規範見 `../DESIGN.md`，視覺參考限制見 `northstar-redesign-brief.zh-Hant.md`。Longbridge 指定頁面仍被環境代理以 CONNECT 403 拒絕；實作是已披露的風格詮釋，未核對原站精確樣式或相似程度。

- 最終程式的 24 項網站測試、TypeScript 檢查與 Vite GitHub Pages 子路徑建置通過。
- Chromium 1440／768／390／320px 共 28 組前端狀態檢查通過：四個頁面、股票／ETF 篩選、搜尋、期間與風險選擇、記帳表單。未設定 API 時沒有 API 請求、沒有未處理 JavaScript 錯誤、沒有整頁橫向溢出；金融儲存與分析維持停用。
- 四種尺寸另以僅存在本機瀏覽器攔截器的資料驗證真實圖表元件繪製、長文報告、來源展開、倉位計算、持倉與行情／分析錯誤狀態。分析只在明確按鈕操作後送出。測試資料與報告沒有寫入正式資料庫、應用程式或部署資產，沒有執行真實模型工作。
- 八組鍵盤焦點檢查通過：1440px 及 320px 下，Escape、關閉按鈕、背景關閉及本機攔截的成功儲存，均返回各自原始觸發按鈕。320px 長表單的底部按鈕可在原生對話框內捲動到達；搜尋方向鍵與 Enter 選股通過。
- 八組主要文字／背景 token 對比為 5.00:1 至 17.24:1。Impeccable SHA-256 已核對的 engine 0.1.18 執行一次掃描，只有 Helvetica 字型常見度的提示；依 Operate 指引保留適合控制項與數字的系統無襯線字體，不將提示誤報為零項發現。
- 獨立完成審查查看 16 張有效截圖並通過所提供的視覺狀態；提出的一項對話框焦點回復問題已修正。後續 verdict 將該項評為 resolved、disposition 為 ship，範圍是該項修正；不擴張為 Longbridge 相似度或正式後端可用性的證明。

本次截圖、瀏覽器驗證程式與結果留在被忽略的 `.impeccable/review/`、`.local/northstar-redesign/`。正式 GitHub Actions／Pages 發布結果仍受網絡限制，需與本機建置成功、Git 推送成功分開判讀。

2026-11-06 Impeccable 安裝：CLI/skill 4.8.0、engine 0.1.18。官方遠端 bundle 網域被拒絕，改用官方安裝器的 IMPECCABLE_BUNDLE_PATH 支援，來源固定於 pbakaus/impeccable commit c3bb418ee38ee49a6b999b7752c1368f3123a2bd。引擎 SHA-256 與發佈的 manifest 相符，63 個 skill 檔案與上游一致，既有 41 個上游投資 skills 及工具入口保留。重跑安裝顯示 up to date。CLI 62 條規則可列出，官方 overused-font 測試 fixture 掃描回傳 13 項發現及預期 exit 2；src 掃描 exit 0 不代表已做完整設計評估。專案 hook 已註冊，客戶端信任仍由使用者核准。網站 24 項測試及正式 build 通過；19 章繁體中文手冊的桌面、390px/320px 版面及目錄連結驗證通過，另匯出 16 頁 PDF。未執行網站改版或付費模型分析。

2026-11-06 正式入口記錄：使用者提供並確認 https://angusqaq.github.io/stock-website/。雲端直接請求仍被代理以 CONNECT 403 拒絕；此網址的上線狀態屬使用者回報，非雲端獨立 HTTP 驗證。已將網址保存至 config/site.json，供後續部署和後端 origin 設定共用。

2026-11-06 GitHub Pages 目標：24 項網站測試與專案子路徑建置通過；瀏覽器驗證 `/stock-website/` 的 CSS、JavaScript、favicon、桌面／手機版面。未配置 API 時，無 API 請求、無資金寫入、分析按鈕停用，介面明確顯示後端未連接。GitHub Pages 設定／線上發佈結果尚無法讀取，因這個環境的 GitHub API 被網路政策拒絕。

2026-11-06 續行部署：使用者已選 Cloudflare；重跑網站 22 項測試及正式 build 均通過。雲端 Wrangler 回覆未登入，Cloudflare API 實際請求被代理以 CONNECT 403 拒絕；新增安全 secret 與該 API 網域的設定草稿已保存，尚待使用者填入及套用。未建立遠端資源，未取得正式網址。

本次驗證日期：2026-11-05（香港時間）。以下區分本機驗證與尚未完成的正式環境連接。

| 對象 | 結果與範圍 |
|---|---|
| 研究工具 | 五個固定 commit 的來源已安裝，41 個原生投資／資料 skills 及 1 個專案入口完整性通過 |
| 重複安裝 | 完整安裝腳本重跑成功；各 venv 的依賴一致性檢查通過 |
| Longbridge | CLI 0.31.1 以官方 release SHA-256 驗證；技術 Python 套件可匯入；未連接帳戶／行情授權 |
| TradingAgents | CLI 可用；持倉、日期、評級及訂閱 provider 代表性離線測試 109 passed；不證明真實訂閱登入與額度扣款 |
| Daily Stock Analysis | CLI、TypeScript/Vite 前端 build 通過；代表性測試 18 passed；真實本機 HTTP `/api/v1/health` 與前端均 200 |
| AI Berkshire | 財務驗算與報告稽核測試 9 + 17 passed；22 個 Codex skills 安裝完成 |
| OpenBB | SDK equity／ETF routers、CLI/API/MCP 入口可用；真實本機 API schema 回應 200，包含 1088 個 paths |
| 網站 | TypeScript、Vite 正式 build、Worker deploy dry run 通過 |
| 網站測試 | 22 passed：真實 SQLite 帳本與併發條件、來源解析、指標、API 佇列、租約及來源限制 |
| 瀏覽器 | Chromium 桌面 1440px、手機 390px；無頁面橫向溢出、無未處理 JavaScript 錯誤；手機選單與資產表操作通過 |
| 真實本機資金流程 | 透過 UI 入金 US$1,000，再買入 2 股 × US$100、費用 US$0.99；API 回應現金 US$799.01、成本 US$200.99。測試紀錄另行清理，不是使用者真實資產 |
| 圖表測試 | 用明確的測試專用行情 fixture 驗證 K 線與成交量繪製。fixture 只存在瀏覽器測試攔截，不進入正式程式、資料庫或正式價格 |
| 未連接的 Mac | 按分析正確回傳「尚未設定」，沒有建立工作或發出模型呼叫 |

尚未通過或尚未執行：正式部署、遠端 D1 資料保留、GitHub Actions 執行、Yahoo 真實行情／盤前盤後新鮮度、富途適用官方費率、Mac 安裝與真實 Codex 訂閱分析。雲端環境的 GitHub API、Yahoo、富途網域存取目前被政策拒絕；網域需求已保存為設定草稿，尚未套用。沒有關閉 TLS、checksum 或測試斷言。

最初網站 Vitest 預設探索到被忽略的第三方來源測試，因未載入各自的瀏覽器配置而失敗；已將網站測試範圍明確限定為 `tests/**/*.test.ts`。第三方工具使用自己的代表性驗證入口，沒有把那些失敗描述為第三方程式缺陷，也沒有停用任何網站斷言。
