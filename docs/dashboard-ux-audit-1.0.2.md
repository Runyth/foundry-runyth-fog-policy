# Dashboard UX Audit — Runyth Fog Policy 1.0.2

## Scope

This audit re-evaluates the v1.0.1 dashboard specifically for window persistence, narrow-window usability, information architecture, Foundry v13 ApplicationV2 integration, and preservation of large-world performance.

## Findings and mitigations

| Finding | v1.0.1 behavior | v1.0.2 mitigation |
| --- | --- | --- |
| Window geometry was not persistent | ApplicationV2 position existed only for the current instance | Hidden client setting stores stable geometry; writes are debounced and flushed on pre-close |
| Saved coordinates could become invalid after display changes | No persisted coordinates existed, so no safe-restore policy existed either | Pure geometry normalizer clamps size/position to current viewport |
| Permanent left filter sidebar consumed scarce width | Search, status/fog filters, folder picker, and selection actions were nested in a fixed sidebar | Flat full-width search + quick filters + on-demand folder drawer + separate selection toolbar |
| Folder controls were always visually present | Hierarchical picker occupied dashboard area even when irrelevant | Folder hierarchy remains virtualized but is hidden until Scene Folders is requested |
| Backup/import-export competed with primary workflow | Transfer details were open by default | Transfer section is collapsed by default |
| Fixed summary columns did not adapt well | Seven fixed columns became cramped | Auto-fit responsive counter grid |
| Scene table required several simultaneous columns | Narrow windows became difficult to scan | Responsive compact metadata hides redundant columns below 760px |
| No in-app usage guide | Workflow knowledge depended on external docs | ApplicationV2 header Help control opens dedicated localized help window |

## Foundry v13 integration decisions

- ApplicationV2 exposes a public `position` lifecycle and `_onPosition`/`_preClose` hooks. These are used rather than polling DOM geometry.
- `window.controls` is the v13-native mechanism for application header controls; the help action is declared there and resolved through the ApplicationV2 action map.
- Geometry is client-scoped because Foundry client settings are intended for device-specific preferences such as display/performance state.
- Scene and folder documents remain sourced from Foundry's already-materialized world collections. The module virtualizes DOM rendering rather than adding fake server-side lazy loading.

## Performance constraints retained

- fixed-row Scene virtualization;
- fixed-row folder virtualization;
- cached Scene/folder search records;
- debounced search;
- no dashboard animations/transitions;
- bounded Scene update batches;
- bounded FogExploration discovery;
- no native dropdown containing all Scenes/folders;
- debounced window-geometry persistence.

## Residual manual acceptance items

The following require a real Foundry v13 browser runtime:

- drag/resize persistence across close/reopen and full browser reload;
- correct title-bar Help control rendering in Foundry's native frame;
- minimum/maximum resizing behavior under Foundry's window constraints;
- keyboard focus and screen-reader behavior in the final rendered frame;
- responsive layout under Foundry theme/UI scaling and browser zoom.
