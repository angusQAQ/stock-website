#!/usr/bin/env python3
"""Run an isolated research tool without changing the shell environment."""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local/stock-tools"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tool", choices=["tradingagents", "openbb", "openbb-api", "openbb-mcp", "daily-stock-analysis", "ai-berkshire", "longbridge", "longbridge-python"])
    parser.add_argument("arguments", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    env = os.environ.copy()
    state = LOCAL / "state"
    state.mkdir(parents=True, exist_ok=True)
    if args.tool == "longbridge":
        command = [str(LOCAL / "bin/longbridge"), *args.arguments]
        cwd = state / "longbridge"
        cwd.mkdir(parents=True, exist_ok=True)
    else:
        tool = "openbb" if args.tool.startswith("openbb") else args.tool.removesuffix("-python")
        python = LOCAL / "venvs" / tool / "bin/python"
        env.setdefault("XDG_CACHE_HOME", str(state / "cache"))
        env.setdefault("CZSC_HOME", str(state / "czsc"))
        env.setdefault("NUMBA_CACHE_DIR", str(state / "numba"))
        env.setdefault("MPLCONFIGDIR", str(state / "matplotlib"))
        env.setdefault("npm_config_cache", str(LOCAL / "npm-cache"))
        env.setdefault("npm_config_registry", "https://registry.npmjs.org")
        env.setdefault("npm_config_replace_registry_host", "always")
        env.setdefault("TRADINGAGENTS_RESULTS_DIR", str(state / "tradingagents/results"))
        env.setdefault("TRADINGAGENTS_CACHE_DIR", str(state / "tradingagents/cache"))
        env.setdefault("TRADINGAGENTS_MEMORY_LOG_PATH", str(state / "tradingagents/memory.md"))
        cwd = ROOT
        if args.tool.startswith("openbb"):
            command = [str(python), str(ROOT / "scripts/openbb-runtime.py"), args.tool, *args.arguments]
        elif tool == "tradingagents":
            command = [str(python.parent / "tradingagents"), *args.arguments]
        elif tool == "daily-stock-analysis":
            cwd = LOCAL / "sources" / tool
            command = [str(python), "main.py", *args.arguments]
        else:
            if tool == "ai-berkshire":
                cwd = LOCAL / "sources" / tool
            command = [str(python), *args.arguments]
    try:
        raise SystemExit(subprocess.call(command, cwd=cwd, env=env))
    except KeyboardInterrupt:
        raise SystemExit(130)


if __name__ == "__main__":
    main()
