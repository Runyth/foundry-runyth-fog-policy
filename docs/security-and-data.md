# Security, Permissions, and Data Safety

## Permissions

The dashboard is registered as a restricted settings menu and is intended for GMs.

Mutating public API functions independently check `game.user.isGM`, so calling them directly does not bypass the GM requirement.

Pre-create and pre-update policy enforcement may run on the initiating client because Foundry's pre-document hooks fire only there. This does not grant new permissions; it only modifies a Scene operation the user was already authorized to perform.

## Active-GM coordination

Startup and defensive post-operation repairs are performed only by Foundry's active GM client. This prevents duplicate repair requests in multi-GM sessions.

Reference: <https://foundryvtt.com/api/v13/classes/foundry.documents.User.html>

## Destructive operations

Deleting stored Fog Exploration is the only intentionally destructive action. It:

- is never automatic;
- requires a GM;
- requires an explicit dashboard confirmation when invoked through the UI;
- uses Foundry document APIs rather than filesystem/database manipulation.

A World backup is recommended before purge.

## Module directory

No mutable world state is stored under the module installation directory. The module uses normal Foundry world settings and Scene flags, avoiding state loss when the module directory is replaced during updates or migration.
