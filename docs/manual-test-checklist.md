# Manual Foundry v13 Acceptance Checklist

Automated tests cannot instantiate a real Foundry browser/server runtime. Perform these checks in a disposable Foundry v13 World before publishing broadly.

## Startup and settings

- [ ] Module enables without console errors or deprecation warnings.
- [ ] All Runyth Fog Policy settings appear under Module Settings.
- [ ] Dashboard opens only for a GM.
- [ ] English localization renders without untranslated keys.
- [ ] German localization renders without untranslated keys.

## Existing Scenes

- [ ] Create at least five Scenes with mixed Fog Exploration values before enabling the module.
- [ ] Enable module and reload as one GM.
- [ ] Exactly the non-exempt Scenes with Fog Exploration enabled are repaired.
- [ ] Reload again and confirm the repair is idempotent with zero further Scene changes.
- [ ] Connect a second GM/assistant and confirm only the active GM performs startup repair.

## New and imported Scenes

- [ ] Create a new Scene with Foundry defaults and confirm Fog Exploration is stored disabled.
- [ ] Duplicate an existing Scene and confirm the new world Scene is compliant.
- [ ] Import a Scene from a compendium and confirm the imported world Scene is compliant.
- [ ] Confirm the source compendium Scene was not modified.

## Update enforcement

- [ ] Open a managed Scene configuration and attempt to enable Fog Exploration.
- [ ] Save and confirm the stored value remains disabled.
- [ ] Disable update enforcement and confirm manual Scene changes are no longer blocked.
- [ ] Re-enable update enforcement and run Repair to restore compliance.

## Exemptions

- [ ] Add a Scene exemption from the dashboard.
- [ ] Enable Fog Exploration on the exempt Scene and confirm it remains enabled.
- [ ] Remove the exemption and confirm the Scene is immediately repaired.
- [ ] Disable global exemption support and confirm stored exemption flags are ignored but retained.
- [ ] Re-enable global exemption support and confirm prior exemptions become effective again.

## Fog behavior

- [ ] On a managed Scene with Token Vision, verify a player sees current line of sight normally.
- [ ] Move the token away and verify previously visible areas are no longer retained through Scene Fog Exploration.
- [ ] Test walls, doors, darkness, and multiple player-owned tokens.

## Stored exploration purge

- [ ] Back up the test World.
- [ ] Create saved Fog Exploration for at least two users on two Scenes before strict enforcement.
- [ ] Open the dashboard and invoke purge.
- [ ] Cancel the first confirmation and verify nothing is deleted.
- [ ] Invoke again and confirm.
- [ ] Verify stored exploration is removed for the targeted managed Scenes/users.
- [ ] Verify exempt Scenes are not purged by the default dashboard operation.
- [ ] Verify the active canvas redraws without console errors.

## Regression and interoperability

- [ ] Disable the module and confirm core Scene configuration behaves normally.
- [ ] Re-enable it and confirm policy state persists.
- [ ] Update/reinstall the module folder and confirm World settings/exemptions remain intact.
- [ ] Test with at least one module that adds Scene configuration UI.
- [ ] Confirm no player receives noisy routine notifications.
