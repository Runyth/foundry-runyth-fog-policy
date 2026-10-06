# Architecture

## Goals

Runyth Fog Policy turns a per-Scene Foundry configuration into a reliable world-level policy without modifying Foundry core or storing state in the module installation directory.

## Components

| Component | Responsibility |
| --- | --- |
| `scripts/main.js` | Lifecycle hooks, API exposure, startup repair |
| `scripts/settings.js` | World/client settings registration and policy-setting reads |
| `scripts/policy-core.js` | Pure policy decisions and batch-update construction |
| `scripts/policy.js` | Foundry-facing persistence, cleanup, and GM operations |
| `scripts/dashboard.js` | GM-only ApplicationV2 dashboard and restricted settings-menu registration |
| `templates/dashboard.hbs` | Dashboard markup |
| `styles/runyth-fog-policy.css` | Dashboard styles |
| `lang/*.json` | Localization |

## Enforcement flow

### Existing world Scenes

On `ready`, only the designated active GM performs startup repair. This prevents duplicate database operations when multiple GMs or assistants are connected.

The repair computes all non-compliant managed Scenes, then performs one `Scene.updateDocuments` batch with `fog.exploration = false`.

### New/imported world Scenes

`preCreateScene` runs only on the initiating client. The pending Scene document is modified with `updateSource`, the supported Foundry mechanism for changing pending document data before creation.

Compendium Scene documents are ignored. A compendium Scene imported into the World is a new world Scene and is therefore enforced.

### Scene updates

`preUpdateScene` inspects attempts to set `fog.exploration = true`. If the Scene will remain managed after the pending change, the requested value is changed to `false` before persistence.

`createScene` and `updateScene` also invoke a lightweight active-GM repair check. These post-operation hooks are defensive fallbacks and normally perform no write because the pre-operation enforcement already produced a compliant document.

## Exemptions

Exemptions are stored on the Scene as:

```text
flags.runyth-fog-policy.exempt = true
```

This is world data, survives module updates/reinstalls, and follows the Scene during normal Foundry export/import workflows.

When the global **Allow per-Scene exemptions** setting is off, exemption flags are ignored without deleting them.

## Stored Fog Exploration cleanup

Saved map memory lives in `FogExploration` world documents keyed by Scene and User. Cleanup is intentionally separate from policy enforcement because deletion is destructive.

The purge workflow:

1. enumerates managed Scenes and World users;
2. loads FogExploration documents using the public `FogExploration.load({scene, user})` API with bounded concurrency;
3. combines those results with already-loaded FogExploration collection entries;
4. deletes discovered document IDs in batches of 100;
5. updates each affected Scene's public `fog.reset` timestamp;
6. reinitializes the active canvas fog manager when appropriate.

## Data ownership

The module stores only:

- Foundry world settings;
- optional namespaced Scene exemption flags.

It writes no mutable campaign data into `Data/modules/runyth-fog-policy/`, so reinstalling or migrating the module does not lose policy state that belongs to the World.

## API references

- <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.Scene.html>
- <https://foundryvtt.com/api/v13/modules/hookEvents.html>
- <https://foundryvtt.com/api/v13/classes/foundry.abstract.DataModel.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>
