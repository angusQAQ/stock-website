# 部署與 Mac 分析連接

## 目前完成與尚待完成

正式前端入口為 [https://angusqaq.github.io/stock-website/](https://angusqaq.github.io/stock-website/)，由使用者於 2026-11-06 提供並確認；後續發佈沿用此網址。本雲端代理對該網址的請求仍回覆 CONNECT 403，因此未獨立驗證其線上 HTTP 或功能狀態。

已完成網站原始碼、真實 SQLite 帳本、行情代理、分析工作佇列、Mac CLI 連接程式與 GitHub Actions，並在本機 Cloudflare Worker/D1 驗證。正式後端、實際行情及 Mac 分析連接仍待完成。

正式前端網址採用 GitHub Pages，程式保留在 Private GitHub 倉庫，main 的網站更新自動發佈到同一 Pages 網站。雲端帳本、行情代理與 Mac 工作佇列仍需獨立後端；目前已準備 Cloudflare Worker/D1 的部署流程，尚未連接。

目前依使用者要求不設網站登入或持倉 API 存取驗證。Private GitHub 倉庫不能保護部署後的網站或 API；任何可連上它的人都可能讀寫持倉，亦可能建立分析工作。Mac 領取工作及回傳報告另外使用機器端秘密，避免任意回傳模型結果；這不限制網站訪客建立工作。未輸入任何真實本金、持倉或憑證。

## 本機執行

需要 Node >=22 及 npm。從專案根目錄執行：

```sh
npm ci
npm test
npm run build
npm run db:local
npm run dev:api
```

本機 schema migration 可重跑；不會建立遠端資料庫或把本機帳本複製到雲端。Vite 開發介面另執行 `npm run dev`。`npm run dev:api` 提供完整已建置網站與本機 API。

0.2 版新增 `0002_research_workflow.sql`，保存三組風險設定及取消排隊時間；本機與正式後端都需套用全部 migrations。0.3 沿用同一 schema，`/api/health` 成功回報 `version: 0.3.0`、`schemaVersion: 2`。更新不需清空帳本或報告；見 [架構說明](architecture.md) 及 [新版研究與來源](research-data.md)。

`wrangler.jsonc` 的全零 database_id 僅供本機開發，部署腳本會拒絕它。個人資料、套件快取、Wrangler 本機資料庫及建置產物都被 Git 忽略。

## GitHub Pages 正式前端

私人倉庫的 Pages 可用性與網站存取限制取決於 GitHub 方案，不能假設 Private 代表私有網頁。

首次在 GitHub Settings → Pages，將 Build and deployment 的 Source 選為 GitHub Actions。此環境的 GitHub API 連線被網路政策拒絕，尚無法代為修改或驗證這項設定；既有 GitHub Git 存取正常，不需另提供 GitHub token。

`.github/workflows/website.yml` 在每次 main 的網站變更推送後，自動執行測試、建置和 Pages 發佈；也能手動選 github-pages。首次啟用 Pages 後，如先前工作因未啟用而失敗，可在 Actions → Website 重新執行。以 GitHub deploy-pages 實際回傳的網址為準，不把預測網址當成已上線證據。

Pages 建置使用 configure-pages 回傳的 base_path，確保專案子路徑的 JavaScript、CSS 和 favicon 可載入。環境旗標 VITE_DEPLOYMENT_TARGET=github-pages 區分 Pages 與同源 Worker 執行模式。

若未設定 VITE_API_BASE_URL，0.3.1 會直接在瀏覽器載入 TradingView 官方 K 線及 ETF 報價帶；不用 Cloudflare 或 API 金鑰。頁面仍明示帳本／Codex 未連接，不送出金融寫入、不輪詢不存在的代理、不啟動模型。來源實際可用性與延遲需在訪客瀏覽器核對，詳見 [公開行情連接](public-market.md)。

後端部署完成後，將真實 API origin 設為 GitHub Actions Variable VITE_API_BASE_URL。Worker 部署設定會從 config/site.json 自動帶入 https://angusqaq.github.io 作為允許的前端 origin；只有需要覆寫時才設定 FRONTEND_ORIGIN（scheme + host，不含專案路徑），再重新部署 Worker 及 Pages。這是跨來源設定，不是登入保護。Cloudflare token 不是 Pages 前端發佈的必要條件，但啟用 Cloudflare 後端仍需它。

## Cloudflare 正式部署

使用你自己的 Cloudflare 帳戶。可在自己的終端用 `npx wrangler login` 登入，或透過部署環境的安全設定提供 `CLOUDFLARE_API_TOKEN`；不要在聊天貼 token。若平台已注入身分，先用現有身分測試，不重複登入或擷取憑證。

2026-11-06 的實際檢查：雲端 `wrangler whoami` 回覆未登入，Cloudflare API 請求被環境代理以 CONNECT 403 拒絕。目前未配置 Cloudflare 注入身分或 secret；使用者在瀏覽器登入 Cloudflare，不會自動把部署權限傳入這台雲端機器。

已將 `CLOUDFLARE_API_TOKEN` 的安全 secret 需求加入環境草稿，目的地主機僅 `api.cloudflare.com`，並將該網域加入既有 allowlist 草稿，未移除原本網域。使用者需在環境設定安全填入值、儲存並發布，然後重試。建議 token 僅限預定部署的帳戶，具備 Workers Scripts 編輯、D1 編輯及 Account Settings 讀取。不得在 Git 或聊天保存 token。設定草稿保存成功不代表憑證已填入、網路已套用或網站已部署。

1. 在已授權的帳戶建立 D1：`npx wrangler d1 create stock-website-portfolio`。
2. 記錄回傳的 database_id，於執行環境設定非秘密變數 `CLOUDFLARE_D1_DATABASE_ID` 和 `CLOUDFLARE_ACCOUNT_ID`。
3. 執行 `npm run deploy`。腳本會建置、產生被忽略的部署設定、套用遠端 migrations，再部署 Worker。
4. 使用部署成功回傳的實際網址；後續部署沿用同一帳戶與 `stock-website` 名稱，所以網址不變。不要自行推定 workers.dev 子網域。
5. 驗證 `/api/health`、`/api/portfolio`、`/api/quote?symbol=AAPL&range=1D`，確認實際 source timestamp、盤前盤後行為及資料保留。

GitHub 自動部署：在私人倉庫的 Actions Secrets 設 `CLOUDFLARE_API_TOKEN`，Variables 設 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_D1_DATABASE_ID`。缺少 database_id 時，push 只跑驗證，不會假裝已部署。設定完成後 main 的網站變更會更新同一 Worker。`.github/workflows/website.yml` 也可手動選 cloudflare 執行。

無需把研究工具的 Python 環境搬上 Worker；它們屬 Mac 分析端。帳本不依賴 Mac 是否在線。

## Mac · Codex 分析端

雲端工作區不能替你安裝 Mac 程式、操作桌面登入或證明訂閱扣款。橋接程式透過官方 CLI 執行研究，不擷取或匯出桌面程式的憑證；需要確認你的本機 CLI 使用預期帳戶／訂閱。

1. Mac 同步本專案。安裝研究資源：`python3 scripts/install-research-tools.py`；需要 Git、Python 3、uv 及 Node/npm。開啟新的 Codex 專案工作階段以探索 skills。
2. 確認 `codex --version` 和 `codex login status`。若只有桌面程式且無可用 CLI，透過 OpenAI 官方方式安裝 CLI，再在本機完成官方登入。不要複製 auth 檔。
3. 在自己的安全工具產生獨立機器端秘密。在 Worker 透過 `npx wrangler secret put BRIDGE_TOKEN --config .local/deploy/wrangler.json` 安全輸入；Mac 的 `STOCK_BRIDGE_TOKEN` 使用相同值。不要將值放進 Git、截圖、聊天或前端設定。
4. 部署時設定 `BRIDGE_ENABLED=true`。GitHub 自動部署也需設定對應 Variable，否則下次部署會回到關閉狀態。已儲存的 Worker secret 不會寫入部署 JSON。
5. 在 Mac 執行 `python3 scripts/mac-analysis-bridge.py --url https://實際網站或API的origin --check`。它只檢查 CLI 登入與連線，不呼叫模型，也不證明扣款方式。
6. 執行 `python3 scripts/mac-analysis-bridge.py --url https://實際網站或API的origin`。只在網站按分析後才有工作，Mac 離線時留在佇列。Ctrl-C 停止橋接。

0.3 需同步更新 Mac 的 bridge、`research_data.py`、研究提示及 JSON schema。新工作要求結構化報告，舊 bridge 的結果會被明確拒絕。需要 SEC 財報／Form 4 自動擷取時，在 Mac 設定 `NORTHSTAR_SEC_USER_AGENT`（應用名稱及真實聯絡電郵）；未設定會列明缺漏。公開新聞、Yahoo options 及 SEC 擷取只在領取工作後執行，不在 `--check` 或行情輪詢時執行；排隊超過 30 分鐘會要求重新分析而不呼叫模型。

CLI 使用 `codex --search exec --sandbox read-only --ephemeral --output-schema …`；由你本機支援的 CLI 決定實際帳戶與模型服務。沒有使用繞過 sandbox 或關閉批准的旗標。報告與執行日誌只放在被 Git 忽略的 `.local/analysis-bridge/`，不擷取憑證。JSON 結構及價格欄位會在雲端再驗證。

單次分析上限 15 分鐘，執行時定期更新租約。工作中斷後，新的分析請求會清理已過期的執行中工作。只有一份 queued/running 工作可存在，避免重複按鈕造成多份同時執行。這不代表模型分析的事實或績效已驗證。

## 行情與富途費率

Yahoo 公開端點可能延遲、限流或拒絕雲端 IP。網站保留來源時間並顯示錯誤，不把輪詢次數當成實時行情授權。若正式部署的來源取不到資料，需進一步選擇可用來源，不能用合成價格代替。

目前雲端環境未允許 GitHub API、Yahoo 與富途費率頁存取，所需域名已保存至環境設定草稿；需使用者儲存並發布設定後重測。API 驗證、富途適用費率及即時資料的新鮮度尚未完成。帳本先要求輸入實際富途成交費用，倉位計算也要求手動輸入已核對的預計費用。

## 版本與更新

每個邏輯程式更新建立 Git commit。部署前跑 `npm test`、`npm run build`、Worker dry run 及相應功能檢查。更新使用相同正式資源與網址，不重建或清空帳本。不要將資料庫檔、報告、token 或真實持倉放進版本庫。正式 URL、首次遠端驗證結果與部署版本應以實際成功證據更新本文。
