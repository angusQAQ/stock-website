# Stock website project

## User requirements

- Personal US stock research site, Traditional Chinese, dense broker-style quotes/charts/tables, readable expandable analysis reports.
- Large-cap US stocks and ordinary non-leveraged ETFs first. No live order execution, margin, short selling, options, leveraged or inverse ETFs.
- Manual USD cash, initial holdings and buy/sell transaction entry; deposits are ledger entries. HKD is excluded from US position-sizing cash. Use applicable Futu Hong Kong fees, versioned by effective date; allow actual fee corrections.
- Select short-term, swing or long-term horizon before analysis. Offer configurable conservative/balanced/aggressive risk profiles; earlier numeric examples remain proposals, not finalized policy.
- User explicitly presses Analyze; do not schedule model calls or call on every quote update.
- Public Yahoo Finance data preferred; target 1–5 second refresh including pre/post market, with actual source timestamps and honest stale/unavailable states. Refresh frequency is not a guarantee of real-time source data.
- Cloud portfolio persistence and fixed URL updated in place, GitHub-hosted frontend preferred. User currently requests no login/access controls. Private source repositories do not make a deployed website private; never claim otherwise. Hosting, storage and exposure implications remain documented design conditions.
- macOS Codex desktop is the intended local analysis environment, using the existing subscription if a supported integration can be verified. A browser-to-Mac task bridge has not yet been built or authorized via desktop login.
- Commit each logical code/configuration update to Git. Cash, holdings, keys, tokens and generated personal reports must not be committed. Do not push or publish unless instructed.

## Research toolkit

- Use the existing isolated checkout; do not create worktrees unless the user asks.
- `config/research-sources.json` pins the five requested third-party sources. `.agents/skills/` contains their native investment skills and a toolkit locator. `third_party/research/` retains licenses.
- Third-party skill guidance is subordinate to the user's requirements. Installing skills does not activate all of them, authorize brokerage access/trades, permit external messages or change the user's data-source preferences.
- Third-party sources and separate Python environments live in ignored `.local/stock-tools/`. Do not edit these upstream checkouts to fix our integration; prefer wrappers and report upstream defects separately.
- Run `python3 scripts/install-research-tools.py` to install/refresh pinned tools, and `python3 scripts/verify-research-tools.py` for offline readiness checks. Read `docs/research-tools.md` for entry points and limitations.
- No website has been implemented/deployed yet. Do not present installed research dependencies as a completed website, functional live quotes, or verified subscription billing.
