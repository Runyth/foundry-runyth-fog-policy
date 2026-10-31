# Changelog

All notable changes to **Runyth Fog Policy** are documented here.

## 1.0.3 - 2026-10-31

### Changed

- Licensed the program under AGPL-3.0-or-later.
- Published install, source, and documentation archives as `-mod`, `-src`, and `-doc`.
- Published the module from `foundry-runyth-fog-policy`.

## 1.0.2 - 2026-10-07

### Added

- Client-local dashboard window geometry persistence for `left`, `top`, `width`, and `height`.
- Viewport-safe geometry restoration so display/resolution changes cannot strand the dashboard off-screen.
- A Foundry ApplicationV2 title-bar Help control that opens a dedicated dashboard usage guide.
- Responsive compact Scene-row metadata for narrower dashboard widths.
- Dedicated window-state core tests and static UI regression tests.

### Changed

- Reworked the dashboard from a permanent filter sidebar into a flatter search/quick-filter/selection workflow.
- Scene-folder filtering now opens as an on-demand full-width drawer while retaining its searchable virtualized hierarchy.
- Backup/import-export controls are collapsed by default so they do not compete with the primary audit/selection workflow.
- Summary cards use responsive auto-fit layout instead of a fixed seven-column row.
- Scene table columns collapse intelligently at narrower widths while keeping Scene identity, folder context, status, and exemption control usable.
- Window-position writes are debounced to avoid client-storage churn during drag/resize operations.

### Fixed

- Dashboard size and position now survive closing/reopening and client reloads on the same browser/client.
- Saved window coordinates are sanitized before restore, preventing inaccessible off-screen windows after monitor topology, resolution, or browser viewport changes.
- The dashboard no longer devotes a large permanent column to filters when the window is narrow.

## 1.0.1 - 2026-10-06

### Added

- Searchable, scrollable hierarchical Scene-folder filtering with optional descendant inclusion.
- Structured Scene search fields: `name:`, `folder:`, `status:`, `fog:`, `exempt:`, and `id:` with quoted-value support.
- Bulk selection workflows for filtered Scenes, inversion, and clearing.
- Bulk repair, exemption, management, and selected-Scene FogExploration purge actions.
- Policy-state backup export/import with selectable restore options and automatic pre-import safety backup.
- Lightweight Scene-selection export/import.
- Same-world stable-ID matching and cross-world unique name/folder-path fallback matching.
- Fixed-row virtualization for both Scene and folder lists.
- Synthetic scale test covering 10,000 Scenes and 500 nested folders.

### Changed

- Bulk Scene writes now use bounded batches with recursive split-on-failure isolation.
- FogExploration purge discovery now uses bounded-memory lazy query scheduling instead of materializing the full Scene × User query matrix.
- Dashboard filtering operates on cached normalized Scene/folder indices rather than repeatedly scanning live documents or rendering full tables.
- Costly dashboard transitions/animations are explicitly disabled.
- Dashboard summary updates no longer rescan every Scene for simple selection changes.
- Automatic and manual failures now provide explicit `RFP-*` error codes, persistent actionable GM notifications where appropriate, and detailed console diagnostics.
- Public API bulk methods now return partial-failure counts instead of implying all-or-nothing success.

### Fixed

- A single failing Scene can no longer abort every otherwise-valid Scene update in a bulk repair.
- Very large world repair operations no longer send one unbounded `Scene.updateDocuments` payload.
- Very large dashboard Scene collections no longer produce one DOM row per Scene.
- Importing world settings now rolls back settings already changed when a later setting write fails.
- Corrupt/cyclic Scene-folder relationships no longer cause an infinite traversal or silently hide the affected folders from the picker.
- Source ZIP Git status and byte-level reproducibility no longer depend on whether the ZIP extractor preserves Unix executable bits.

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
