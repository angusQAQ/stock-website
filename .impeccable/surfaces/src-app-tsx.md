---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css","src/StockChart.tsx","src/AnalysisPanel.tsx","src/PortfolioView.tsx","src/TransactionModal.tsx"]
---

# Northstar research workspace

Target: `src/App.tsx`; related: `src/styles.css`, `src/StockChart.tsx`, `src/AnalysisPanel.tsx`, `src/PortfolioView.tsx`, `src/TransactionModal.tsx`.

Mode: Operate. Build path: code-led (app screen; no standing build-path preference is set).

## Direction contract

**THESIS:** A clear, confident personal investment workspace, using the user's pinned Longbridge direction. Replace the fixed dark terminal shell with a bright, horizontally navigated brokerage site. Preserve the actual research, ledger and on-demand analysis workflows.

**OWN-WORLD:** White and cool pale grey surfaces, near-black sans-serif headings and numbers, vivid orange primary actions with dark text, dark orange small links, subtle dividers and rounded controls. Gain, loss and connection colours retain distinct meanings. Exact Longbridge website styles remain unverified because its URL is denied by the environment proxy; these are authored Northstar implementation decisions, not measured reference values.

**STORY:** Choose a stock, inspect its quote and source time, select a horizon and risk profile, then request research. Cash and holdings remain close to the analysis. Missing connections never masquerade as financial data.

**FIRST VIEWPORT:** A white top bar holds Northstar, three navigation items, search and a record-funds action. A bold market heading leads into four quiet ETF summaries. Below, a compact stock list, wide quote/chart/research column and asset column form the workspace. On narrow screens the list becomes a horizontal stock strip; quote and analysis lead the vertical flow. The signature move is a single orange selection language connecting active navigation, chosen ticker, time range and explicit analysis action, without colouring inactive data.

**FORM:** User-pinned reference: Longbridge Hong Kong public website. No concept roll or image comp; this is the requested competitor-like path and a working app. `seed: none (user-pinned direction; launcher unavailable)`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Evidence and limits

The reference URL was retried on 2026-11-06 and the environment proxy still refused CONNECT with 403. The user subsequently repeated the instruction to implement the style and layout; continue with the stated visual interpretation rather than waiting on an upload. Report reference fidelity as unverified. No Longbridge branding, brokerage claims, promotional copy, customer metrics or website assets are imported. The official skills repository's logo was viewed only as supplementary brand evidence, not as evidence of the current website layout.

Preserve GitHub Pages frontend-only states, no simulated production prices, explicit model invocation, manual USD ledger, no brokerage execution and the existing permanent URL.

## Research workflow extension · 2026-11-06

The user accepted the art direction and requested continued implementation of the existing product plan. Preserve the committed world and its tokens. Extend the asset page with a collapsed, editable three-profile risk form; show exact stored limits beside analysis controls. Reports gain stock/horizon filtering, stable pagination and an exact-ID reader using the same report component as the market page. Old reports keep original limits, time and prices; historical reading does not recalculate current investments. Queued work can be cancelled before Mac claim, with distinct cancelled state. These are local task-flow extensions, not a new visual world or a request to replace DESIGN.md. Verify disconnected states, genuine local D1 persistence, version conflicts, report identity, pagination, queue races and keyboard/mobile behavior.

User steering: remove the entire “機會與風險，一起看清楚。” research-note panel and remove the “資料連線” navigation/page. Keep necessary unavailable/bridge status beside the relevant operations, with no replacement connection page.

## One-month research extension · 2026-11-06

User confirmed direct implementation. Preserve the incumbent world and three destinations. Market candles refresh with source timestamps without rebuilding the chart; completed reports retain immutable evidence. The report reader gains a five-level rating, plain-language explanation, conditional 30-day outlook, interactive historical candles with RSI/MACD, news impact paragraphs and expandable dated evidence for financials, market, flows, insiders and Call/Put sentiment. Missing data withholds unsupported ratings; options research does not enable options trading. Verify four widths, long text/tables, chart refresh and interactions, disconnected/error/gap states. This is an extension; no new identity, comp or system rewrite.
