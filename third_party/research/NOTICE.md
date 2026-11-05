# Research source attribution

This project installs research workflows from the following user-selected repositories.
Exact commits and installed skill paths are recorded in `config/research-sources.json`.

- https://github.com/longbridge/skills — MIT
- https://github.com/tauricresearch/tradingagents — Apache-2.0
- https://github.com/openbq-org/OpenBB — Apache-2.0; this is the requested fork, not a substitution of the official repository
- https://github.com/ZhuLinsen/daily_stock_analysis — MIT
- https://github.com/xbtlin/ai-berkshire — MIT

The corresponding upstream LICENSE files are included in this directory. Native
skill packages are copied into `.agents/skills/`; where necessary only their
frontmatter identifiers are normalized to hyphens and OpenBB names are prefixed.
The rest of the upstream checkouts are retained in ignored project-local storage.
Packages installed as dependencies retain their own licenses and metadata.

No endorsement, brokerage connection, market-data entitlement or model subscription
is implied by installation. Third-party skill instructions remain subordinate to
the user's requirements and applicable project instructions.
