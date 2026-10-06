# Runyth Fog Policy 1.0.0 Release Notes

Initial production release for Foundry VTT v13.

## What it solves

Runyth Fog Policy converts Foundry's per-Scene `Fog Exploration` checkbox into an enforceable World policy. With the default settings, existing world Scenes are repaired automatically, new/imported world Scenes are created with persistent exploration disabled, and later attempts to re-enable it are corrected.

## GM controls

- World-level policy master switch.
- Automatic startup repair for existing Scenes.
- Create/import enforcement for future Scenes.
- Update enforcement for managed Scenes.
- Optional per-Scene exemptions.
- Audit and repair dashboard.
- Explicit confirmed purge of historical per-user Fog Exploration records.

## Safety

Historical Fog Exploration data is never deleted automatically. The destructive purge is GM-only and separate from normal policy enforcement. Compendium Scene documents are not modified in place.

## Compatibility

This release intentionally supports Foundry VTT v13 only. It is system-agnostic and has no required modules or third-party runtime dependencies.
