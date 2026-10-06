# Security, Permissions, and Data Safety

## Permissions

The dashboard is registered as a restricted settings menu and is intended for GMs.

Mutating public API functions independently check `game.user.isGM`, so calling them directly does not bypass the GM requirement.

Pre-create and pre-update policy enforcement may run on the initiating client because Foundry's pre-document hooks fire there. This does not grant new permissions; it only constrains a Scene operation the user was already authorized to perform.

## Active-GM coordination

Startup and defensive post-operation repairs use Foundry's active-GM designation so multiple connected GMs do not independently perform the same automatic repair.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.documents.Users.html>

## Error disclosure

User-facing notifications are concise and actionable. Full exception/cause detail is written to the browser console for the GM rather than exposing large stack traces in ordinary UI notifications.

Expected validation failures use stable Runyth Fog Policy error codes so bug reports can identify the failing subsystem without relying on fragile message text.

## Import bounds and validation

Backup/selection import is deliberately bounded and validated before mutation:

- maximum JSON file size: 5 MiB;
- maximum imported Scene entries: 100,000;
- schema identifier and schema version are mandatory;
- required fields and primitive types are checked;
- unsupported formats fail before Scene changes;
- same-World backups prefer stable Scene IDs;
- cross-World imports only use a unique normalized Scene-name + folder-path match;
- ambiguous candidates are reported and never guessed.

The dashboard writes Scene/folder names with DOM `textContent`; imported/user-defined names are not inserted as arbitrary HTML.

## Backup scope

Runyth Fog Policy backup JSON preserves the policy-related state it owns or intentionally manages:

- Scene identity metadata;
- folder path used for portable matching;
- Scene `fog.exploration` value;
- Runyth Fog Policy exemption state;
- optionally, module world settings.

It **does not** include Foundry's binary/base64 stored Fog Exploration texture/history. Therefore a policy backup cannot resurrect exploration history after an explicit purge. A normal Foundry World/data backup remains the recovery mechanism for that destructive operation.

## Settings restoration

When a backup requests global-setting restoration, current setting values are captured first. If a later setting write fails, the module attempts to roll back the settings already changed by that operation. Any rollback failure is reported rather than hidden.

## Destructive operations

Deleting stored Fog Exploration is the only intentionally destructive action. It:

- is never automatic;
- requires a GM;
- requires an explicit dashboard confirmation;
- can be scoped to selected Scenes;
- uses Foundry document APIs rather than filesystem/database manipulation;
- processes discovery/deletion in bounded work units and reports partial failures.

A Foundry World/data backup is recommended before purge.

## Module directory

No mutable World state is stored under the module installation directory. The module uses normal Foundry world settings and Scene flags, avoiding state loss when the module directory is replaced during updates or migration.
