# GM User Guide

## Recommended strict setup

Leave all default settings enabled.

After module activation and World reload:

1. the active GM repairs existing non-exempt Scenes automatically;
2. new and imported world Scenes are created with Fog Exploration disabled;
3. attempts to turn Fog Exploration back on are corrected;
4. players receive no routine policy notifications.

## Dashboard workflow

Open **Game Settings → Configure Settings → Module Settings → Runyth Fog Policy → Open Fog Policy Dashboard**.

The dashboard is designed around filtering first and applying bulk actions second. Both the Scene list and Scene-folder hierarchy are windowed/virtualized, so large Worlds do not create one DOM row per Scene/folder.

### Search

Ordinary search terms are ANDed together. Quoted terms preserve spaces.

Structured fields are:

```text
name:
folder:
status:
fog:
exempt:
id:
```

`n:` and `f:` are shortcuts for `name:` and `folder:`.

Examples:

```text
crypt
name:"Old Crypt"
folder:"Balenos / Velia" fog:enabled
status:noncompliant exempt:no
```

Unknown field prefixes remain literal text rather than silently broadening the query.

### Folder filtering

The folder picker is a searchable, scrollable hierarchy. Select one or more folders and choose whether descendant folders are included. The **Unfoldered** pseudo-entry targets only Scenes that have no folder.

Folder search retains matching folders together with their ancestor context so deep matches remain understandable.

### Bulk selection

Use:

- **Select filtered** to select every Scene currently visible through the active filters;
- **Invert filtered** to invert only the current filtered set;
- **Clear selection** to start again;
- **Selected only** to inspect the selected subset.

Bulk repair, exemption management, purge, backup, and selection export can then operate on the intended subset instead of the whole World.

## Audit and repair

A compliant managed Scene shows:

- **Fog Exploration:** Disabled
- **Policy status:** Compliant

**Repair selected** only repairs the current selection. **Repair all** repairs all managed World Scenes.

Bulk writes are bounded. If one Scene update fails, the module isolates the failing update while retaining successful batches and reports a partial failure rather than falsely reporting all-or-nothing success.

## Scene exemptions

Use **Add exemption** for a Scene that intentionally needs Foundry's persistent explored-map behavior. Exemption controls are disabled while global exemption support is disabled.

Examples might include:

- a strategic overworld map;
- a player-owned headquarters map;
- a deliberately persistent dungeon map.

Removing an exemption immediately restores the strict policy where appropriate.

If you disable **Allow per-Scene exemptions**, existing exemption flags are retained but ignored. Re-enabling the setting restores them.

## Policy backups

Under **Backup & transfer**, choose whether export should use:

- selected Scenes; or
- every Scene matching the current filters.

A policy backup can include the module's World settings and stores Scene identity, folder path, Fog Exploration setting, and exemption state.

It does **not** store Foundry's large per-user explored-fog image/history payloads. Use a normal Foundry World/data backup when those records themselves must be recoverable.

### Importing a backup

Import can independently restore:

- exemptions;
- Fog Exploration values where the currently active policy permits them;
- included World settings;
- the matched Scenes into the dashboard selection.

Keep **Create safety backup** enabled for normal use. The module downloads the current policy state for matched Scenes before applying the imported changes.

In the same World, Scene IDs are preferred. Across Worlds, matching falls back only to a unique Scene name plus hierarchical folder path. Ambiguous matches are never guessed.

## Selection export/import

A selection file is lighter than a backup. It stores only enough Scene identity metadata to reconstruct a dashboard selection.

Importing a selection can replace or add to the current selection and never changes Scene policy settings by itself.

## Purging historical exploration

The strict policy does not automatically destroy old Fog Exploration records. This is deliberate because the deletion cannot be undone from a Runyth policy backup.

To remove historical exploration:

1. make a normal Foundry World/data backup;
2. filter and select the exact Scenes to purge;
3. choose **Purge selected**;
4. read the confirmation;
5. confirm.

Discovery and deletion run in bounded work units. If some discovery/deletion/reset operations fail, the successful work remains completed and the dashboard reports the incomplete portion explicitly.

## Temporarily disabling the policy

Turn off **Enable strict Fog Exploration policy**.

The module stops repairing/enforcing Scenes. It does not automatically re-enable Fog Exploration anywhere; that remains under normal Foundry Scene configuration.

## Error reports

Classified failures use stable `RFP-*` codes. When reporting a problem, include:

- the `RFP-*` code shown in the GM notification;
- the detailed `Runyth Fog Policy` browser-console entry;
- Foundry v13 build;
- module version;
- the operation being performed.

## Uninstalling

Disabling or uninstalling the module does not remove Scene exemption flags or change already-compliant Scene values. If you want Foundry's standard persistent exploration again, re-enable `Fog Exploration` on the desired Scenes after disabling the module.
