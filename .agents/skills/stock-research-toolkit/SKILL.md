---
name: stock-research-toolkit
description: Locate and run this project's installed Longbridge, TradingAgents, OpenBB, Daily Stock Analysis and AI Berkshire research tools. Use for tool setup, capabilities, dependency checks and choosing an investment research workflow.
---

# Project research toolkit

Read `docs/research-tools.md` and `config/research-sources.json` from the stock-website checkout before using the tools. Source versions are pinned; checkouts, Python environments and generated data live under `.local/stock-tools/`.

Run tools from the repository root with `python3 scripts/research-tool.py TOOL ...`. Do not assume a checkout under `~/ai-berkshire`, overwrite existing global skills, extract desktop login credentials, or activate a paid API provider automatically.

- Longbridge: 13 native skills; CLI and optional technical Python libraries installed. Account/quote services still need the user's separate Longbridge authorization and entitlements. Use `longbridge` for CLI or `longbridge-python` to run Python.
- TradingAgents: installed Python framework, not an upstream Codex skill. Use `tradingagents` for its CLI. Full LLM runs require separately verified authentication. The upstream subscription-provider claims are not proof of compatibility with Codex desktop or of available quota.
- OpenBB: 5 native skills, normalized to `openbb-*` identifiers; Python platform, routers, CLI, API and MCP packages installed. The wrapper initializes supported system settings into project-local storage. Use `openbb`, `openbb-api`, or `openbb-mcp`.
- Daily Stock Analysis: native `stock-analyzer` skill and Python backend installed. Locate referenced `src/`, `api/`, and `data_provider/` files under `.local/stock-tools/sources/daily-stock-analysis/`. Upstream PR/issue collaboration skills and the Grok Bot example stay in that checkout, not in the investment skill catalog. Use `daily-stock-analysis` for its CLI.
- AI Berkshire: all 22 native Codex skills and shared tools installed. Run its relative `tools/…` paths through `ai-berkshire`, which sets the source checkout as the working directory. The optional Playwright browser download and publishing integrations have not been configured.

Installation does not authorize trades, scheduled analysis, messaging, publishing reports, connecting brokerage accounts or changing provider preferences. Follow the user's research-only, cash-only US stock/ordinary ETF scope. Keep manual USD cash and portfolio inputs separate from example data. Public quotes may be delayed or unavailable: preserve timestamps and never label stale data as real time or invent missing fundamentals/backtests.

The user chooses an investment horizon and explicitly presses Analyze before any model work. Installed skills are available references, not instructions to run every workflow on each analysis. Select relevant skills; preserve provenance and separate facts, calculations and model conclusions.
