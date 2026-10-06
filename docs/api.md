# Public API

The API is exposed at:

```text
game.modules.get("runyth-fog-policy").api
```

All mutating operations require a GM.

## `version`

String containing the API/module version.

## `audit()`

Returns the current world-Scene audit without modifying data.

Result shape:

```text
{
  total,
  managed,
  exempt,
  compliant,
  nonCompliant,
  rows: [
    {
      id,
      name,
      exempt,
      managed,
      exploration,
      compliant,
      status
    }
  ]
}
```

## `repair(options?)`

Equivalent to the dashboard's bulk repair operation.

```text
await api.repair({ notify: false });
```

Returns:

```text
{ updated, reason }
```

## `purgeStoredExploration(options?)`

Permanently deletes discovered `FogExploration` documents for managed Scenes.

```text
await api.purgeStoredExploration();
```

Optional:

```text
await api.purgeStoredExploration({ includeExempt: true });
```

Returns:

```text
{ deleted, scenes }
```

This is destructive and is not automatically invoked by the module.

## `setSceneExempt(sceneId, exempt)`

Sets or removes the effective exemption flag.

```text
await api.setSceneExempt(scene.id, true);
await api.setSceneExempt(scene.id, false);
```

Removing an exemption immediately repairs the Scene if necessary and if the policy is enabled.

## `isSceneExempt(scene)`

Returns the stored namespaced exemption flag. This reports the flag itself; the global **Allow per-Scene exemptions** setting determines whether it is currently honored.

## `openDashboard()`

Opens the GM dashboard.

```text
api.openDashboard();
```

## Stability

The public API is versioned with the module. Methods listed here are intended for integrations; files and non-exported functions remain implementation details.
