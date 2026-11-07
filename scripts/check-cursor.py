#!/usr/bin/env python3
"""Read-only Cursor connection probe; never starts an agent or prints secrets."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

CURSOR_ACCOUNT_URL = "https://api.cursor.com/v1/me"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Do not forward the Authorization header to any redirect destination.
        return None


def check_connection(key: str | None, opener=None) -> dict:
    if not key or not key.strip():
        return {"connected": False, "status": "missing-secret", "message": "請先在安全環境設定 CURSOR_API_KEY。"}
    request = urllib.request.Request(CURSOR_ACCOUNT_URL, method="GET", headers={
        "Authorization": "Bearer " + key.strip(), "Accept": "application/json",
    })
    opener = opener or urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(request, timeout=20) as response:
            # Check the shape without displaying account details, names or email.
            data = json.loads(response.read(65536))
            if not isinstance(data, dict) or not any(isinstance(data.get(field), str) and data[field] for field in ("userId", "userEmail")):
                return {"connected": False, "status": "unexpected-response", "message": "回應未符合預期的帳戶格式；尚未確認接通。"}
        return {"connected": True, "status": "authenticated", "message": "Cursor 帳戶驗證成功；沒有建立代理任務。"}
    except urllib.error.HTTPError as error:
        message = {401: "金鑰未通過此端點驗證，請核對金鑰類型與權限。", 403: "服務或網路政策拒絕存取。", 404: "帳戶端點不可用，需核對官方 API 版本。", 429: "來源限流，請稍後再試。"}.get(error.code, "Cursor 請求未完成，尚未確認接通。")
        return {"connected": False, "status": "http-error", "httpStatus": error.code, "message": message}
    except (urllib.error.URLError, TimeoutError, OSError):
        return {"connected": False, "status": "network-error", "message": "無法連接 Cursor；請檢查網域設定及網絡。"}
    except (ValueError, TypeError):
        return {"connected": False, "status": "unexpected-response", "message": "服務回應格式無效，尚未確認接通。"}


if __name__ == "__main__":
    result = check_connection(os.environ.get("CURSOR_API_KEY"))
    print(json.dumps(result, ensure_ascii=False))
    raise SystemExit(0 if result["connected"] else 1)
