# Foundry v13 API Research

Research date: 2026-10-07.

## Scene fog field

Foundry v13 defines `SceneData.fog.exploration: boolean`, controlling whether fog exploration progress is tracked for the Scene.

Reference: <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>

## Pending document creation

Foundry's generic pre-create hook is specialized by document type, such as `preCreateScene`. A pending document can be modified through `updateSource` before persistence. This avoids creating a Scene and immediately issuing a second write.

References:

- <https://foundryvtt.com/api/v13/modules/hookEvents.html>
- <https://foundryvtt.com/api/v13/classes/foundry.abstract.DataModel.html>

## Batch Scene repair

`Scene.updateDocuments` is the public bulk document-update mechanism used for World Scene updates.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.documents.Scene.html>

Runyth Fog Policy does not send an unbounded World-sized request. It uses bounded batches and, when a batch fails, recursively narrows only that failed batch to identify bad individual Scene updates while retaining already-successful work.

## Scene collection

`game.scenes` is Foundry's World Scene collection. The module derives an immutable dashboard/index view from this collection and refreshes that cache when necessary instead of repeatedly walking all Scenes for every selection/scroll event.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.documents.collections.Scenes.html>

## Folder hierarchy

Foundry's Folder documents expose hierarchy information and subfolder relationships. Scene folder IDs are indexed once into parent/child/path maps for filtering and descendant expansion. The module additionally guards against malformed/cyclic parent references to ensure hierarchy traversal terminates.

References:

- <https://foundryvtt.com/api/v13/classes/foundry.documents.Folder.html>
- <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>

## ApplicationV2

The dashboard uses the v13 `ApplicationV2`/`HandlebarsApplicationMixin` framework. Rendering hooks are used to bind a small fixed shell, while large Scene/folder result sets are rendered through module-owned virtual lists rather than inserting every result row at once. ApplicationV2 exposes current `position`, `setPosition`, `_onPosition`, and an awaited `_preClose` lifecycle; v1.0.2 uses those public lifecycle points for debounced geometry persistence and close-time flushing.

ApplicationV2 window configuration also supports `controls` entries with action/icon/label metadata. The dashboard Help action is registered through this native v13 header-control surface rather than modifying Foundry private frame internals.

References:

- <https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html>
- <https://foundryvtt.com/api/v13/functions/foundry.applications.api.HandlebarsApplicationMixin.html>
- <https://foundryvtt.com/api/v13/interfaces/foundry.applications.types.ApplicationWindowConfiguration.html>
- <https://foundryvtt.com/api/v13/interfaces/foundry.applications.types.ApplicationHeaderControlsEntry.html>

## World settings

`game.settings.register` supports world- and client-scope settings, and `registerMenu` supports a restricted settings submenu. Client scope is appropriate for dashboard geometry because it is tied to the current device/browser display environment.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.helpers.ClientSettings.html>

## Active GM

Foundry's users collection exposes `activeGM` for workflows where one connected GM should coordinate automatic work. Runyth Fog Policy prefers that designation for startup/defensive repair.

References:

- <https://foundryvtt.com/api/v13/classes/foundry.documents.Users.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.User.html>

## Notifications

Foundry's notifications API supports persistent/permanent messages. Runyth Fog Policy uses concise persistent GM notifications for serious actionable failures while preserving full diagnostic detail in the console.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.applications.ui.Notifications.html>

## Fog exploration records

`FogExplorationData` stores Scene/User exploration state. `FogExploration.load({scene, user})` obtains the record for a Scene/User pair, while the document class exposes standard public deletion operations.

References:

- <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.FogExplorationData.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>

Potential Scene × User exploration discovery can be large. The module therefore produces work lazily and keeps only a bounded number of unresolved queries in flight rather than materializing the Cartesian product in memory.

## Canvas fog refresh

The public `canvas.fog` singleton is a `FogManager`; its `initialize()` method can reinitialize active canvas fog after an explicit purge. Refresh errors are reported without falsely marking already-completed deletion as undone.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.canvas.perception.FogManager.html>

## Manifest and packaging

Foundry requires `module.json` at the module root with an `id` matching the directory name and supports ES modules through the `esmodules` manifest field.

References:

- <https://foundryvtt.com/article/module-development/>
- <https://foundryvtt.com/article/package-management/>
