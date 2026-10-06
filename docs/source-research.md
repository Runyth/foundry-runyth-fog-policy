# Foundry v13 API Research

Research date: 2026-10-06.

## Scene fog field

Foundry v13 defines:

```text
SceneData.fog.exploration: boolean
```

with the documented meaning: whether fog exploration progress is tracked for the Scene.

Reference:
<https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>

## Pending document creation

Foundry's generic pre-create hook is specialized by document type, such as `preCreateScene`. The pending document may be modified with `updateSource` before persistence.

References:

- <https://foundryvtt.com/api/v13/modules/hookEvents.html>
- <https://foundryvtt.com/api/v13/classes/foundry.abstract.DataModel.html>

This is preferable to creating a Scene and immediately issuing a second update.

## Batch repair

`Scene.updateDocuments` is a public bulk document-update API and accepts an array of differential updates.

Reference:
<https://foundryvtt.com/api/v13/classes/foundry.documents.Scene.html>

This is used instead of one network/database update per existing Scene.

## World settings

`game.settings.register` supports world-scope settings for rule variants that should apply to everyone, and `registerMenu` supports a restricted GM submenu.

Reference:
<https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html>

## Active GM

Foundry exposes an active-GM designation specifically for workflows where only one client should act.

Reference:
<https://foundryvtt.com/api/v13/classes/foundry.documents.User.html>

## Fog exploration records

`FogExplorationData` stores the Scene ID, User ID, explored texture/state, and timestamp. `FogExploration.load({scene, user})` obtains a record for one Scene/User pair, while the document class exposes standard public bulk deletion.

References:

- <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.FogExplorationData.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>

## Canvas fog refresh

The public `canvas.fog` singleton is a `FogManager`; its `initialize()` method reinitializes the active canvas fog state. The module uses this only after an explicit purge and only when the active Scene was affected.

Reference:
<https://foundryvtt.com/api/v13/classes/foundry.canvas.perception.FogManager.html>

## Manifest and packaging

Foundry requires `module.json` at the module root with an `id` matching the directory name and recommends ES modules through the `esmodules` manifest field.

References:

- <https://foundryvtt.com/article/module-development/>
- <https://foundryvtt.com/article/package-management/>
