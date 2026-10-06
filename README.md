# Runyth Fog Policy 1.0.0

**Runyth Fog Policy** is a Foundry VTT v13 module for enforcing a world-level Fog of War policy in which managed Scenes do **not** retain persistent Fog Exploration.

Its default policy is deliberately simple:

- repair all existing world Scenes so `fog.exploration` is `false`;
- create/import future world Scenes with Fog Exploration disabled;
- prevent managed Scenes from being switched back to persistent Fog Exploration;
- allow explicit per-Scene exemptions when the GM wants them;
- provide an audit/repair dashboard;
- provide a separate, confirmed operation for deleting already-stored per-user Fog Exploration records.

The module is system-agnostic and does not depend on D&D 5e or any other game system.

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

Extract the installable ZIP into Foundry's user-data module directory so the result is:

```text
Data/modules/runyth-fog-policy/module.json
```

Restart Foundry if it was running, enable **Runyth Fog Policy** in the World, then reload the World.

## Default behavior

With the default settings, the active GM performs one idempotent bulk repair when the World becomes ready. Every non-exempt world Scene is changed to:

```text
fog.exploration = false
```

Future Scene creation and imports are intercepted before persistence so they receive the same value. A later attempt to re-enable Fog Exploration on a managed Scene is corrected before it is stored, with a post-operation active-GM repair as a defensive fallback.

Compendium Scene documents are not modified. A Scene imported from a compendium into the World becomes a world Scene and is then subject to the policy.

## Dashboard

As a GM, open:

**Game Settings → Configure Settings → Module Settings → Runyth Fog Policy → Open Fog Policy Dashboard**

The dashboard shows:

- total world Scenes;
- managed Scenes;
- compliant Scenes;
- Scenes needing repair;
- exempt Scenes;
- per-Scene current Fog Exploration state;
- bulk **Repair all managed Scenes**;
- per-Scene exemption controls;
- **Purge stored exploration** for permanent cleanup of saved exploration records.

## Stored exploration cleanup

Disabling Scene Fog Exploration is not the same operation as deleting historical `FogExploration` documents. This module therefore does **not** delete saved exploration automatically.

Use **Purge stored exploration** only when you intentionally want to remove the historical records for all users on managed Scenes. The action:

1. discovers saved exploration per managed Scene and User using Foundry's public `FogExploration.load` API;
2. deletes discovered records through the public document deletion API in bounded batches;
3. updates the Scene fog-reset timestamp;
4. refreshes the active canvas fog state when applicable.

This operation is irreversible without restoring a World backup.

## Settings

| Setting | Default | Purpose |
| --- | ---: | --- |
| Enable strict Fog Exploration policy | On | Master policy switch |
| Repair existing Scenes when the world loads | On | Active GM bulk-repairs non-compliant Scenes at startup |
| Enforce on newly created and imported Scenes | On | Forces new world Scenes to persistent exploration off |
| Prevent managed Scenes from re-enabling Fog Exploration | On | Enforces policy during Scene updates |
| Allow per-Scene exemptions | On | Lets selected Scenes opt out via dashboard |
| Notify me after automatic repair | On | Client-side notification for the active GM |

## Public API

After `init`, other modules and macros can use:

```javascript
const api = game.modules.get("runyth-fog-policy")?.api;

const audit = api.audit();
await api.repair();
await api.setSceneExempt(sceneId, true);
await api.purgeStoredExploration();
api.openDashboard();
```

See [`docs/api.md`](docs/api.md) for the complete contract.

## Development

The project deliberately has no third-party npm runtime or development dependencies.

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

Release archives are written under `dist/releases/`.

## Repository and release conventions

- default branch: `master`;
- semantic versioning;
- capitalized Conventional-Commits-derived messages;
- `Prog:` is used for repository/tooling work instead of `Chore:`;
- installable ZIP contains one `runyth-fog-policy/` module directory;
- source ZIP contains the complete repository including `.git` history;
- documentation ZIP contains documentation/audit material and intentionally **does not contain `module.json`**;
- packaging is deterministic for unchanged source state.

## Upstream API references

- Foundry v13 Scene data: <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>
- Foundry v13 Scene document: <https://foundryvtt.com/api/v13/classes/foundry.documents.Scene.html>
- Foundry v13 document hooks: <https://foundryvtt.com/api/v13/modules/hookEvents.html>
- Foundry v13 FogManager: <https://foundryvtt.com/api/v13/classes/foundry.canvas.perception.FogManager.html>
- Foundry v13 FogExploration: <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>
- Foundry v13 FogExploration data: <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.FogExplorationData.html>
- Foundry v13 ClientSettings: <https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html>
- Foundry module development: <https://foundryvtt.com/article/module-development/>

## License

MIT. See [`LICENSE`](LICENSE).
