# Northstar · 美股研究工作台

正式前端入口：[https://angusqaq.github.io/stock-website/](https://angusqaq.github.io/stock-website/)。後續更新沿用同一網址。

以 GitHub Pages 固定網址發佈的個人美股網站：公開行情與 K 線、自選股、美元資金帳本、持倉及按需 Codex 分析。證券平台式深色介面，支援桌面與手機。不執行券商交易。

```sh
npm ci
npm test
npm run build
npm run db:local
npm run dev:api
```

開發介面時，可在另一個終端執行 `npm run dev`，Vite 會把 API 請求轉給本機 Worker。

- [功能與限制](docs/product-requirements.md)
- [部署、固定網址與 Mac 連接](docs/deployment.md)
- [五組研究來源與 42 個專案 skills](docs/research-tools.md)
- [Impeccable 繁體中文詳細使用手冊](docs/impeccable-guide.zh-Hant.md) · [網頁版](public/guides/impeccable.html) · [PDF](public/guides/impeccable.zh-Hant.pdf)

Impeccable 4.8.0 已安裝於 `.agents/skills/impeccable/`，在新的 Codex 專案工作階段使用 `$impeccable`。首次使用設計 hook 時，依 Codex 的 `/hooks` 介面檢查並核准。CLI 可透過 `npx --no-install impeccable` 執行；設計指令則貼在 Codex 聊天中。

行情使用 Yahoo Finance 公開來源，目標每 5 秒輪詢，包含來源提供的盤前盤後資料；實際新鮮度與可用性須依來源時間判斷。沒有資料時不顯示模擬價格。雲端部署、Mac 訂閱連接及富途自動費率估算仍需完成各自的外部設定與驗證。

Pages 在 main 更新後自動發佈；首次需在 GitHub Settings → Pages 選 GitHub Actions。未連接獨立 API 時，頁面明確顯示前端模式並停止資金寫入與模型工作。
