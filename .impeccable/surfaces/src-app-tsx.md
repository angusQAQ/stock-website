---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css","src/StockChart.tsx","src/AnalysisPanel.tsx","src/PublicStockQuote.tsx","src/ResearchReport.tsx"]
---

# Northstar research workspace

Target: `src/App.tsx`; related: `src/styles.css`, `src/StockChart.tsx`, `src/AnalysisPanel.tsx`, `src/PublicStockQuote.tsx`, `src/ResearchReport.tsx`.

Mode: Operate. Build path: code-led (app screen; no standing build-path preference is set).

## Direction contract

**THESIS:** A clear, confident personal investment workspace, using the user's pinned Longbridge direction. Replace the fixed dark terminal shell with a bright, horizontally navigated brokerage site. Preserve the actual research, ledger and on-demand analysis workflows.

**OWN-WORLD:** White and cool pale grey surfaces, near-black sans-serif headings and numbers, vivid orange primary actions with dark text, dark orange small links, subtle dividers and rounded controls. Gain, loss and connection colours retain distinct meanings. Exact Longbridge website styles remain unverified because its URL is denied by the environment proxy; these are authored Northstar implementation decisions, not measured reference values.

**STORY:** Choose a stock, inspect its quote and source time, select a horizon and risk profile, then request research. Cash and holdings remain close to the analysis. Missing connections never masquerade as financial data.

**FIRST VIEWPORT:** A white top bar holds Northstar, three navigation items, search and a record-funds action. A bold market heading leads into four quiet ETF summaries. Below, a compact stock list, wide quote/chart/research column and asset column form the workspace. On narrow screens the list becomes a horizontal stock strip; quote and analysis lead the vertical flow. The signature move is a single orange selection language connecting active navigation, chosen ticker, time range and explicit analysis action, without colouring inactive data.

Current browser steering supersedes the promotional heading above: remove its title/subtitle and the analysis introduction. A compact source/time row now leads into ETF data and the research columns. Pages without an account API uses a compact official TradingView ticker strip and chart; connected Yahoo mode retains its ETF summaries. Preserve the incumbent white/orange world and three destinations. Inspect the user's 790×730 and 1466×730 viewports as well as standard desktop/mobile. Official-host denial is a real error state with recovery, not proof of live chart availability; local contract frames contain no market data.

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

## Beginner teaching extension · 2026-11-07 (current)

Latest user steering supersedes the former ledger and three-destination flow above. Preserve the incumbent tokens and white/orange visual identity. Two destinations: 看懂市場 and 教學報告. Remove all asset UI, funds actions, sizing and right asset column; preserve stored records. The chart uses the recovered width. Add clear D / 5D / W / M candle durations, interactive general causal lessons, simple first explanations, counterarguments and expandable data. Four cited plan lines use different colors and labels confined to the price axis, never over candles. Paragraph source footnotes open actual source URLs. Analyze remains clickable without a backend, opening an honest copy-to-Codex guide; automatic reports still require the API/Mac. This is a product/content extension, not replacement art direction or permission to rewrite DESIGN.md. Verify 1466×730, 790×730, 1440, 390 and 320 widths, including report chart, causal explanation, references, copy guide and source errors.

## Sidebar price extension · 2026-11-07

User browser comments remove the global AI status/recheck banner and request auto-updating current prices in the selected stock list. Preserve the accepted world and two destinations. Public mode uses complete official single-ticker frames, with existing independent symbol buttons, source attribution and per-symbol errors/retry. Reserve readable quote width on desktop and a locally scrolling quote strip on narrow screens. No simulated production prices or forced iframe remount on the clock. API mode retains five-second quotes. Verify 1466×730, 790×730, 1440, 390 and 320; official upstream is blocked in cloud, so contract fixtures are explicitly labelled and are not evidence of actual source data. Cursor connection request is a separate credential/backend task; do not add a replacement global status banner or mark AI reports ready from a supplied key.

Latest browser steering additionally removes the entire “股價為甚麼會變？” general lesson panel and renames the analysis heading “股票分析”. Preserve the plain-language explanations and interactive causal evidence inside actual reports; do not restore a separate lesson panel.

## Report decision extension · 2026-11-07

Latest request makes the 股票分析 report clear and visual, with four data-grounded factors (earnings, rates/jobs, energy, geopolitics), then a final integrated entry decision: now/wait/outlook/triggers and invalidation. This extends the report, not the deleted general lesson panel. Preserve identity and price chart. Add report-local navigation, interactive source-cited arrow diagrams and dated numerical evidence, then an explicit final decision with expandable confirmation/invalidations. Render real report fields only; preserve old reports without fabricated diagrams or guidance. Missing data cannot become fake impact scores, directions or entry signals. Verify all widths, four factor states, long text, gap/legacy cases, source clicks, jump links, trigger disclosure and original charts. Code-led ordinary extension; no new comp, typography or system rewrite.
