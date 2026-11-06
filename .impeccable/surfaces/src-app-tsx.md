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

**FIRST VIEWPORT:** A white top bar holds Northstar, four navigation items, search and a record-funds action. A bold market heading leads into four quiet ETF summaries. Below, a compact stock list, wide quote/chart/research column and asset column form the workspace. On narrow screens the list becomes a horizontal stock strip; quote and analysis lead the vertical flow. The signature move is a single orange selection language connecting active navigation, chosen ticker, time range and explicit analysis action, without colouring inactive data.

**FORM:** User-pinned reference: Longbridge Hong Kong public website. No concept roll or image comp; this is the requested competitor-like path and a working app. `seed: none (user-pinned direction; launcher unavailable)`.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Evidence and limits

The reference URL was retried on 2026-11-06 and the environment proxy still refused CONNECT with 403. The user subsequently repeated the instruction to implement the style and layout; continue with the stated visual interpretation rather than waiting on an upload. Report reference fidelity as unverified. No Longbridge branding, brokerage claims, promotional copy, customer metrics or website assets are imported. The official skills repository's logo was viewed only as supplementary brand evidence, not as evidence of the current website layout.

Preserve GitHub Pages frontend-only states, no simulated production prices, explicit model invocation, manual USD ledger, no brokerage execution and the existing permanent URL.
