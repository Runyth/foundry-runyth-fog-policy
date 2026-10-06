# Changelog

All notable changes to **Runyth Fog Policy** are documented here.

## 1.0.0 - 2026-10-06

### Added

- Initial production release for Foundry VTT v13.
- World-level strict Fog Exploration policy.
- Idempotent active-GM bulk repair for existing world Scenes.
- Pre-create enforcement for future and imported world Scenes.
- Pre-update enforcement that prevents managed Scenes from re-enabling persistent Fog Exploration.
- Defensive post-create/post-update active-GM repair.
- Optional per-Scene exemptions stored as namespaced Foundry flags.
- GM-only ApplicationV2 dashboard with audit, repair, and exemption controls.
- Explicit confirmed cleanup of stored per-user Fog Exploration records.
- English and German localization.
- Public module API for audit, repair, cleanup, exemption management, and dashboard access.
- Automated tests, static validation, deterministic packaging, archive verification, and CI workflow.
- Three release archives: installable, source including `.git`, and documentation/audit without `module.json`.
