# Known Limitations

## Live Foundry acceptance

Automated tests run outside a live Foundry browser/server runtime. A complete v13 acceptance checklist is included and remains required before broad deployment claims.

## Backup scope

Runyth Fog Policy backup files contain policy/configuration state, not the potentially large per-user FogExploration explored-map payload. They cannot restore fog history after a purge. Use a proper Foundry World/UserData backup when that data itself must be recoverable.

## Conflicting policy modules

A different module that deliberately writes contradictory Scene fog values can produce a policy conflict. The defensive active-GM repair improves resilience but does not attempt invasive hook ordering or monkey-patching.

## Orphaned FogExploration records

Purge discovers current Scene/User records through public loads plus currently available FogExploration collection entries. Records referring to deleted users that are not exposed through the collection may not be discoverable through the public query surface used here.

## Purge cost

Purge remains proportional to the number of targeted Scenes × current users because Foundry's public `FogExploration.load` API is keyed by Scene/User. v1.0.1 bounds concurrency and memory and allows selecting only the necessary Scenes, but cannot make the underlying number of required public lookups constant.

## Foundry v14+

This release is intentionally blocked above v13. A later compatibility release must translate the policy to v14 fog-mode semantics.
