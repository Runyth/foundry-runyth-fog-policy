# Public API

The API is exposed at:

```text
game.modules.get("runyth-fog-policy").api
```

All mutating operations require a GM or Assistant GM.

## `version`

String containing the module/API version.

## `audit(options?)`

Returns the current world-Scene audit without modifying data.

```text
api.audit()
api.audit({ sceneIds: [sceneIdA, sceneIdB] })
```

Result includes `total`, `managed`, `exempt`, `compliant`, `nonCompliant`, and detailed `rows`.

## `repair(options?)`

Repairs all managed Scenes or a supplied Scene subset.

```text
await api.repair({ notify: false });
await api.repair({ sceneIds: [sceneIdA, sceneIdB] });
```

Bulk writes are bounded and isolate failed Scene updates. Result shape:

```text
{
  updated,
  failed,
  missing,
  reason
}
```

## `setSceneExempt(sceneId, exempt)`

Updates one Scene exemption.

```text
await api.setSceneExempt(scene.id, true);
```

## `setScenesExempt(sceneIds, exempt)`

Bulk exemption operation.

```text
await api.setScenesExempt([sceneA.id, sceneB.id], false);
```

Result includes `updated`, `failed`, `missing`, and the requested `exempt` value.

## `purgeStoredExploration(options?)`

Permanently deletes discovered `FogExploration` documents.

```text
await api.purgeStoredExploration();
await api.purgeStoredExploration({
  sceneIds: [sceneA.id, sceneB.id],
  includeExempt: true
});
```

Result:

```text
{
  deleted,
  failedDeletes,
  discoveryFailures,
  resetFailures,
  scenes,
  missing
}
```

This operation is destructive and is never invoked automatically.

## `restoreSceneStates(matches, options?)`

Low-level integration method used by backup restore. `matches` must contain imported/current Scene pairs produced by a trusted integration.

```text
await api.restoreSceneStates(matches, {
  restoreExemptions: true,
  restoreFog: true
});
```

The method never bypasses active policy enforcement. A requested `fog.exploration = true` that would immediately violate the current strict policy is recorded as a conflict and left disabled.

## `isSceneExempt(scene)`

Returns the stored namespaced exemption flag. The global **Allow per-Scene exemptions** setting determines whether that flag is currently honored.

## `openDashboard()`

Opens the GM dashboard.

## Error behavior

Operational failures use explicit `RFP-*` error codes where the module can classify the failure. Bulk APIs return partial-failure counts and log isolated failures rather than converting every partial result into an all-or-nothing exception.

## Stability

Methods documented here are the supported integration surface for v1.0.1. Internal files and non-exported helpers remain implementation details.
