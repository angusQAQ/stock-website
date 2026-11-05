#!/usr/bin/env python3
"""Validate installed skills, dependency consistency and offline research capabilities."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local/stock-tools"


def check(label: str, command: list[str], cwd: Path = ROOT, timeout: int = 180) -> None:
    print(f"Checking {label}…", flush=True)
    env = os.environ.copy()
    env["UV_CACHE_DIR"] = str(LOCAL / "uv-cache")
    result = subprocess.run(command, cwd=cwd, env=env, text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    log = LOCAL / "validation" / (re.sub(r"[^a-z0-9]+", "-", label.lower()) + ".log")
    log.parent.mkdir(parents=True, exist_ok=True)
    log.write_text(result.stdout)
    if result.returncode:
        print(result.stdout[-10000:])
        raise SystemExit(f"FAIL: {label} (exit {result.returncode}); see {log.relative_to(ROOT)}")
    print(f"PASS: {label}", flush=True)
    if "tests" in label.lower():
        print(result.stdout[-1600:])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tests", action="store_true", help="Also run representative upstream offline tests")
    args = parser.parse_args()
    installer = runpy.run_path(str(ROOT / "scripts/install-research-tools.py"))
    count = 0
    for source in installer["CONFIG"]["sources"]:
        path = installer["checkout"](source)
        for skill in source["skills"]:
            if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", skill["name"]):
                raise SystemExit(f"Invalid Codex skill identifier: {skill['name']}")
            for rel, expected in installer["skill_files"](path, skill).items():
                target = ROOT / ".agents/skills" / skill["name"] / rel
                if not target.is_file() or hashlib.sha256(target.read_bytes()).digest() != hashlib.sha256(expected).digest():
                    raise SystemExit(f"Missing or modified installed skill: {target}")
            count += 1
        python = LOCAL / "venvs" / source["id"] / "bin/python"
        check(source["id"] + " dependency consistency", ["uv", "pip", "check", "--python", str(python)])
    assert (ROOT / ".agents/skills/stock-research-toolkit/SKILL.md").is_file()
    print(f"PASS: {count} upstream skills + 1 project skill verified against pinned source files")
    wrapper = [sys.executable, str(ROOT / "scripts/research-tool.py")]
    check("Longbridge CLI", [*wrapper, "longbridge", "--version"])
    check("Longbridge technical libraries", [*wrapper, "longbridge-python", "-c",
          "import czsc, smartmoneyconcepts, statsmodels.api, scipy, arch, sklearn, pandas, numpy; print('Technical libraries imported')"])
    check("TradingAgents CLI", [*wrapper, "tradingagents", "--help"])
    check("OpenBB SDK", [*wrapper, "openbb", "--python", "-c",
          "from openbb import obb; assert hasattr(obb, 'equity') and hasattr(obb, 'etf'); print('Equity and ETF routers available')"])
    check("OpenBB API launcher", [*wrapper, "openbb-api", "--help"])
    check("OpenBB MCP launcher", [*wrapper, "openbb-mcp", "--help"])
    check("Daily Stock Analysis CLI", [*wrapper, "daily-stock-analysis", "--help"])
    check("AI Berkshire calculation", [*wrapper, "ai-berkshire", "tools/financial_rigor.py", "calc", "--expr", "0.1 + 0.2"])
    check("AI Berkshire report audit", [*wrapper, "ai-berkshire", "tools/report_audit.py", "--help"])
    if args.tests:
        check("TradingAgents tests", [str(LOCAL / "venvs/tradingagents/bin/python"), "-m", "pytest", "-q",
              "tests/test_portfolio_context.py", "tests/test_date_boundaries.py", "tests/test_rating_integrity.py",
              "tests/test_chatgpt_provider.py"], cwd=LOCAL / "sources/tradingagents")
        check("Daily Stock Analysis tests", [str(LOCAL / "venvs/daily-stock-analysis/bin/python"), "-m", "pytest", "-q",
              "tests/test_api_health.py", "tests/test_stock_analyzer_rsi.py", "tests/test_yfinance_normalize.py",
              "tests/test_yfinance_us_indices.py"], cwd=LOCAL / "sources/daily-stock-analysis")
        check("AI Berkshire arithmetic and audit tests", [str(LOCAL / "venvs/ai-berkshire/bin/python"), "-m", "unittest",
              "discover", "-s", "tests", "-p", "test_*rigor.py"], cwd=LOCAL / "sources/ai-berkshire")
        check("AI Berkshire report audit tests", [str(LOCAL / "venvs/ai-berkshire/bin/python"), "-m", "unittest",
              "discover", "-s", "tests", "-p", "test_report_audit.py"], cwd=LOCAL / "sources/ai-berkshire")
    print("Offline tool installation verified. Live market access, LLM billing/authentication, macOS and deployment are not validated by this check.")


if __name__ == "__main__":
    main()
