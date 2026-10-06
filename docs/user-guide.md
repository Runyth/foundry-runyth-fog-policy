# GM User Guide

## Recommended strict setup

Leave all default settings enabled.

After module activation and World reload:

1. the active GM repairs existing non-exempt Scenes automatically;
2. new and imported world Scenes are created with Fog Exploration disabled;
3. attempts to turn Fog Exploration back on are corrected;
4. players receive no policy notifications.

## Audit

Open the **Fog Policy Dashboard** from Module Settings.

A compliant managed Scene shows:

- **Fog Exploration:** Disabled
- **Policy status:** Compliant

If a Scene is non-compliant, use **Repair all managed Scenes**.

## Scene exemptions

Use **Add exemption** for a Scene that intentionally needs Foundry's persistent explored-map behavior.

Examples might include:

- a strategic overworld map;
- a player-owned headquarters map;
- a deliberately persistent dungeon map.

Removing an exemption immediately restores the strict policy.

If you disable **Allow per-Scene exemptions**, existing exemption flags are retained but ignored. Re-enabling the setting restores them.

## Purging historical exploration

The strict policy does not automatically destroy old Fog Exploration records. This is deliberate because the deletion cannot be undone from the module.

To remove them permanently:

1. make a World backup;
2. open the Fog Policy Dashboard;
3. select **Purge stored exploration**;
4. read the confirmation;
5. confirm.

The operation applies to managed Scenes and every World user whose saved exploration can be discovered through Foundry's public API.

## Temporarily disabling the policy

Turn off **Enable strict Fog Exploration policy**.

The module stops repairing/enforcing Scenes. It does not automatically re-enable Fog Exploration anywhere; that remains under normal Foundry Scene configuration.

## Uninstalling

Disabling or uninstalling the module does not remove Scene exemption flags or change already-compliant Scene values. If you want Foundry's standard persistent exploration again, re-enable `Fog Exploration` on the desired Scenes after disabling the module.
