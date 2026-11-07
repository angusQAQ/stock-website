# Cursor API 連接狀態

使用者要求接通 Cursor API。金鑰不會寫入前端、Git、網址或日誌。雲端環境設定草稿已加入 `CURSOR_API_KEY` 安全欄位（只准送到 `api.cursor.com`），及 Cursor 文件／API 網域；**保存草稿不等於已填入金鑰或套用設定**。

## 現在的限制

目前執行環境的允許網域仍未包含 Cursor；官方文件請求被代理回覆 CONNECT 403。尚未發送金鑰、驗證帳戶、建立任何 Cursor 任務或確認額度。公開第三方客戶端可作接駁參考，但不能取代官方端點及正式認證驗證。

參考：[官方 API 文件](https://cursor.com/docs/api)、[Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)。參考客戶端使用 Bearer 認證及 `GET /v1/me`；`scripts/check-cursor.py` 只探測此帳戶端點，回應或版本不符時明示未確認接通，不猜測聊天接口。

## 安全連線驗證

1. 在雲端環境設定填入 `CURSOR_API_KEY` Secret，儲存並發布已準備的網域設定。不要將值放在聊天、命令參數、GitHub Pages 的 `VITE_` 變數或原始碼。
2. 設定套用後，重新核對環境 ready 狀態及官方文件；執行 `python3 scripts/check-cursor.py`。它只做一次帳戶 GET，不建立代理、分支、PR 或付費研究任務；不顯示帳戶資料、金鑰或原始錯誤內容，也不跟隨攜帶認證的重新導向。
3. 帳戶驗證成功只證明此端點接受憑證；不代表 Cursor 是 OpenAI 相容聊天 API，也不代表 Northstar 報告已能自動產生。

## 接入網站研究仍需甚麼

GitHub Pages 不能安全保存服務金鑰或執行伺服器工作。網站自動分析仍需研究後端；目前的正式 Worker／D1 尚未部署，現有分析程式仍是 Mac／Codex bridge。Cursor 支援的任務接口、私人倉庫授權、模型及額度必須先核對，再選擇相應的伺服器轉接方式。不得把 key 放進靜態網頁來繞過這一步，也不把「設定了 key」顯示成「報告服務已啟用」。

現有分析按鈕的手動研究題目及一般互動教學仍可用。任何新的模型研究只會在明確按分析後啟動；行情更新不建立 Cursor 任務。
