# 驗證紀錄

2026-11-06 Northstar 0.3.1 公開行情接線與刪文：依使用者三則瀏覽器標註，移除市場頁宣傳大標與說明、分析區介紹；加入不依賴帳本 API 的官方公開圖表與 ETF 報價帶。見 [公開行情連接](public-market.md)。

- 實際搜尋 GitHub 並讀取 MIT 開源整合的 README／程式／授權，核對 main commit `04a3eddfc4e4278a9a904865f20ebb8673f722e7` 的圖表及 ticker tape 介面。接入的是官方免費嵌入服務，不稱為開源市場數據。
- 61 項網站測試、TypeScript、一般與 Pages 子路徑正式建置通過。新增測試涵蓋全部支援代碼的交易所映射、BRK-B、七種期間、共用載入、拒絕後重試及逾時後恢復。
- Chromium 1440／1466／790／390／320px 契約測試通過：圖表在沒有 API 時也請求官方程式、股票／期間可切換、重試不累積 iframe、每秒時鐘不重建圖表、官方程式只載入一次。1466／790／390／320px 另測來源拒絕及鍵盤重試焦點；無整頁橫向溢出、未處理 JS 錯誤、帳本 API 請求或模型呼叫。測試框架明示「沒有股價或合成 K 線」，沒有以假數據模擬實時行情。
- 真實 curl 經現有代理請求官方程式回覆 CONNECT 403；實際 Chromium 明確使用環境代理及保留 TLS 驗證，回報 `net::ERR_TUNNEL_CONNECTION_FAILED`。真實網絡結果與本機契約測試分開保存，`marketDataVerified=false`。沒有關閉 TLS 或繞過目的地主機政策。
- 本輪 detector 僅執行一次：2 warnings（既有 Helvetica 常見度及 Helvetica Neue 宣告比對提示）、104 advisories（5 色彩／95 字級／4 圓角）。保留既有風格與設計文件，不旁修先前側車過期提示，不稱零發現。
- 獨立 finish reviewer 確認十張 required captures 有效，五段合約完整，disposition 為 ship、無 material fixes；範圍僅接線、刪文、版面與錯誤／恢復。**真實價格、K 線及正式網站功能驗收仍 pending**，iframe 建立、契約模擬與這次 ship 均不證明行情已接通。已請使用者在原網址確認新版及實際 K 線結果，尚未取得回覆。

程式已推送 `437833a` 至 main；本機驗證資料位於被忽略的 `.local/market-connect/` 及 `.impeccable/review/market-connect/`。Actions／Pages 成功結果及訪客瀏覽器來源可用性尚未獨立驗證。

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


## 0.4 新手教學平台 · 2026-11-07

- 網站保留兩個入口「看懂市場／教學報告」，移除資產、入金、持倉、配置估算及右側資產欄；舊資料、遷移與 API 保留，新工作快照不讀 portfolio。
- 現有內容改為白話解釋、六種可切換市場因素及條件式因果推理；原始指標／量化證據可展開。新聞因果提供反證，通用教學不冒充最新新聞。
- 明確指定 D／5D／W／M candle interval；自有圖以實際資料聚合 OHLCV，測試曆月跨年、休市日、最後未滿組別、缺成交量，不補造 K 線。
- 新報告需要逐段註腳、四類明確價位及新聞傳導欄位；索引、段落數與證據一致性由 Worker 驗證。舊格式仍可讀；無依據不畫線、不補造止盈價。
- 原生價格軸標籤實際顯示買入／賣出／止損／止盈及 MA20／MA50／收盤，四種顏色與不同線型；文字在燭圖之外。窄螢幕先顯示較近的 K 線，可縮放或顯示全部。
- `npm test`：8 檔、68 測試通過；`npm run test:research`：6 個解析器測試通過；TypeScript、正式 Vite build、Pages 子路徑 build 及 Worker dry run 通過。沒有新增 DB migration。
- Chromium：1440、1466×730、790×730、390、320px。27 個互動畫面擷取與 4 個報告開首／價格補充擷取；無 JavaScript 錯誤、無整頁橫向溢出。確認沒有 portfolio 請求；切換教學、期間、圖表及閱讀報告不呼叫模型；只有明確按分析的已連接測試情境建立一份工作。
- Pages 未連接 API 時：分析按鈕開啟有回應的複製研究題目說明；核對焦點、複製、收起返回焦點，以及沒有 API 請求。此方式不會自動回寫網站，自動報告仍待 API／Mac 正式連接。
- 連接狀態、報告與價格使用明示的本機合成攔截資料；公開 TradingView 畫面是沒有行情的嵌入契約測試。使用者之前提供的截圖顯示其瀏覽器可載入官方 K 線，但本雲端仍受目的地主機限制，未獨立驗證真實報價時效或更新後的供應商週期畫面。
- Impeccable detector 本輪只執行一次：2 項既有字體警告、107 項 advisory（主要為既有字級／圓角／色彩記錄）；保留已接受的視覺系統，沒有順帶改寫 DESIGN.md。畫面及檢查留在忽略的 `.impeccable/review/learning-v04/`；沒有把測試行情或報告放進部署資產。
- 獨立完成審查查看 31 張有效畫面，要求為四類可展開解說加入明確箭頭。已以同一批修正補上開合箭頭及至少 44px 整行操作目標；原 31 張重新擷取，另加 24 張開／合狀態及 12 組 Enter 鍵操作檢查。scoring-only 複核將該修正評為 resolved、disposition 為 ship；範圍僅為這份修正清單，不代表供應商行情或正式服務通過驗證。
