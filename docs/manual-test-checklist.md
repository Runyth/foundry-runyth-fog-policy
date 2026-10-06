# Manual Foundry v13 Acceptance Checklist

Automated tests cannot instantiate a real Foundry browser/server runtime. Perform these checks in a disposable Foundry v13 World before publishing broadly.

## Startup and settings

- [ ] Module enables without console errors or deprecation warnings.
- [ ] All Runyth Fog Policy settings appear under Module Settings.
- [ ] Dashboard opens only for a GM.
- [ ] English localization renders without untranslated keys.
- [ ] German localization renders without untranslated keys.
- [ ] A player cannot invoke mutating public API operations.
- [ ] Serious GM-facing failures produce a concise notification and a detailed `Runyth Fog Policy` console entry.

## Existing Scenes and resilient repair

- [ ] Create at least 20 Scenes with mixed Fog Exploration values before enabling the module.
- [ ] Enable the module and reload as one GM.
- [ ] Exactly the non-exempt Scenes with Fog Exploration enabled are repaired.
- [ ] Reload again and confirm the repair is idempotent with zero further Scene changes.
- [ ] Connect a second GM/assistant and confirm only the active GM performs startup repair.
- [ ] Simulate or intercept one Scene update failure and confirm other repair batches still complete.
- [ ] Confirm the dashboard reports partial failures instead of incorrectly reporting total success.

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

## Scalable dashboard and hierarchy

- [ ] Test a World with deeply nested Scene folders, including at least six nesting levels.
- [ ] Test at least several hundred Scenes; if practical, test 1,000+ Scenes and hundreds of folders.
- [ ] Open the dashboard and confirm it becomes usable without rendering every Scene/folder row into the DOM.
- [ ] Scroll rapidly through the Scene list and confirm rows remain responsive and visually stable.
- [ ] Scroll rapidly through the folder hierarchy and confirm indentation/path relationships remain correct.
- [ ] Confirm the folder picker is a bounded, scrollable hierarchical list rather than an unbounded native select.
- [ ] Confirm Scene/folder selection controls do not use huge native drop-downs.
- [ ] Confirm there are no costly list-entry animations or transitions while filtering, scrolling, or selecting.
- [ ] Confirm keyboard focus remains visible and controls remain usable at browser zoom levels 80%, 100%, 125%, and 150%.

## Search and filtering

- [ ] Search Scene names with ordinary text.
- [ ] Verify search is case-insensitive and diacritic-insensitive.
- [ ] Verify multiple unqualified search terms are combined with AND semantics.
- [ ] Verify quoted phrases work.
- [ ] Verify structured fields: `name:`, `folder:`, `status:`, `fog:`, `exempt:`, and `id:`.
- [ ] Verify short aliases such as `n:` and `f:`.
- [ ] Filter to compliant/non-compliant Scenes.
- [ ] Filter Fog Exploration enabled/disabled.
- [ ] Search folders independently of Scene search.
- [ ] Select one folder with descendants disabled and confirm only direct Scenes are targeted.
- [ ] Enable descendants and confirm all nested descendant folders are targeted.
- [ ] Select multiple unrelated folders and confirm the union is correct.
- [ ] Select the root/unfoldered entry and confirm it means only unfoldered Scenes, not every Scene.
- [ ] Test malformed/cyclic folder metadata in a disposable data fixture if possible and confirm the dashboard does not hang.

## Bulk selection

- [ ] Select all currently filtered Scenes.
- [ ] Invert selection for the currently filtered result set.
- [ ] Clear selection.
- [ ] Change filters and confirm selection state remains predictable.
- [ ] Repair only selected Scenes.
- [ ] Add exemptions to selected Scenes.
- [ ] Remove exemptions from selected Scenes.
- [ ] Purge stored exploration only for selected Scenes.

## Backup and export

- [ ] Export a backup for selected Scenes.
- [ ] Export a backup for all currently filtered Scenes.
- [ ] Export with global module settings included.
- [ ] Export without global settings.
- [ ] Inspect the JSON and confirm it contains policy state/identity metadata but no binary/base64 Fog Exploration texture history.
- [ ] Export a lightweight Scene selection file.
- [ ] Confirm filenames are safe and useful.

## Backup import and restore

- [ ] Import a same-World backup and confirm stable Scene IDs are preferred.
- [ ] Import into a different disposable World and confirm fallback matching uses unique Scene name + folder path.
- [ ] Create duplicate name/path candidates and confirm they are reported as ambiguous rather than guessed.
- [ ] Delete/rename a Scene referenced by the backup and confirm it is reported as unmatched.
- [ ] Restore Scene exemptions.
- [ ] Restore Fog Exploration settings while strict policy is enabled and confirm prohibited `true` states are reported as conflicts rather than bypassing policy.
- [ ] Restore global settings and verify all selected settings are applied.
- [ ] Enable the pre-import safety-backup option and confirm a backup is downloaded before mutation.
- [ ] Import invalid JSON and confirm a clear validation error is shown without changing the World.
- [ ] Import a valid JSON object with an unsupported schema/version and confirm it is rejected clearly.
- [ ] Attempt to import an oversized file and confirm it is rejected before parsing/mutation.
- [ ] Simulate a settings-write failure and confirm already-changed settings are rolled back where possible and rollback failures are explicitly reported.

## Selection import

- [ ] Export a Scene selection.
- [ ] Import it using replace-selection mode.
- [ ] Import it using add-to-selection mode.
- [ ] Confirm unmatched and ambiguous Scenes are reported.
- [ ] Confirm importing a selection never changes Scene policy state by itself.

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
- [ ] Create saved Fog Exploration for at least two users on multiple Scenes before strict enforcement.
- [ ] Purge only a selected subset of Scenes.
- [ ] Cancel the first confirmation and verify nothing is deleted.
- [ ] Invoke again and confirm.
- [ ] Verify stored exploration is removed only for targeted managed Scenes/users.
- [ ] Verify exempt Scenes remain excluded unless explicitly included by the selected operation.
- [ ] Verify the active canvas redraws without console errors.
- [ ] Simulate one failed discovery/deletion/reset and confirm successful work is retained and the failure counts are surfaced.

## Regression and interoperability

- [ ] Disable the module and confirm core Scene configuration behaves normally.
- [ ] Re-enable it and confirm policy state persists.
- [ ] Update/reinstall the module folder and confirm World settings/exemptions remain intact.
- [ ] Test with at least one module that adds Scene configuration UI.
- [ ] Confirm no player receives noisy routine notifications.
- [ ] Confirm opening/closing the dashboard repeatedly does not leave duplicate listeners or increasing timers.
- [ ] Confirm dashboard scroll/search remains responsive after repeated refreshes and Scene changes.
