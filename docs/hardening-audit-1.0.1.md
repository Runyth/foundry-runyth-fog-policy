# Hardening Audit — Runyth Fog Policy 1.0.1

Audit date: 2026-10-06

This audit re-reviewed the v1.0.0 implementation with emphasis on failure isolation, large-World behavior, data safety, and GM-facing diagnostics.

## Findings addressed

| Finding | Risk in 1.0.0 | 1.0.1 mitigation |
| --- | --- | --- |
| Unbounded bulk Scene update | A large World could create one oversized update request; one rejection could fail the whole operation | Bounded batches plus recursive split-on-failure isolation |
| Full Scene dashboard rendering | DOM size and render cost increased linearly with Scene count | Fixed-row virtualized Scene list with small overscan |
| Full folder rendering | Deep/large folder trees increased DOM cost | Fixed-row virtualized, scrollable hierarchical folder list |
| Repeated derived-data scans | Selection/summary actions could repeatedly traverse all Scenes | Cached Scene/folder indices and single-pass audit summary |
| Folder-search normalization on each row/keystroke | Repeated Unicode normalization on large folder sets | Cached normalized folder paths plus debounced folder search |
| Scene × User fog query materialization | Purge could allocate a large in-memory query matrix | Lazy bounded queue with at most eight unresolved public loads at once |
| All-or-nothing failure messaging | Successful work could be obscured by one failed document | Explicit updated/failed/missing/discovery/reset counts |
| Generic exceptions | GM received insufficient context | `FogPolicyError`, stable `RFP-*` codes, concise permanent GM notification, detailed console cause |
| Inconsistent active-GM checks | Different hooks could choose coordination differently | Central `isActiveGmClient()` preferring `game.users.activeGM` |
| Unsafe/ambiguous import assumptions | Cross-World IDs are not portable and duplicate/malformed entries could be dangerous | Schema/type/size bounds, duplicate-ID rejection, same-World ID matching only, unique path+name fallback, ambiguity reporting |
| Settings import partial failure | Earlier setting changes could remain after a later write failed | Reverse-order best-effort rollback with rollback-failure reporting |
| Backup included client-only preference | Exported data implied that all included settings were World-restorable | Backup now contains only World-scope policy settings |
| Unsupported search prefix broadened matches | `tag:boss` could silently become `boss` | Unknown prefixes remain literal search text |
| Cyclic/corrupt folder parent data | Traversal could recurse indefinitely or hide folders | Cycle detection, visited sets, finite fallback rendering |
| Exemption button state drift | Generic availability refresh could re-enable controls while exemptions were globally disabled | Shared `data-requires-exemptions` availability rule for row and bulk controls |
| Costly UI effects | Large dashboards could spend time on cosmetic transitions | Dashboard animations/transitions explicitly disabled |

## Large-World strategy

The module intentionally does **not** attempt to lazy-load Foundry World Scene documents from the database because `game.scenes` is already the authoritative in-memory World collection supplied by Foundry. Instead it minimizes module-added cost:

1. construct compact derived Scene records once per dashboard data refresh;
2. index folder hierarchy/path/descendants once;
3. normalize searchable text once;
4. debounce text filtering;
5. keep only visible Scene/folder rows plus overscan in the DOM;
6. keep bulk document writes bounded;
7. keep purge lookup concurrency and memory bounded.

This avoids pretending that module-level database pagination would improve a collection Foundry has already loaded, while still preventing Runyth Fog Policy's own UI and bulk work from scaling poorly.

## Automated scale coverage

The synthetic performance test creates:

- 10,000 Scenes;
- 500 nested Scene folders;
- cached folder paths and Scene search records;
- descendant-folder expansion;
- structured Scene filtering.

The test has a deliberately loose 2.5-second regression ceiling to avoid environment-specific flakiness. Actual runs during this release work were approximately 38–59 ms on the available Node.js test environment. These timings measure pure indexing/filtering logic, **not** live Foundry/browser rendering or network/database latency.

## Residual risks

- Live Foundry v13 browser/server acceptance remains required; automated Node tests mock only pure/core logic.
- Fog purge lookup count is still proportional to targeted Scenes × current users because the documented public `FogExploration.load` API is keyed by Scene/User.
- A third-party module that deliberately enforces the opposite fog value can still create a policy conflict.
- Policy backup JSON does not preserve Foundry's explored-fog image/history payloads; only a normal Foundry World/data backup can restore those after purge.
