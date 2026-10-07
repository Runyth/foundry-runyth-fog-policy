# Validation Report

Release: **Runyth Fog Policy 1.0.2**

Validation date: **2026-10-07**

## Automated gates

| Gate | Result |
| --- | --- |
| JavaScript syntax | PASS |
| JSON parsing | PASS |
| English/German localization key parity | PASS |
| Runtime relative-import existence | PASS |
| Manifest path/version validation | PASS |
| Unit/static/performance tests | PASS — 43/43 |
| Dashboard geometry tests | PASS — persistence-state extraction, viewport clamping, first-open centering, very small viewport recovery |
| Dashboard UX static guards | PASS — native ApplicationV2 header Help control, flat responsive layout, virtualized Scene/folder lists, no large native selects |
| Synthetic scale coverage | PASS — 10,000 Scenes + 500 nested folders; ~57 ms in the recorded clean pre-tag run |
| Runtime build | PASS |
| Install ZIP structure and critical runtime-file verification | PASS |
| Source ZIP `.git` history verification | PASS |
| Documentation ZIP `module.json` exclusion | PASS |
| ZIP CRC/integrity checks | PASS |
| npm dependency audit | PASS — 0 vulnerabilities, no third-party dependencies |
| Git object integrity | PASS — `git fsck --full` |
| Fresh source extraction/rebuild | PASS — clean `master`, exact `v1.0.2`, full check successful |
| Deterministic rebuild comparison | PASS — all three release ZIPs reproduced byte-for-byte |

## Toolchain

- Node.js: 22.16.0
- npm: 10.9.2
- Python: 3.13.5
- Git: 2.47.3
- ZIP implementation used by packaging: Python standard-library `zipfile`

## Automated behavior coverage

The automated suite covers, among other cases:

- managed versus exempt/compendium Scene classification;
- idempotent repair selection;
- compliant/non-compliant audit classification;
- flat and nested `fog.exploration` update enforcement;
- unrelated Scene updates remaining unchanged;
- pending Scene-exemption updates;
- disabling exemption support globally;
- resilient batch split/isolation after a failed bulk operation;
- structured/quoted Scene search and literal handling of unknown field prefixes;
- folder filtering and selected-only filtering;
- hierarchy path construction, descendants, and cyclic/corrupt folder termination;
- backup and selection schema generation;
- same-World stable-ID matching;
- cross-World unique name/folder-path matching;
- ambiguous cross-World matching refusal;
- malformed/duplicate import rejection;
- known-setting type validation;
- 10,000-Scene/500-folder indexing and filtering regression coverage;
- explicit disabling of costly dashboard animations/transitions;
- virtual-list requirements and absence of large native Scene/folder selects;
- exemption control availability requirements;
- extraction of stable window geometry only;
- valid geometry restoration;
- off-screen geometry clamping after monitor/resolution changes;
- native first-open centering when no prior coordinates exist;
- small and extremely small viewport recovery;
- hidden client-scope dashboard geometry setting;
- debounced ApplicationV2 position persistence with pre-close flushing;
- native ApplicationV2 header Help control and dedicated Help application;
- responsive flat dashboard structure with on-demand folder drawer;
- manifest identity, compatibility bounds, ES-module declaration, and localization declaration.

Static release validation additionally confirms that packaged manifest paths and critical runtime files exist and that the three archives follow their required boundaries.

## Dashboard UX review

`docs/dashboard-ux-audit-1.0.2.md` documents the v1.0.2 dashboard re-analysis. The permanent nested filter sidebar was replaced with a flatter search/quick-filter/selection workflow, the hierarchical Scene-folder picker became an on-demand virtualized drawer, backup/import-export is collapsed by default, and responsive Scene rows retain key information at narrow widths.

Window geometry is now stored in a hidden client-scope setting and written through a debounced ApplicationV2 position lifecycle. Restored geometry is normalized against the current viewport so monitor, resolution, zoom, or desktop-layout changes cannot intentionally restore an inaccessible saved rectangle.

## Foundry v13 API review

The implementation was re-checked against the official Foundry v13 ApplicationV2 API. It uses `_onPosition` for post-position handling, the awaited `_preClose` lifecycle for final persistence flushing, and the native `window.controls`/ApplicationV2 action mechanism for the Help header control. It does not patch private Foundry frame markup.

## Live Foundry validation

**Not performed in this build environment.** No claim is made that a browser/server Foundry v13 instance was launched here. The repository includes `docs/manual-test-checklist.md` for the remaining live acceptance matrix, including drag/resize persistence across reloads, native header-control rendering, narrow-window behavior under Foundry themes/UI scaling, keyboard accessibility, multi-GM coordination, Scene creation/import/update, large nested folders, backup/import-export, purge behavior, and interoperability.

The module intentionally declares Foundry v13 as both its minimum and maximum supported major version.
