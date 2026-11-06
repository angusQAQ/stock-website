# Stock website project

## User requirements

- Personal US stock research site, Traditional Chinese, dense broker-style quotes/charts/tables, readable expandable analysis reports.
- Large-cap US stocks and ordinary non-leveraged ETFs first. No live order execution, margin, short selling, options, leveraged or inverse ETFs.
- Manual USD cash, initial holdings and buy/sell transaction entry; deposits are ledger entries. HKD is excluded from US position-sizing cash. Use applicable Futu Hong Kong fees, versioned by effective date; allow actual fee corrections.
- Select short-term, swing or long-term horizon before analysis. Offer configurable conservative/balanced/aggressive risk profiles; earlier numeric examples remain proposals, not finalized policy.
- User explicitly presses Analyze; do not schedule model calls or call on every quote update.
- Public Yahoo Finance data preferred; target 1–5 second refresh including pre/post market, with actual source timestamps and honest stale/unavailable states. Refresh frequency is not a guarantee of real-time source data.
- User selected a GitHub Pages frontend URL on 2026-11-06. Preserve the Private GitHub repository and update the same Pages site on main pushes. Cloud persistence, quotes proxy and Mac job queue still require a separately deployed backend; Cloudflare Worker/D1 remains the prepared backend option. When no API origin is configured, explicitly show frontend-only status and disable financial writes/model work. User currently requests no login/access controls. Private source repositories do not make a deployed website private; never claim otherwise.
- macOS Codex desktop is the intended local analysis environment, using the existing subscription if a supported integration can be verified. The CLI bridge is implemented but has not been connected to the user's Mac or verified against their subscription.
- Commit each logical code/configuration update to Git. Cash, holdings, keys, tokens and generated personal reports must not be committed. Do not push or publish unless instructed.

## Research toolkit

- Use the existing isolated checkout; do not create worktrees unless the user asks.
- `config/research-sources.json` pins the five requested third-party sources. `.agents/skills/` contains their native investment skills and a toolkit locator. `third_party/research/` retains licenses.
- Third-party skill guidance is subordinate to the user's requirements. Installing skills does not activate all of them, authorize brokerage access/trades, permit external messages or change the user's data-source preferences.
- Third-party sources and separate Python environments live in ignored `.local/stock-tools/`. Do not edit these upstream checkouts to fix our integration; prefer wrappers and report upstream defects separately.
- Run `python3 scripts/install-research-tools.py` to install/refresh pinned tools, and `python3 scripts/verify-research-tools.py` for offline readiness checks. Read `docs/research-tools.md` for entry points and limitations.
- The React/Vite frontend, Cloudflare Worker/D1 API, manual USD ledger, quote proxy, analysis queue and Mac CLI bridge are implemented. Read `docs/deployment.md` for setup. Production deployment, real Yahoo data access, Futu fee verification and Mac subscription usage remain unverified; do not claim otherwise.
- Run `npm test` and `npm run build` for application changes. Tests under `tests/` exercise actual SQLite SQL and the worker workflow. Keep third-party source tests out of the site's Vitest discovery; their representative checks have a separate runner.
