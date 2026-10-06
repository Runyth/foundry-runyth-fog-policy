# Validation Report

Release: **Runyth Fog Policy 1.0.1**

Validation date: **2026-10-06**

## Automated gates

| Gate | Result |
| --- | --- |
| JavaScript syntax | PASS |
| JSON parsing | PASS |
| English/German localization key parity | PASS |
| Runtime relative-import existence | PASS |
| Manifest path/version validation | PASS |
| Unit/static/performance tests | PASS — 34/34 |
| Synthetic scale coverage | PASS — 10,000 Scenes + 500 nested folders; ~45 ms in the recorded pre-tag run |
| Runtime build | PASS |
| Install ZIP structure and critical runtime-file verification | PASS |
| Source ZIP `.git` history verification | PASS |
| Documentation ZIP `module.json` exclusion | PASS |
| ZIP CRC/integrity checks | PASS |
| npm dependency audit | PASS — 0 vulnerabilities, no third-party dependencies |
| Git object integrity | PASS — `git fsck --full` |
| Fresh source extraction/rebuild | PASS — final tagged source rebuilt successfully |
| Deterministic rebuild comparison | PASS — all three final tagged archives reproduced byte-for-byte |

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
- manifest identity, compatibility bounds, ES-module declaration, and localization declaration.

Static release validation additionally confirms that packaged manifest paths and critical runtime files exist and that the three archives follow their required boundaries.

## Release hardening review

`docs/hardening-audit-1.0.1.md` documents the code-base re-analysis and mitigations introduced in this patch, including bounded update batches, partial failure reporting, virtualized large lists, cached search indices, bounded FogExploration discovery, strict import validation, safer settings restoration, active-GM coordination, and UI-state hardening.

## Live Foundry validation

**Not performed in this build environment.** No claim is made that a browser/server Foundry v13 instance was launched here. The repository includes `docs/manual-test-checklist.md` for the remaining live acceptance matrix, including multi-GM coordination, Scene creation/import/update, deeply nested folders, backup/import-export, purge behavior, dashboard virtualization, and interoperability.

The implementation was designed and re-checked against the official Foundry VTT v13 public API documentation and intentionally declares Foundry v13 as both its minimum and maximum supported major version.
