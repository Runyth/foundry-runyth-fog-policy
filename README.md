# Runyth Fog Policy 1.0.1

**Runyth Fog Policy** is a Foundry VTT v13 module for enforcing a world-level Fog of War policy in which managed Scenes do **not** retain persistent Fog Exploration.

Release 1.0.1 hardens the original policy engine and replaces the simple all-Scene dashboard with a scalable bulk-management interface designed for worlds containing thousands of Scenes and deeply nested Scene folders.

## Core behavior

With the default settings the module:

- repairs existing world Scenes so `fog.exploration` is `false`;
- creates/imports future world Scenes with Fog Exploration disabled;
- prevents managed Scenes from being switched back to persistent Fog Exploration;
- allows explicit per-Scene exemptions;
- exposes bulk audit, filtering, selection, repair, exemption, backup/import-export, and purge tools;
- keeps deletion of already-stored per-user Fog Exploration records explicit and confirmed.

The module is system-agnostic and has no required modules or third-party npm dependencies.

## Foundry compatibility

| Item | Support |
| --- | --- |
| Foundry VTT | v13 |
| Minimum | 13 |
| Verified | 13 |
| Maximum | 13 |
| Game systems | System-agnostic |
| Required modules | None |

The v13 maximum is intentional. Foundry v14 changes the Scene fog model, so this release refuses to load there rather than silently applying v13 assumptions.

## Installation

Extract the installable ZIP so the result is:

```text
Data/modules/runyth-fog-policy/module.json
```

Restart Foundry if necessary, enable **Runyth Fog Policy** in the World, and reload the World.

## Dashboard

As a GM, open:

**Game Settings → Configure Settings → Module Settings → Runyth Fog Policy → Open Fog Policy Dashboard**

The v1.0.1 dashboard provides:

- cached audit counters for total, managed, compliant, non-compliant, exempt, filtered, and selected Scenes;
- free-text search with quoted terms;
- structured query fields: `name:`, `folder:`, `status:`, `fog:`, `exempt:`, and `id:`;
- status and Fog Exploration filters;
- a searchable, scrollable hierarchical Scene-folder picker;
- optional inclusion of nested folders;
- select filtered, invert filtered selection, and clear selection;
- bulk repair, exemption, management, and stored-fog purge operations;
- policy-state backup export/import;
- lightweight Scene-selection export/import.

Both the Scene list and folder list are fixed-row virtualized. Only visible rows plus a small overscan buffer exist in the DOM. There are no dashboard animations or transitions that scale with list size.

## Bulk update resilience

Scene changes are sent through bounded batches rather than one unbounded request. If Foundry rejects a batch, Runyth Fog Policy recursively splits only that failed batch until the failing Scene update is isolated.

This means one malformed or otherwise unmodifiable Scene does not cause every other Scene in the operation to be discarded. Partial failures are surfaced with permanent GM notifications and detailed `RFP-*` error information in the browser console.

## Backup and import/export

The dashboard can export either:

- the **currently selected Scenes**; or
- **all Scenes matching the active filters**.

A policy backup stores:

- Scene identity;
- Scene name and folder path for cross-world fallback matching;
- `fog.exploration` state;
- Runyth Fog Policy exemption state;
- optionally, the module's world policy settings.

Import options independently control whether to restore:

- Scene exemptions;
- Fog Exploration state where the active policy permits it;
- included world settings;
- matched Scenes into the current dashboard selection.

A pre-import safety backup can be downloaded automatically before changes are applied. Setting restoration attempts rollback if a later setting write fails.

**Important:** a policy backup does not contain the large per-user `FogExploration` explored-map payloads. It can restore policy/configuration state; it cannot resurrect fog-history records after those records were purged.

Selection exports contain only Scene identity/name/folder-path metadata and never change Scene settings when imported.

### Import matching

When importing back into the same Foundry World, stable Scene IDs are preferred. Across different Worlds, IDs are not trusted; matching falls back to a unique combination of Scene name and hierarchical folder path. Ambiguous and unmatched entries are reported and not modified.

## Stored exploration cleanup

Disabling Scene Fog Exploration is separate from deleting historical `FogExploration` documents. Purge is therefore never automatic.

For selected Scenes, purge:

1. uses already-loaded FogExploration documents where available;
2. lazily checks remaining Scene/User pairs through `FogExploration.load({scene, user})` with bounded concurrency and bounded memory;
3. deletes discovered records in resilient batches;
4. updates Scene `fog.reset` timestamps;
5. refreshes the active canvas fog state when applicable;
6. reports discovery, deletion, and reset failures separately instead of claiming an incomplete purge succeeded.

## Settings

| Setting | Default | Purpose |
| --- | ---: | --- |
| Enable strict Fog Exploration policy | On | Master policy switch |
| Repair existing Scenes when the world loads | On | Active GM bulk-repairs non-compliant Scenes at startup |
| Enforce on newly created and imported Scenes | On | Forces future world Scenes to persistent exploration off |
| Prevent managed Scenes from re-enabling Fog Exploration | On | Enforces policy during Scene updates |
| Allow per-Scene exemptions | On | Lets selected Scenes opt out |
| Notify me after automatic repair | On | Client-side notification for the active GM |

## Public API

```javascript
const api = game.modules.get("runyth-fog-policy")?.api;

const audit = api.audit();
await api.repair({ sceneIds: [sceneId] });
await api.setScenesExempt([sceneId], true);
await api.purgeStoredExploration({ sceneIds: [sceneId], includeExempt: true });
api.openDashboard();
```

See [`docs/api.md`](docs/api.md) for the complete contract.

## Development

```text
npm ci
npm run lint
npm test
npm run build
npm run package
npm run release:verify
```

Or run all gates:

```text
npm run check
```

## Repository and release conventions

- default branch: `master`;
- semantic versioning;
- capitalized Conventional-Commits-derived messages;
- `Prog:` instead of `Chore:` for repository/tooling work;
- installable ZIP contains one `runyth-fog-policy/` module directory;
- source ZIP contains the complete repository including `.git` history;
- documentation ZIP intentionally contains no `module.json`;
- deterministic packaging for unchanged source state.

## Upstream API references

- Scene data: <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>
- Scene collection: <https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Scenes.html>
- Folder document: <https://foundryvtt.com/api/v13/classes/foundry.documents.Folder.html>
- ApplicationV2: <https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html>
- Document hooks: <https://foundryvtt.com/api/v13/modules/hookEvents.html>
- FogExploration: <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>
- ClientSettings: <https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html>
- Module development: <https://foundryvtt.com/article/module-development/>

## License

MIT. See [`LICENSE`](LICENSE).
