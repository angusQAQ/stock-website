# 部署與 Mac 分析連接

## 目前完成與尚待完成

已完成網站原始碼、真實 SQLite 帳本、行情代理、分析工作佇列、Mac CLI 連接程式與 GitHub Actions。已在本機 Cloudflare Worker/D1 執行網站。這不等於正式網站已發佈；正式平台選擇、帳戶權限與外部連線仍需完成。

使用者已於 2026-11-06 確認採用 Cloudflare：Private GitHub 倉庫管理程式，Cloudflare Worker 提供同一個固定網址、靜態介面與 API，D1 保存帳本和報告。GitHub Pages 保留為替代流程，非目前部署目標。

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

`wrangler.jsonc` 的全零 database_id 僅供本機開發，部署腳本會拒絕它。個人資料、套件快取、Wrangler 本機資料庫及建置產物都被 Git 忽略。

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

## GitHub Pages 前端選項

私人倉庫的 Pages 可用性與網站存取限制取決於 GitHub 方案，不能假設 Private 代表私有網頁。

先完成 Worker API 部署，將真實 API origin 設為 GitHub Variable `VITE_API_BASE_URL`。Worker 部署環境的 `FRONTEND_ORIGIN` 設為 Pages origin（例如 GitHub 回傳網址的 scheme + host，不含專案路徑），再重新部署以允許該來源。自訂 origin 是跨來源設定，不是登入保護。

在 GitHub Settings → Pages 選 GitHub Actions，再手動執行 Website workflow，target 選 `github-pages`。工作流程會設定專案資產路徑並使用部署動作實際回傳的網址。缺少 API origin 時會停止，避免發布一個看似有帳本但實際沒有後端的網站。

## Mac · Codex 分析端

雲端工作區不能替你安裝 Mac 程式、操作桌面登入或證明訂閱扣款。橋接程式透過官方 CLI 執行研究，不擷取或匯出桌面程式的憑證；需要確認你的本機 CLI 使用預期帳戶／訂閱。

1. Mac 同步本專案。安裝研究資源：`python3 scripts/install-research-tools.py`；需要 Git、Python 3、uv 及 Node/npm。開啟新的 Codex 專案工作階段以探索 skills。
2. 確認 `codex --version` 和 `codex login status`。若只有桌面程式且無可用 CLI，透過 OpenAI 官方方式安裝 CLI，再在本機完成官方登入。不要複製 auth 檔。
3. 在自己的安全工具產生獨立機器端秘密。在 Worker 透過 `npx wrangler secret put BRIDGE_TOKEN --config .local/deploy/wrangler.json` 安全輸入；Mac 的 `STOCK_BRIDGE_TOKEN` 使用相同值。不要將值放進 Git、截圖、聊天或前端設定。
4. 部署時設定 `BRIDGE_ENABLED=true`。GitHub 自動部署也需設定對應 Variable，否則下次部署會回到關閉狀態。已儲存的 Worker secret 不會寫入部署 JSON。
5. 在 Mac 執行 `python3 scripts/mac-analysis-bridge.py --url https://實際網站或API的origin --check`。它只檢查 CLI 登入與連線，不呼叫模型，也不證明扣款方式。
6. 執行 `python3 scripts/mac-analysis-bridge.py --url https://實際網站或API的origin`。只在網站按分析後才有工作，Mac 離線時留在佇列。Ctrl-C 停止橋接。

CLI 使用 `codex --search exec --sandbox read-only --ephemeral --output-schema …`；由你本機支援的 CLI 決定實際帳戶與模型服務。沒有使用繞過 sandbox 或關閉批准的旗標。報告與執行日誌只放在被 Git 忽略的 `.local/analysis-bridge/`，不擷取憑證。JSON 結構及價格欄位會在雲端再驗證。

單次分析上限 15 分鐘，執行時定期更新租約。工作中斷後，新的分析請求會清理已過期的執行中工作。只有一份 queued/running 工作可存在，避免重複按鈕造成多份同時執行。這不代表模型分析的事實或績效已驗證。

## 行情與富途費率

Yahoo 公開端點可能延遲、限流或拒絕雲端 IP。網站保留來源時間並顯示錯誤，不把輪詢次數當成實時行情授權。若正式部署的來源取不到資料，需進一步選擇可用來源，不能用合成價格代替。

目前雲端環境未允許 GitHub API、Yahoo 與富途費率頁存取，所需域名已保存至環境設定草稿；需使用者儲存並發布設定後重測。API 驗證、富途適用費率及即時資料的新鮮度尚未完成。帳本先要求輸入實際富途成交費用，倉位計算也要求手動輸入已核對的預計費用。

## 版本與更新

每個邏輯程式更新建立 Git commit。部署前跑 `npm test`、`npm run build`、Worker dry run 及相應功能檢查。更新使用相同正式資源與網址，不重建或清空帳本。不要將資料庫檔、報告、token 或真實持倉放進版本庫。正式 URL、首次遠端驗證結果與部署版本應以實際成功證據更新本文。
