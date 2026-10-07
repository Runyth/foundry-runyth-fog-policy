# Architecture

## Goals

Runyth Fog Policy turns a per-Scene Foundry configuration into a resilient world policy while remaining system-agnostic, non-invasive, and scalable to large Scene libraries.

## Components

| Component | Responsibility |
| --- | --- |
| `scripts/main.js` | Lifecycle hooks, API exposure, active-GM startup repair |
| `scripts/settings.js` | World/client settings |
| `scripts/policy-core.js` | Pure policy decisions |
| `scripts/policy.js` | Foundry document persistence, resilient batch writes, purge, restore |
| `scripts/core/batch-core.js` | Bounded concurrency and split-on-failure batch isolation |
| `scripts/core/filter-core.js` | Query normalization, structured search, cached filtering |
| `scripts/core/scene-index-core.js` | Hierarchical folder index and cached Scene records |
| `scripts/core/window-state-core.js` | Pure dashboard geometry extraction, validation, and viewport clamping |
| `scripts/core/backup-core.js` | Backup/selection schemas, validation, cross-world matching |
| `scripts/errors.js` | Classified operational errors and GM-facing reporting |
| `scripts/services/backup-service.js` | Backup/selection import-export orchestration |
| `scripts/services/file-service.js` | Bounded JSON file reading and downloads |
| `scripts/ui/virtual-list.js` | Dependency-free fixed-row DOM virtualization |
| `scripts/dashboard.js` | GM-only ApplicationV2 bulk-management dashboard, responsive UI state, geometry persistence |
| `scripts/help.js` | Dedicated ApplicationV2 dashboard help window |
| `templates/dashboard.hbs` | Flat responsive dashboard shell only; large rows are virtualized |
| `templates/help.hbs` | Localized dashboard workflow/reference guide |
| `styles/runyth-fog-policy.css` | Bounded-layout, animation-free dashboard styling |

## Enforcement flow

### Existing world Scenes

At `ready`, only Foundry's active GM performs automatic repair. Non-compliant updates are processed in batches of 100. A failed batch is recursively split until individual failing updates are isolated, allowing unrelated valid Scenes to continue.

### New/imported world Scenes

`preCreateScene` modifies the pending Scene with `updateSource({"fog.exploration": false})` before persistence. Compendium Scene documents themselves are not modified; imported world copies are subject to the world policy.

### Scene updates

`preUpdateScene` intercepts attempts to enable exploration on managed Scenes. Module-originated updates are marked with `runythFogPolicy` and ignored by the defensive post-update hook to avoid redundant work.

`createScene`/`updateScene` retain an active-GM defensive repair path for updates that bypassed the initiating client's pre-hook.

## Dashboard window lifecycle

Dashboard geometry is device-specific UI state and is stored in a hidden Foundry **client-scope** setting as JSON containing only stable `left`, `top`, `width`, and `height` values.

ApplicationV2's public position lifecycle is used as follows:

1. constructor reads and normalizes the client geometry before the first render;
2. `_onPosition` captures non-minimized geometry;
3. writes are debounced so drag/resize pointer movement does not produce one setting write per event;
4. `_preClose` flushes the last stable geometry through the awaited close lifecycle;
5. restore clamps geometry to the current viewport and leaves never-saved `left`/`top` undefined so Foundry can perform native first-open positioning.

A failed client-setting write never blocks closing or policy operations; it is logged with `RFP-UI-POSITION-SAVE` and warned once to the user.

## Dashboard information architecture

The primary dashboard workflow is intentionally flat: status → actions → search/quick filters → optional folder drawer → selection toolbar → Scene list. Backup/import-export is secondary and collapsed by default. This avoids permanently nesting search, folder navigation, and selection controls inside a narrow sidebar.

The Help action is registered through the v13 ApplicationV2 window-control mechanism and opens a separate localized help Application.

## Large-world dashboard architecture

Foundry already holds world Scene documents client-side, so the module does not attempt to lazy-load Scene documents from the server. Instead it minimizes **derived work and DOM work**:

1. Scene and folder metadata are normalized once per dashboard refresh.
2. Hierarchical folder paths and descendant sets are cached.
3. Search operates against normalized cached strings.
4. Search input is debounced.
5. Scene and folder lists are fixed-row virtualized.
6. Only visible rows plus overscan are rendered.
7. Summary counters are cached; selecting one Scene does not rescan all Scenes.
8. No list-row animation or transition is used.
9. The hierarchical folder drawer is not displayed until requested.
10. Window-geometry writes are debounced and independent of Scene-list rendering.

This is the appropriate form of lazy rendering for Foundry's already-materialized World collections.

## Search/filter model

Free-text terms are combined with logical AND. Quoted phrases are supported. Structured fields are:

```text
name:
folder:
status:
fog:
exempt:
id:
```

Folder filtering uses a separately searchable hierarchical list. Selecting a folder may optionally include its descendants.

## Backup model

Two JSON schemas are supported:

- `runyth-fog-policy-backup` — policy/configuration state;
- `runyth-fog-policy-selection` — identity-only selection transfer.

Same-world imports use Scene IDs. Cross-world imports do not trust foreign IDs and instead require a unique Scene-name + hierarchical-folder-path match.

The backup format intentionally does not contain the potentially large binary/base64 FogExploration map payloads.

## Stored Fog Exploration purge

Purge discovery avoids constructing the full Scene × User query matrix in memory. It reuses already-loaded FogExploration records and lazily dispatches only a bounded number of unresolved `FogExploration.load` calls at once.

Deletion and Scene reset writes use the same resilient batch isolation strategy as repair. Discovery, delete, and reset failures are tracked separately.

## Data ownership

Persistent state uses Foundry world settings and namespaced Scene flags. No mutable campaign state is written to the module installation directory.

## API references

- <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Scenes.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.Folder.html>
- <https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html>
- <https://foundryvtt.com/api/v13/modules/hookEvents.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>
