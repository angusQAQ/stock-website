> 三套工具的分工、部署與目前尚未直接啟用的引擎見 [research-pipeline.md](research-pipeline.md)。安裝成功不代表正式報告服務已連接。網站資產功能已在 0.4 移除，下方舊持倉描述僅為歷史背景。

# 研究工具安裝與使用

五個指定來源安裝在本專案；不影響其他專案的全域 skills。版本見 `config/research-sources.json`，上游授權見 `third_party/research/`。

| 來源 | 安裝內容 | 執行入口 |
|---|---|---|
| longbridge/skills | 全部 13 個原生 skills、Longbridge CLI 0.31.1、技術分析 Python 套件 | `longbridge`、`longbridge-python` |
| tauricresearch/tradingagents | TradingAgents 0.7.1 及依賴；上游沒有原生 SKILL.md，由專案工具 skill 提供入口 | `tradingagents` |
| openbq-org/OpenBB | 指定 fork 的 OpenBB 5.0.0 安裝入口、其宣告的套件及全部 routers、5 個 MCP 原生 skills | `openbb`、`openbb-api`、`openbb-mcp` |
| ZhuLinsen/daily_stock_analysis | 原生股票分析 skill、完整後端 requirements | `daily-stock-analysis` |
| xbtlin/ai-berkshire | 全部 22 個 Codex skills、研究／財務驗算／報告稽核工具及 Python 依賴 | `ai-berkshire` |

共 41 個上游投資／資料 skills，加上 `stock-research-toolkit` 專案工具入口，共 42 個。每日股票分析倉庫另有 PR／issue 協作 skills 及 Grok Bot 範例：完整原始碼已下載，這些非投資用範例未註冊成 Codex 投資技能。Longbridge 的衍生品 skill 也完整保留，但本網站不啟用其期權或下單功能。

OpenBB 的 underscore 名稱改成 `openbb-*` 連字號名稱；`stock_analyzer` 改成 `stock-analyzer`，以符合 Codex skill 命名。只有安裝副本的 frontmatter `name` 調整，上游原始碼不變。其他 skill 文件與附屬參考檔保持來源內容。Skills 在開啟本專案的新 Codex 工作階段後才會重新探索；目前聊天不會自動增加工具權限。

## 安裝與重跑

工作目錄為 `stock-website` 倉庫根目錄。需要 Git、Python 3、uv、Node >=20.19 且 <27，以及 npm >=10；安裝器會下載固定 Python 3.11.17 到專案本地，不更改 HOME 或系統 Python。

```sh
python3 scripts/install-research-tools.py
python3 scripts/verify-research-tools.py --tests
```

僅下載來源並註冊 skills：

```sh
python3 scripts/install-research-tools.py --skills-only
```

安裝器核對每個來源的完整 commit；現有來源若版本不同或有受追蹤修改，會停止並保留內容，不 reset。現有 skill 檔案若與指定來源不同，也不覆寫。來源、每個工具獨立的 venv、快取、CLI 及產物均在被 Git 忽略的 `.local/stock-tools/`。Linux x86_64 使用已驗證的 Python 3.11 依賴鎖；其他平台依上游依賴與平台條件重新解析，不套用 Linux 專屬 wheel/Longbridge SDK 選擇。

CLI 從 Longbridge 官方 GitHub release 下載，與該 release 發布的 SHA-256 比對後才安裝。所有下載保留 TLS 與上游 checksum 驗證。

每日股票分析的 Web 前端也透過上游準備函式完成 `npm ci` 及 TypeScript/Vite build。上游 lockfile 混用 npmmirror 與 npmjs 網址；採 npm 支援的 `replace-registry-host=always` 設定，從官方 npm registry 取得相同套件，保留原本所有 integrity hashes，不修改 lockfile。依賴及建置指紋可在重跑時沿用。

## 執行範例

以下指令皆從倉庫根目錄執行：

```sh
python3 scripts/research-tool.py longbridge --version
python3 scripts/research-tool.py tradingagents --help
python3 scripts/research-tool.py openbb --python -c 'from openbb import obb; print(obb)'
python3 scripts/research-tool.py openbb-mcp --help
python3 scripts/research-tool.py ai-berkshire tools/financial_rigor.py calc --expr '0.1 + 0.2'
python3 scripts/research-tool.py daily-stock-analysis --help
```

需要臨時啟動服務時，分別在自己的終端執行，預設僅本機使用，不是公開網站：

```sh
python3 scripts/research-tool.py openbb-api --host 127.0.0.1 --port 6900
python3 scripts/research-tool.py daily-stock-analysis --serve-only --host 127.0.0.1 --port 8000
```

Daily Stock Analysis 以 `--serve-only` 啟動，不自動分析、不啟用排程或通知。健康檢查為 `GET /api/v1/health`；OpenBB 可讀取 `/openapi.json` 驗證 API schema。結束時用 Ctrl-C 停止自己啟動的服務。OpenBB 的首次 SDK 匯入會生成擴充套件索引，可能較慢；wrapper 使用受支援的 SystemService 初始化參數，將其資料放在 `.local/stock-tools/state/openbb/`，不需要寫入受限制的家目錄。

## Mac 與尚未連接的能力

這次實際安裝／驗證發生在 Linux 雲端環境，並未操作你的 Mac。Mac 先安裝 Git、Python 3 及 uv（若使用 Homebrew：`brew install uv`），同步這個專案後，執行上述安裝指令，再在 Codex 桌面程式開啟專案的新工作階段。macOS 分支已提供但未在 Mac 驗證；不宣稱 Mac 已完成安裝。

- Longbridge 行情與帳戶功能需要另外登入及相應資料權限；沒有連接帳戶，也沒有申請交易權限。富途手動輸入的持倉不會因此自動同步到 Longbridge。
- TradingAgents 上游宣稱提供 ChatGPT 訂閱登入。離線測試只驗證其程式行為，不證明官方訂閱相容性、Codex 桌面登入共用或額度扣款。沒有執行登入、擷取憑證或呼叫付費模型。
- Daily Stock Analysis 的完整模型報告需要另行設定支援的模型後端。沒有自行加入付費 API 金鑰或要求額外訂閱。
- 即時 Yahoo 行情、盤前盤後新鮮度及限流尚未實測；此雲端網路清單目前未包含 Yahoo Finance 資料域名。工具安裝成功不代表行情來源可用。
- AI Berkshire 的財務驗算與報告稽核可離線使用；瀏覽器擷取、發文、訊息與其他外部平台連接未配置。Playwright Python 套件已安裝，專用瀏覽器未下載。
- 沒有自動註冊 MCP 服務至使用者的全域 Codex 設定；啟動與客戶端連接屬後續整合。
- 未建置網站、雲端資料庫、Mac 任務橋接或 GitHub Pages 部署。固定網址及公開存取條件見 `product-requirements.md`。

## 更新與回復

更新來源需明確修改來源 commit 與適用依賴鎖，檢查上游差異及授權，再重跑安裝和驗證。不要自動跟隨遠端 main，不要修改來源 checkout 讓安裝通過。重裝已固定的來源不會替你更新遠端或發佈網站。

程式與 skills 可透過這次 Git commit 檢視／回復。`.local/stock-tools/` 含本地產物及未來可能的私人報告；移除或重建前先保存個人資料，不應整個直接刪除。
