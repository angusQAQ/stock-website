# 驗證紀錄

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
