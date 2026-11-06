#!/usr/bin/env python3
"""Connect queued website research requests to an authenticated local Codex CLI.

This does not read or export Codex desktop credentials. It invokes the user's
installed CLI, which owns authentication and subscription eligibility.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from research_data import collect

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / ".local/analysis-bridge"


def codex_binary(explicit: str | None) -> str:
    candidates = [explicit, shutil.which("codex"), "/Applications/Codex.app/Contents/Resources/codex"]
    for candidate in candidates:
        if candidate and Path(candidate).is_file() and os.access(candidate, os.X_OK):
            return str(candidate)
    raise RuntimeError("找不到 Codex CLI。請安裝官方 CLI，或以 --codex 指定已安裝的執行檔。")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="Website/API HTTPS origin, no credentials")
    parser.add_argument("--codex", help="Optional path to the locally installed Codex executable")
    parser.add_argument("--check", action="store_true", help="Check local CLI sign-in and website connectivity without running a model")
    parser.add_argument("--once", action="store_true", help="Poll for at most one job, then exit")
    args = parser.parse_args()
    parsed = urllib.parse.urlsplit(args.url)
    if parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in {"", "/"}:
        parser.error("--url 只接受網站 origin，不可帶憑證、路徑或查詢參數。")
    if parsed.scheme != "https" and not (parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}):
        parser.error("遠端分析連線必須使用 HTTPS。")
    url = args.url.rstrip("/")
    token = os.environ.get("STOCK_BRIDGE_TOKEN")
    if not token:
        parser.error("請在本機安全設定 STOCK_BRIDGE_TOKEN；不要在聊天或 Git 中提供它。")
    codex = codex_binary(args.codex)

    def post(path: str, data: dict):
        request = urllib.request.Request(url + "/api/bridge/" + path,
            data=json.dumps(data).encode(), headers={"Content-Type": "application/json", "Authorization": "Bearer " + token}, method="POST")
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)

    if args.check:
        subprocess.run([codex, "--version"], check=True)
        signed_in = subprocess.run([codex, "login", "status"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if signed_in.returncode:
            raise SystemExit("CLI 尚未登入；請在 Mac 使用官方 codex login 流程，勿複製桌面憑證。")
        # An impossible job id only updates the bridge presence, without claiming work.
        post("heartbeat", {"id": "connectivity-check", "claimToken": "no-job"})
        print("CLI 已登入；網站分析端驗證成功。此檢查沒有呼叫模型，不能證明額度扣款方式。")
        return

    OUTPUT.mkdir(parents=True, exist_ok=True, mode=0o700)
    print("Mac 分析端已啟動；只處理網站排隊的分析，Ctrl-C 停止。", flush=True)
    while True:
        try:
            job = post("claim", {})
            if not job:
                if args.once:
                    return
                time.sleep(5)
                continue
            job_id = job["id"]
            if not isinstance(job_id, str) or not all(c in "0123456789abcdef-" for c in job_id) or len(job_id) != 36:
                raise RuntimeError("網站回傳無效工作識別碼。")
            snapshot = job["snapshot"]
            captured = datetime.fromisoformat(snapshot["capturedAt"].replace("Z", "+00:00"))
            if (datetime.now(timezone.utc) - captured).total_seconds() > 1800:
                post("result", {"id": job_id, "claimToken": job["claimToken"], "error": "排隊超過 30 分鐘，行情快照已過期；請重新按分析。此工作未呼叫模型。"})
                if args.once:
                    return
                continue
            print(f"處理 {snapshot['quote']['symbol']} / {snapshot['horizon']}，工作 {job_id[:8]}", flush=True)
            result_path = OUTPUT / (job_id + ".json")
            log_path = OUTPUT / (job_id + ".log")
            # Refresh presence before the bounded public-data reads. No model
            # work runs on quote refreshes or on --check.
            post("heartbeat", {"id": job_id, "claimToken": job["claimToken"]})
            snapshot["researchBundle"] = collect(snapshot)
            prompt = (ROOT / "config/research-prompt.zh-Hant.md").read_text() + "\n\n" + json.dumps(snapshot, ensure_ascii=False)
            command = [codex, "--search", "exec", "--sandbox", "read-only", "--ephemeral", "--cd", str(ROOT),
                "--output-schema", str(ROOT / "config/analysis-report.schema.json"), "--output-last-message", str(result_path), "-"]
            payload = {"id": job_id, "claimToken": job["claimToken"]}
            process = None
            try:
                # All output stays in ignored local files, never in Git or cloud logs.
                with log_path.open("w") as log:
                    os.chmod(log_path, 0o600)
                    process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=log, stderr=log, text=True, start_new_session=True)
                    assert process.stdin is not None
                    process.stdin.write(prompt)
                    process.stdin.close()
                    started = time.monotonic()
                    while process.poll() is None:
                        if time.monotonic() - started > 900:
                            raise RuntimeError("本機分析超過 15 分鐘，已停止。")
                        post("heartbeat", payload)
                        time.sleep(20)
                    if process.returncode != 0:
                        raise RuntimeError(f"本機 Codex 執行失敗（退出代碼 {process.returncode}），請檢查本機日誌。")
                report = json.loads(result_path.read_text())
                os.chmod(result_path, 0o600)
                post("result", {**payload, "report": report})
                print(f"已回傳報告 {job_id[:8]}", flush=True)
            except (Exception, KeyboardInterrupt) as error:
                if process and process.poll() is None:
                    os.killpg(process.pid, signal.SIGTERM)
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        os.killpg(process.pid, signal.SIGKILL)
                message = str(error) if isinstance(error, RuntimeError) else "本機分析中斷或報告回傳失敗，請檢查 Mac。"
                try:
                    post("result", {**payload, "error": message[:1000]})
                except Exception:
                    print("無法回傳工作狀態；本機結果已保留，雲端工作會在租約到期後釋放。", flush=True)
                if isinstance(error, KeyboardInterrupt):
                    return
            if args.once:
                return
        except KeyboardInterrupt:
            return
        except (urllib.error.URLError, RuntimeError, ValueError, KeyError):
            print("網站分析服務暫時無法連接，15 秒後重試；請檢查網址與分析端設定。", flush=True)
            if args.once:
                raise SystemExit(1)
            time.sleep(15)


if __name__ == "__main__":
    main()
