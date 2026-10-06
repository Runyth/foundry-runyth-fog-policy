# Validation Report

Release: **Runyth Fog Policy 1.0.0**

Validation date: **2026-10-06**

## Automated gates

| Gate | Result |
| --- | --- |
| JavaScript syntax | PASS |
| JSON parsing | PASS |
| English/German localization key parity | PASS |
| Runtime relative-import existence | PASS |
| Manifest path/version validation | PASS |
| Unit tests | PASS — 13/13 |
| Runtime build | PASS |
| Install ZIP structure and runtime-file verification | PASS |
| Source ZIP `.git` history verification | PASS |
| Documentation ZIP `module.json` exclusion | PASS |
| ZIP CRC/integrity checks | PASS |
| Deterministic rebuild comparison | PASS — byte-identical archives from unchanged source state |
| npm dependency audit | PASS — 0 vulnerabilities, no third-party dependencies |

## Toolchain

- Node.js: 22.16.0
- npm: 10.9.2
- Python: 3.13.5
- Git: 2.47.3
- ZIP implementation used by packaging: Python standard-library `zipfile`

## Tested behavior outside Foundry

Automated tests cover:

- managed versus exempt/compendium Scene classification;
- idempotent repair selection;
- compliant/non-compliant audit classification;
- flat and nested `fog.exploration` update enforcement;
- unrelated Scene updates remaining unchanged;
- pending Scene-exemption updates;
- disabling exemption support globally;
- deterministic batching helper behavior;
- manifest identity, compatibility bounds, ES-module declaration, and localization declaration.

Static release validation additionally confirms that packaged manifest paths and critical runtime files exist and that the three archives follow their required boundaries.

## Live Foundry validation

**Not performed in this build environment.** No claim is made that a browser/server Foundry v13 instance was launched here. The repository includes `docs/manual-test-checklist.md` for the remaining live acceptance matrix, including multi-GM, import, Scene creation/update, dashboard, exemption, purge, reload, and uninstall behavior.

The implementation was designed against the official Foundry VTT v13 public API documentation and intentionally declares Foundry v13 as both its minimum and maximum supported major version.
